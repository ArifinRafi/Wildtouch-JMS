import { Client } from "@/lib/models/Client";
import { Invoice, nextInvoiceNumber, serializeInvoice } from "@/lib/models/Invoice";
import { Order, nextOrderNumber, serializeOrder } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { logActivity } from "@/lib/activity";
import { normalizeCurrency } from "@/lib/currency";
import { buildCategoryLookup, groupIntoCategoryLines, priceLinesByCategory } from "@/lib/invoicing";
import { ensureOrderOnWhiteboard } from "@/lib/models/WhiteboardOrder";
import { normalizeOrderSource } from "@/lib/order-source";

export interface ConfirmedOrderInput {
  planogram?: { id?: string; name?: string };
  client?: Record<string, unknown>;
  agent?: Record<string, unknown>;
  orderSource?: string;
  lineItems?: Array<{ code?: string; description?: string; category?: string; qtyOrdered?: number }>;
  componentRequirements?: unknown[];
  shipping?: number;
  vatRate?: number;
  poNumber?: string;
  referenceNumber?: string;
  notes?: string;
}

/** Create the normal priced order, invoice and Digital Whiteboard task. */
export async function createConfirmedOrder(body: ConfirmedOrderInput) {
  const lineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
  if (!lineItems.length) throw new Error("no line items");
  if (!body.client?.name && !body.client?.clientId) throw new Error("client is required");

  const round2 = (n: number) => Math.round(n * 100) / 100;
  let vatRate = Math.max(0, Number(body.client?.vatRate ?? body.vatRate) || 0);
  let categoryPrices: Record<string, number> = {};
  let currency = normalizeCurrency(body.client?.pricingCurrency);
  const clientId = String(body.client?.clientId ?? "").trim();

  if (clientId) {
    const clientDoc = await Client.findById(clientId).lean<{
      vatRate?: unknown;
      categoryPrices?: Record<string, number>;
      pricingCurrency?: unknown;
    } | null>();
    if (clientDoc?.vatRate != null) {
      const dbRate = Number(clientDoc.vatRate);
      if (Number.isFinite(dbRate)) vatRate = Math.max(0, dbRate);
    }
    if (clientDoc?.categoryPrices && typeof clientDoc.categoryPrices === "object") categoryPrices = clientDoc.categoryPrices;
    if (clientDoc) currency = normalizeCurrency(clientDoc.pricingCurrency);
  }

  const products = await Product.find({}, { name: 1, code: 1, group: 1 }).lean();
  const normalizedLines = priceLinesByCategory(lineItems, buildCategoryLookup(products), categoryPrices);
  const subtotal = round2(normalizedLines.reduce((sum, line) => sum + line.lineTotal, 0));
  const shipping = round2(Math.max(0, Number(body.shipping) || 0));
  const vat = round2((subtotal * vatRate) / 100);
  const total = round2(subtotal + shipping + vat);

  const orderNumber = await nextOrderNumber();
  const order = await Order.create({
    orderNumber,
    status: "received",
    planogram: { id: String(body.planogram?.id ?? ""), name: String(body.planogram?.name ?? "") },
    client: body.client ?? {},
    agent: body.agent ?? {},
    orderSource: normalizeOrderSource(body.orderSource),
    lineItems: normalizedLines,
    componentRequirements: Array.isArray(body.componentRequirements) ? body.componentRequirements : [],
    subtotal,
    shipping,
    vatRate,
    vat,
    total,
    currency,
    poNumber: String(body.poNumber ?? ""),
    referenceNumber: String(body.referenceNumber ?? ""),
    notes: String(body.notes ?? ""),
  });

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
    currency,
    status: "issued",
  });

  try {
    await ensureOrderOnWhiteboard({
      orderId: String(order._id),
      orderNumber,
      customerName: String(body.client?.name || body.client?.clientId || "Client"),
      planogramName: String(body.planogram?.name ?? ""),
      agentName: String(body.agent?.name ?? ""),
      notes: String(body.notes ?? ""),
      lineItems: normalizedLines,
    });
  } catch (error) {
    await Promise.all([Invoice.deleteOne({ _id: invoice._id }), Order.deleteOne({ _id: order._id })]);
    throw new Error("could not add order to the digital whiteboard", { cause: error });
  }

  await logActivity({
    action: "confirmed",
    entityType: "order",
    entityName: orderNumber,
    entityId: String(order._id),
    quantity: normalizedLines.reduce((sum, line) => sum + line.qtyOrdered, 0),
    details: `for ${body.client?.name || body.client?.clientId || "client"}${body.agent?.name ? ` · agent ${body.agent.name}` : ""} — invoice ${invoiceNumber} created`,
  });

  return { order: serializeOrder(order.toObject()), invoice: serializeInvoice(invoice.toObject()) };
}
