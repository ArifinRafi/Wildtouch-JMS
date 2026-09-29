import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Employee } from "@/lib/models/Employee";
import { Client } from "@/lib/models/Client";
import { ProductGroup } from "@/lib/models/ProductGroup";
import { Order } from "@/lib/models/Order";
import { WastageLog, serializeWastageLog } from "@/lib/models/WastageLog";
import { prepareWastage } from "@/lib/wastage";

const dbName = "wildtouch_codex_wastage_smoke";

async function main() {
  await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
  const db = mongoose.connection.db;
  if (!db) throw new Error("test database connection missing");
  if ((await db.listCollections().toArray()).length) {
    await mongoose.disconnect();
    throw new Error(`Refusing to use non-empty test database ${dbName}`);
  }

  try {
    await Employee.create({ _id: "EMP-WASTAGE-QA", name: "QA Staff" });
    await Client.create({ _id: "CLT-WASTAGE-QA", name: "QA Client" });
    await Client.create({ _id: "CLT-OTHER-QA", name: "Other Client" });
    const group = await ProductGroup.create({ name: "QA Group" });
    await Order.create({ orderNumber: "ORD-WASTAGE-QA", client: { clientId: "CLT-WASTAGE-QA", name: "QA Client" } });

    const input = {
      date: "2026-09-29",
      staffId: "EMP-WASTAGE-QA",
      clientId: "CLT-WASTAGE-QA",
      orderNumber: "ORD-WASTAGE-QA",
      productGroupId: String(group._id),
      wasteQuantity: 3,
      note: "Damaged during packing",
      currency: "GBP",
      costItems: [{ description: "Damaged units", amount: 12.345 }, { description: "Labour", amount: 5 }],
    };
    const prepared = await prepareWastage(input);
    assert.equal(prepared.totalCost, 17.35);
    assert.equal(prepared.staffName, "QA Staff");
    assert.equal(prepared.clientName, "QA Client");
    assert.equal(prepared.productGroupName, "QA Group");
    await assert.rejects(prepareWastage({ ...input, clientId: "CLT-OTHER-QA" }), /does not belong/);
    const created = await WastageLog.create(prepared);
    const reread = await WastageLog.findById(created._id).lean();
    assert(reread);
    assert.equal(serializeWastageLog(reread).totalCost, 17.35);
    assert.equal(reread.wasteQuantity, 3);

    const edited = await prepareWastage({ ...input, note: "Reworked", costItems: [{ description: "Rework", amount: 4.5 }] });
    const updated = await WastageLog.findByIdAndUpdate(created._id, { $set: edited }, { returnDocument: "after", runValidators: true }).lean();
    assert(updated);
    assert.equal(updated.totalCost, 4.5);
    assert.equal(updated.note, "Reworked");
    await WastageLog.deleteOne({ _id: created._id });
    assert.equal(await WastageLog.countDocuments(), 0);
    process.stdout.write("PASS: wastage create/edit/delete, snapshots, total calculation, client-order validation\n");
  } finally {
    await db.dropDatabase();
    process.stdout.write(`Removed isolated test database ${dbName}\n`);
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
