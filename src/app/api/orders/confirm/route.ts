import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, nextOrderNumber, serializeOrder } from "@/lib/models/Order";
import { Invoice, nextInvoiceNumber, serializeInvoice } from "@/lib/models/Invoice";
import { Client } from "@/lib/models/Client";
import { Product } from "@/lib/models/Product";
import { buildCategoryLookup, priceLinesByCategory, groupIntoCategoryLines } from "@/lib/invoicing";
import { logActivity } from "@/lib/activity";

interface LineItemInput {
  code?: string;
  description?: string;
  category?: string;
  qtyOrdered?: number;
}

/**
 * Confirm an order: creates the Order (product-level lines) and an Invoice
 * priced + grouped by product CATEGORY using the client's per-category prices.
 */
export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  const lineItems: LineItemInput[] = Array.isArray(body.lineItems) ? body.lineItems : [];
  if (lineItems.length === 0) {
    return NextResponse.json({ error: "no line items" }, { status: 400 });
  }
  if (!body.client?.name && !body.client?.clientId) {
    return NextResponse.json({ error: "client is required" }, { status: 400 });
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  // The client record is authoritative for VAT rate and category prices — the
  // snapshot the browser sends can be stale.
  let vatRate = Math.max(0, Number(body.client?.vatRate ?? body.vatRate) || 0);
  let categoryPrices: Record<string, number> = {};
  const clientId = String(body.client?.clientId ?? "").trim();
  if (clientId) {
    const clientDoc = await Client.findById(clientId).lean<{ vatRate?: unknown; categoryPrices?: Record<string, number> } | null>();
    if (clientDoc && clientDoc.vatRate != null) {
      const dbRate = Number(clientDoc.vatRate);
      if (Number.isFinite(dbRate)) vatRate = Math.max(0, dbRate);
    }
    if (clientDoc?.categoryPrices && typeof clientDoc.categoryPrices === "object") {
      categoryPrices = clientDoc.categoryPrices;
    }
  }

  // Resolve each product's category from the catalogue, then price it from the
  // client's category prices. Order lines stay product-level.
  const products = await Product.find({}, { name: 1, code: 1, group: 1 }).lean();
  const lookup = buildCategoryLookup(products);
  const normalizedLines = priceLinesByCategory(lineItems, lookup, categoryPrices);

  const subtotal = round2(normalizedLines.reduce((s, l) => s + l.lineTotal, 0));
  const shipping = round2(Math.max(0, Number(body.shipping) || 0));
  const vat = round2((subtotal * vatRate) / 100);
  const total = round2(subtotal + shipping + vat);

  // 1. Create the order
  const orderNumber = await nextOrderNumber();
  const order = await Order.create({
    orderNumber,
    status: "received",
    planogram: { id: String(body.planogram?.id ?? ""), name: String(body.planogram?.name ?? "") },
    client: body.client ?? {},
    lineItems: normalizedLines,
    componentRequirements: Array.isArray(body.componentRequirements) ? body.componentRequirements : [],
    subtotal,
    shipping,
    vatRate,
    vat,
    total,
    notes: String(body.notes ?? ""),
  });

  // 2. Create the invoice — one line per product CATEGORY, priced per client.
  const invoiceNumber = await nextInvoiceNumber();
  const invoice = await Invoice.create({
    invoiceNumber,
    orderId: order._id,
    orderNumber,
    client: body.client ?? {},
    lineItems: groupIntoCategoryLines(normalizedLines),
    subtotal,
    shipping,
    vatRate,
    vat,
    total,
    currency: "GBP",
    status: "issued",
  });

  await logActivity({
    action: "confirmed",
    entityType: "order",
    entityName: orderNumber,
    entityId: String(order._id),
    quantity: normalizedLines.reduce((s, l) => s + l.qtyOrdered, 0),
    details: `for ${body.client?.name || body.client?.clientId || "client"} — invoice ${invoiceNumber} created`,
  });

  return NextResponse.json(
    { order: serializeOrder(order.toObject()), invoice: serializeInvoice(invoice.toObject()) },
    { status: 201 },
  );
}
