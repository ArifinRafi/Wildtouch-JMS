import assert from "node:assert/strict";
import mongoose from "mongoose";
import { BusinessCost, serializeBusinessCost } from "@/lib/models/BusinessCost";
import { prepareBusinessCost } from "@/lib/business-cost";

const dbName = "wildtouch_codex_business_cost_smoke";

async function main() {
  await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
  const db = mongoose.connection.db;
  if (!db) throw new Error("test database connection missing");
  if ((await db.listCollections().toArray()).length) {
    await mongoose.disconnect();
    throw new Error(`Refusing to use non-empty test database ${dbName}`);
  }

  try {
    const input = {
      date: "2026-10-02",
      productService: "Packaging service",
      supplier: { name: "QA Supplier", contactName: "A Contact", address: "1 Test Road", email: "qa@example.com", telephone: "01234 567890" },
      quantity: "2.5",
      unitPrice: "12.40",
      currency: "EUR",
      note: "October order",
      paid: false,
      paymentDate: "",
      totalPrice: 999999,
    };
    const prepared = prepareBusinessCost(input);
    assert.equal(prepared.totalPrice, 31, "total must be computed from quantity and unit price");
    assert.equal(prepared.currency, "EUR");
    assert.equal(prepared.paymentDate, "");
    assert.throws(() => prepareBusinessCost({ ...input, paid: true }), /payment date/);
    assert.throws(() => prepareBusinessCost({ ...input, currency: "USD" }), /currency/);
    assert.throws(() => prepareBusinessCost({ ...input, supplier: { ...input.supplier, email: "bad email" } }), /email/);

    const created = await BusinessCost.create(prepared);
    const reread = await BusinessCost.findById(created._id).lean();
    assert(reread);
    assert.equal(serializeBusinessCost(reread).totalPrice, 31);
    assert.equal(reread.supplier.contactName, "A Contact");
    assert.equal(await BusinessCost.countDocuments({ paid: false, date: { $gte: "2026-10-01", $lte: "2026-10-31" } }), 1);

    const paid = prepareBusinessCost({ ...input, paid: true, paymentDate: "2026-10-03", unitPrice: "13.00" });
    const updated = await BusinessCost.findByIdAndUpdate(created._id, { $set: paid }, { returnDocument: "after", runValidators: true }).lean();
    assert(updated);
    assert.equal(updated.totalPrice, 32.5);
    assert.equal(updated.paymentDate, "2026-10-03");
    assert.equal(await BusinessCost.countDocuments({ paid: true }), 1);
    await BusinessCost.deleteOne({ _id: created._id });
    assert.equal(await BusinessCost.countDocuments(), 0);
    process.stdout.write("PASS: business cost totals, EUR, supplier, date range, paid/completed, validation, edit/delete\n");
  } finally {
    await db.dropDatabase();
    process.stdout.write(`Removed isolated test database ${dbName}\n`);
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
