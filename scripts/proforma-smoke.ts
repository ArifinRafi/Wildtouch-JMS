import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Client } from "@/lib/models/Client";
import { Component } from "@/lib/models/Component";
import { Product } from "@/lib/models/Product";
import { ProformaInvoice, claimProformaApproval, releaseProformaApproval, nextProformaNumber } from "@/lib/models/ProformaInvoice";
import { Order } from "@/lib/models/Order";
import { Invoice } from "@/lib/models/Invoice";
import { WhiteboardOrderModel } from "@/lib/models/WhiteboardOrder";
import { prepareProforma } from "@/lib/orders/proforma";
import { createConfirmedOrderFromProforma } from "@/lib/orders/create-confirmed-order";
import { buildProformaHtml } from "@/lib/proforma-document-html";

const dbName = "wildtouch_codex_proforma_smoke";
process.env.MONGODB_URI = `mongodb://localhost:27017/${dbName}`;

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("test database connection missing");
  const collections = await db.listCollections().toArray();
  if (collections.length) throw new Error(`Refusing to use non-empty test database ${dbName}`);

  try {
    await Client.create({ _id: "CLT-CODEX-QA", name: "Codex QA Client", categoryPrices: { "QA Group": 12.5 }, pricingCurrency: "GBP", vatRate: 20 });
    await Product.create({ name: "QA Product", group: "QA Group", code: "QA-PRODUCT", planogramId: "qa-planogram", components: [{ code: "QA-COMP", label: "QA Component", qtyPerUnit: 2 }] });
    await Component.create({ code: "QA-COMP", description: "QA Component", qtyAvailable: 0 });

    const input = {
      planogram: { id: "qa-planogram", name: "QA Planogram" },
      client: { clientId: "CLT-CODEX-QA", name: "Codex QA Client", invoiceAddress: "QA test address", deliveryAddress: "QA test address" },
      orderSource: "email",
      lineItems: [{ code: "QA-PRODUCT", description: "QA Product", category: "QA Group", qtyOrdered: 2 }],
      grid: { rowQty: [[[2]]] },
      vatRate: 20,
      shipping: 3,
    };
    const prepared = await prepareProforma(input);
    assert.equal(prepared.total, 33);
    const quote = await ProformaInvoice.create({ ...prepared, proformaNumber: await nextProformaNumber() });
    assert.equal(await Order.countDocuments(), 0, "saving quote must not create order");
    assert.equal(await Invoice.countDocuments(), 0, "saving quote must not create invoice");
    assert.equal(await WhiteboardOrderModel.countDocuments(), 0, "saving quote must not create task");

    const edited = await prepareProforma({ ...input, shipping: 5 });
    await ProformaInvoice.updateOne({ _id: quote._id }, edited);
    const saved = await ProformaInvoice.findById(quote._id).lean();
    assert(saved);
    assert.equal(saved.total, 35);
    const documentHtml = buildProformaHtml({
      proformaNumber: saved.proformaNumber,
      client: saved.client as { name: string; invoiceAddress: string },
      lineItems: saved.lineItems,
      subtotal: saved.subtotal,
      shipping: saved.shipping,
      vatRate: saved.vatRate,
      vat: saved.vat,
      total: saved.total,
      currency: saved.currency,
      createdAt: new Date().toISOString(),
    });
    assert.match(documentHtml, /<title>Proforma Invoice /);
    assert.match(documentHtml, /Not a tax invoice/);
    assert.match(documentHtml, /Proforma Invoice No\./);
    assert(documentHtml.includes(saved.proformaNumber));
    assert.match(documentHtml, /£35\.00/);
    const claim = await claimProformaApproval(String(quote._id));
    assert(claim, "first approval must acquire the lease");
    assert.equal(await claimProformaApproval(String(quote._id)), null, "simultaneous approval must be blocked");
    await ProformaInvoice.updateOne({ _id: quote._id }, { approvalStartedAt: new Date(Date.now() - 3 * 60 * 1000) });
    const recovered = await claimProformaApproval(String(quote._id));
    assert(recovered, "stale approval must be recoverable");
    await releaseProformaApproval(String(quote._id), recovered.token);
    const approved = {
      sourceProformaId: String(quote._id),
      planogram: saved.planogram ?? undefined,
      grid: saved.grid as typeof input.grid,
      client: saved.client as Record<string, unknown>,
      agent: saved.agent as Record<string, unknown>,
      orderSource: saved.orderSource,
      lineItems: saved.lineItems.map((line) => ({ code: line.code, description: line.description, category: line.category, qtyOrdered: line.qtyOrdered, unitPrice: line.unitPrice, lineTotal: line.lineTotal })),
      shipping: saved.shipping,
      vatRate: saved.vatRate,
      subtotal: saved.subtotal,
      vat: saved.vat,
      total: saved.total,
      currency: saved.currency,
    };
    const first = await createConfirmedOrderFromProforma(approved);
    const second = await createConfirmedOrderFromProforma(approved);
    assert.equal(first.order.id, second.order.id, "retry must reuse order");
    assert.equal(first.invoice.id, second.invoice.id, "retry must reuse invoice");
    assert.equal(first.order.total, 35);
    assert.equal(first.invoice.total, 35);
    assert.equal((await Component.findOne({ code: "QA-COMP" }))?.qtyAvailable, 0, "proforma approval must not consume or require stock");
    assert.equal(await Order.countDocuments(), 1);
    assert.equal(await Invoice.countDocuments(), 1);
    assert.equal(await WhiteboardOrderModel.countDocuments(), 1);
    await ProformaInvoice.deleteOne({ _id: quote._id });
    assert.equal(await ProformaInvoice.countDocuments(), 0);
    process.stdout.write("PASS: proforma PDF labels, zero-stock conversion, order+invoice+task, idempotent retry, quote removed\n");
  } finally {
    await db.dropDatabase();
    process.stdout.write(`Removed isolated test database ${dbName}\n`);
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
