import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Invoice, serializeInvoice } from "@/lib/models/Invoice";

const dbName = "wildtouch_codex_invoice_status_smoke";

async function main() {
  await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
  const db = mongoose.connection.db;
  if (!db) throw new Error("test database connection missing");
  if ((await db.listCollections().toArray()).length) {
    await mongoose.disconnect();
    throw new Error(`Refusing to use non-empty test database ${dbName}`);
  }

  try {
    const created = await Invoice.create({ invoiceNumber: "INV-CODEX-QA", client: { name: "QA Client" } });
    assert.equal(created.status, "issued");
    const updated = await Invoice.findByIdAndUpdate(
      created._id,
      { $set: { status: "partial_payment_outstanding" }, $push: { comments: { text: "Awaiting balance", createdAt: new Date("2026-09-29T10:30:00Z"), createdBy: "QA Manager" } } },
      { returnDocument: "after", runValidators: true },
    ).lean();
    assert(updated);
    const serialized = serializeInvoice(updated);
    assert.equal(serialized.status, "partial_payment_outstanding");
    assert.equal(serialized.comments.length, 1);
    assert.equal(serialized.comments[0].text, "Awaiting balance");
    assert.equal(new Date(serialized.comments[0].createdAt as Date).toISOString(), "2026-09-29T10:30:00.000Z");
    assert.equal(serialized.comments[0].createdBy, "QA Manager");

    const reread = await Invoice.findById(created._id).lean();
    assert(reread);
    assert.equal(reread.status, "partial_payment_outstanding");
    assert.equal(reread.comments[0].text, "Awaiting balance");
    process.stdout.write("PASS: invoice status and timestamped comment persisted and serialized\n");
  } finally {
    await db.dropDatabase();
    process.stdout.write(`Removed isolated test database ${dbName}\n`);
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
