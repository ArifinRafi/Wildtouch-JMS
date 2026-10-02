import assert from "node:assert/strict";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { prepareCreditNote } from "@/lib/credit-note-input";
import { getCreditBalances, finalizeInvoiceCredit, restoreInvoiceCredit } from "@/lib/credit-notes";
import { Client } from "@/lib/models/Client";
import { CreditNote } from "@/lib/models/CreditNote";
import { Invoice } from "@/lib/models/Invoice";
import { Order } from "@/lib/models/Order";
import { createConfirmedOrderFromProforma } from "@/lib/orders/create-confirmed-order";
import { POST as createPartialInvoice } from "@/app/api/orders/[id]/partial-invoice/route";

const dbName = "wildtouch_codex_credit_note_smoke";
process.env.MONGODB_URI = `mongodb://localhost:27017/${dbName}`;

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("test database connection missing");
  if ((await db.listCollections().toArray()).length) throw new Error(`Refusing to use non-empty test database ${dbName}`);

  try {
    await Client.create({ _id: "CLT-CREDIT-QA", name: "Credit QA Client", pricingCurrency: "GBP" });
    const issue = async (amount: number, currency: "GBP" | "EUR") =>
      CreditNote.create({
        ...(await prepareCreditNote({ clientId: "CLT-CREDIT-QA", amount, currency, reason: "return", date: "2026-10-02", note: "QA return" }, "QA Admin")),
        creditNoteNumber: `CN-QA-${currency}-${amount}`,
      });
    const gbp1 = await issue(30, "GBP");
    const gbp2 = await issue(40, "GBP");
    const eur = await issue(25, "EUR");
    assert.deepEqual((await getCreditBalances("CLT-CREDIT-QA"))["CLT-CREDIT-QA"], { GBP: 70, EUR: 25 });

    const create = async (sourceProformaId: string, total: number, currency: "GBP" | "EUR") =>
      createConfirmedOrderFromProforma({
        sourceProformaId,
        planogram: { id: "qa", name: "QA Planogram" },
        client: { clientId: "CLT-CREDIT-QA", name: "Credit QA Client", invoiceAddress: "QA address", pricingCurrency: currency },
        orderSource: "email",
        lineItems: [{ code: "QA", description: "QA Product", category: "QA", qtyOrdered: 1, unitPrice: total, lineTotal: total }],
        subtotal: total,
        shipping: 0,
        vatRate: 0,
        vat: 0,
        total,
        currency,
      });

    const first = await create("credit-qa-first", 50, "GBP");
    assert.equal(first.invoice.creditApplied, 50);
    assert.equal(first.invoice.amountDue, 0);
    assert.equal(first.order.creditApplied, 50);
    const remaining = async (id: typeof gbp1._id) => (await CreditNote.findById(id))?.remainingCents;
    assert.equal(await remaining(gbp1._id), 0);
    assert.equal(await remaining(gbp2._id), 2000);
    assert.equal(await remaining(eur._id), 2500);
    await finalizeInvoiceCredit(first.invoice.id);
    const retried = await create("credit-qa-first", 50, "GBP");
    assert.equal(retried.invoice.id, first.invoice.id);
    assert.equal(await remaining(gbp2._id), 2000, "retry must not spend twice");

    const second = await create("credit-qa-second", 10, "GBP");
    assert.equal(second.invoice.creditApplied, 10);
    assert.equal(second.invoice.amountDue, 0);
    assert.equal(await remaining(gbp2._id), 1000);
    const third = await create("credit-qa-third", 10, "EUR");
    assert.equal(third.invoice.creditApplied, 10);
    assert.equal(await remaining(eur._id), 1500, "EUR credit must stay separate from GBP");
    assert.deepEqual((await getCreditBalances("CLT-CREDIT-QA"))["CLT-CREDIT-QA"], { GBP: 10, EUR: 15 });

    const fourth = await create("credit-qa-fourth", 25, "GBP");
    assert.equal(fourth.invoice.creditApplied, 10);
    assert.equal(fourth.invoice.amountDue, 15, "customer owes only the post-credit amount");
    const partialResponse = await createPartialInvoice(
      new NextRequest(`http://localhost:3000/api/orders/${fourth.order.id}/partial-invoice`, { method: "POST", body: JSON.stringify({ amount: 10 }) }),
      { params: Promise.resolve({ id: fourth.order.id }) },
    );
    assert.equal(partialResponse.status, 201);
    const partial = await partialResponse.json();
    assert.equal(partial.invoice.amountDue, 10);
    assert.equal(partial.invoice.priorCreditApplied, 10);
    assert.equal(partial.invoice.balanceDue, 5);
    assert.deepEqual(partial.invoice.creditNoteNumbers, fourth.invoice.creditNoteNumbers);
    assert.equal(await remaining(gbp2._id), 0, "partial invoices must not spend credit again");

    await restoreInvoiceCredit(second.invoice.id);
    await restoreInvoiceCredit(second.invoice.id);
    assert.equal(await remaining(gbp2._id), 1000, "restore must return only this invoice's credit once");
    assert.equal(await Invoice.countDocuments(), 5);
    assert.equal(await Order.countDocuments(), 4);
    process.stdout.write("PASS: same-currency allocation, multi-note use, carry-forward, partial invoice, retry safety, idempotent restoration\n");
  } finally {
    await db.dropDatabase();
    process.stdout.write(`Removed isolated test database ${dbName}\n`);
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
