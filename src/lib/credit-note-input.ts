import { Client } from "@/lib/models/Client";
import { nextCreditNoteNumber } from "@/lib/models/CreditNote";

export interface CreditNoteInput {
  clientId?: unknown;
  currency?: unknown;
  amount?: unknown;
  reason?: unknown;
  note?: unknown;
  date?: unknown;
}

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function prepareCreditNote(input: CreditNoteInput, createdBy: string) {
  const clientId = String(input.clientId ?? "").trim();
  const client = clientId ? await Client.findById(clientId).lean() : null;
  if (!client) throw new Error("select an existing client");
  const currency = input.currency;
  if (currency !== "GBP" && currency !== "EUR") throw new Error("currency must be GBP or EUR");
  if (input.amount === "" || input.amount == null) throw new Error("credit amount is required");
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
    throw new Error("credit amount must be a positive amount with at most two decimal places");
  }
  const amountCents = Math.round(amount * 100);
  const reason = input.reason;
  if (reason !== "return" && reason !== "not_delivered" && reason !== "other") throw new Error("select a credit reason");
  const note = String(input.note ?? "").trim();
  if (note.length > 2000) throw new Error("note must be 2000 characters or less");
  const date = String(input.date ?? "").trim();
  if (!isDate(date)) throw new Error("a valid credit note date is required");

  return {
    creditNoteNumber: nextCreditNoteNumber(),
    clientId,
    clientName: String(client.name ?? ""),
    currency,
    amountCents,
    remainingCents: amountCents,
    reason,
    note,
    date,
    status: "active" as const,
    applications: [],
    createdBy,
  };
}
