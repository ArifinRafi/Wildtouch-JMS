import { randomUUID } from "node:crypto";
import { CreditNote } from "@/lib/models/CreditNote";
import { Invoice } from "@/lib/models/Invoice";
import { Order } from "@/lib/models/Order";

const toCents = (amount: number) => Math.round((Number(amount) || 0) * 100);

/** Remaining, unvoided credit by client and currency. No cross-currency conversion. */
export async function getCreditBalances(clientId?: string) {
  const match: Record<string, unknown> = { status: "active", remainingCents: { $gt: 0 } };
  if (clientId) match.clientId = clientId;
  const rows = await CreditNote.aggregate<{ _id: { clientId: string; currency: string }; balanceCents: number }>([
    { $match: match },
    { $group: { _id: { clientId: "$clientId", currency: "$currency" }, balanceCents: { $sum: "$remainingCents" } } },
  ]);
  const balances: Record<string, { GBP: number; EUR: number }> = {};
  for (const row of rows) {
    const entry = balances[row._id.clientId] ?? { GBP: 0, EUR: 0 };
    if (row._id.currency === "GBP" || row._id.currency === "EUR") entry[row._id.currency] = row.balanceCents / 100;
    balances[row._id.clientId] = entry;
  }
  return balances;
}

/**
 * Apply active client credit to a newly created main invoice. Each note is
 * debited with a compare-and-swap update that also records the invoice ID,
 * so a retry after a crash can recover without spending credit twice.
 */
export async function finalizeInvoiceCredit(invoiceId: string) {
  const current = await Invoice.findById(invoiceId);
  if (!current) throw new Error("invoice not found for credit allocation");
  if (current.creditReversalPending) throw new Error("invoice credit reversal is in progress");
  if (current.creditFinalized !== false) {
    if (current.orderId) await Order.updateOne({ _id: current.orderId }, { $set: { creditApplied: current.creditApplied ?? 0 } });
    return current;
  }

  const token = randomUUID();
  const stale = new Date(Date.now() - 5 * 60 * 1000);
  const claimed = await Invoice.findOneAndUpdate(
    {
      _id: invoiceId,
      creditFinalized: false,
      creditReversalPending: false,
      $or: [{ creditStartedAt: null }, { creditStartedAt: { $exists: false } }, { creditStartedAt: { $lt: stale } }],
    },
    { $set: { creditStartedAt: new Date(), creditToken: token } },
    { returnDocument: "after" },
  );
  if (!claimed) {
    const latest = await Invoice.findById(invoiceId);
    if (latest?.creditFinalized) return latest;
    throw new Error("credit application is already in progress; retry shortly");
  }

  try {
    const clientId = String(claimed.client?.clientId ?? "").trim();
    const grossCents = toCents(claimed.total);
    const currency = claimed.currency;
    if (clientId && grossCents > 0 && (currency === "GBP" || currency === "EUR")) {
      const existing = await CreditNote.find({ "applications.invoiceId": invoiceId }).lean();
      let needed = grossCents - existing.reduce((sum, note) => sum + note.applications.filter((application) => application.invoiceId === invoiceId).reduce((part, application) => part + application.amountCents, 0), 0);
      let attempts = 0;
      while (needed > 0) {
        if (++attempts > 1000) throw new Error("could not allocate credit after concurrent changes");
        const note = await CreditNote.findOne({ clientId, currency, status: "active", remainingCents: { $gt: 0 }, "applications.invoiceId": { $ne: invoiceId } }).sort({ date: 1, createdAt: 1, _id: 1 }).lean();
        if (!note) break;
        const usedCents = Math.min(needed, note.remainingCents);
        const applied = await CreditNote.findOneAndUpdate(
          { _id: note._id, status: "active", remainingCents: note.remainingCents, "applications.invoiceId": { $ne: invoiceId } },
          { $inc: { remainingCents: -usedCents }, $push: { applications: { invoiceId, invoiceNumber: claimed.invoiceNumber, orderNumber: claimed.orderNumber, amountCents: usedCents, appliedAt: new Date() } } },
          { returnDocument: "after", runValidators: true },
        );
        if (applied) needed -= usedCents;
      }
    }

    const appliedNotes = await CreditNote.find({ "applications.invoiceId": invoiceId }).sort({ date: 1, createdAt: 1, _id: 1 }).lean();
    const appliedCents = appliedNotes.reduce((sum, note) => sum + note.applications.filter((application) => application.invoiceId === invoiceId).reduce((part, application) => part + application.amountCents, 0), 0);
    if (appliedCents > grossCents) throw new Error("credit allocation exceeds invoice total");
    const finalized = await Invoice.findOneAndUpdate(
      { _id: invoiceId, creditFinalized: false, creditToken: token, creditReversalPending: false },
      { $set: { creditApplied: appliedCents / 100, amountDue: (grossCents - appliedCents) / 100, creditNoteNumbers: appliedNotes.map((note) => note.creditNoteNumber), creditFinalized: true, creditStartedAt: null, creditToken: "" } },
      { returnDocument: "after", runValidators: true },
    );
    if (!finalized) throw new Error("credit allocation lock changed; retry invoice finalization");
    if (finalized.orderId) await Order.updateOne({ _id: finalized.orderId }, { $set: { creditApplied: finalized.creditApplied } });
    return finalized;
  } catch (error) {
    await Invoice.updateOne({ _id: invoiceId, creditToken: token, creditFinalized: false }, { $set: { creditStartedAt: null, creditToken: "" } });
    throw error;
  }
}

/** Return credit to its source notes before deleting an invoice. Safe to retry. */
export async function restoreInvoiceCredit(invoiceId: string) {
  const notes = await CreditNote.find({ "applications.invoiceId": invoiceId }).lean();
  for (const note of notes) {
    const amountCents = note.applications.filter((application) => application.invoiceId === invoiceId).reduce((sum, application) => sum + application.amountCents, 0);
    if (amountCents <= 0) continue;
    await CreditNote.updateOne(
      { _id: note._id, "applications.invoiceId": invoiceId },
      { $inc: { remainingCents: amountCents }, $pull: { applications: { invoiceId } } },
    );
  }
}
