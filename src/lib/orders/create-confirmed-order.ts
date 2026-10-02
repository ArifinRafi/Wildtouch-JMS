import { Client } from "@/lib/models/Client";
import { Invoice, nextInvoiceNumber, serializeInvoice } from "@/lib/models/Invoice";
import { Order, nextOrderNumber, serializeOrder } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { logActivity } from "@/lib/activity";
import { normalizeCurrency } from "@/lib/currency";
import { buildCategoryLookup, groupIntoCategoryLines, priceLinesByCategory } from "@/lib/invoicing";
import { ensureOrderOnWhiteboard } from "@/lib/models/WhiteboardOrder";
import { normalizeOrderSource } from "@/lib/order-source";
import { finalizeInvoiceCredit } from "@/lib/credit-notes";

export interface ConfirmedOrderInput {
  planogram?: { id?: string; name?: string };
  grid?: { slots?: number[][][]; segQty?: number[][][]; rowQty?: number[][][] };
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

export interface ApprovedProformaInput extends ConfirmedOrderInput {
  sourceProformaId: string;
  lineItems: Array<{ code: string; description: string; category: string; qtyOrdered: number; unitPrice: number; lineTotal: number }>;
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
}

/** Create the normal priced order, invoice and Digital Whiteboard task. */
export async function createConfirmedOrder(body: ConfirmedOrderInput) {
  return createOrderAndInvoice(body);
}

/** Approval uses the saved quote prices, not today's client price list. Never expose this through the normal order endpoint. */
export async function createConfirmedOrderFromProforma(body: ApprovedProformaInput) {
  return createOrderAndInvoice(body, true);
}

async function createOrderAndInvoice(body: ConfirmedOrderInput | ApprovedProformaInput, quoted = false) {
  const lineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
  if (!lineItems.length) throw new Error("no line items");
  if (!body.client?.name && !body.client?.clientId) throw new Error("client is required");

  const round2 = (n: number) => Math.round(n * 100) / 100;
  let vatRate = Math.max(0, Number(body.client?.vatRate ?? body.vatRate) || 0);
  let categoryPrices: Record<string, number> = {};
  let currency = normalizeCurrency(body.client?.pricingCurrency);
  const clientId = String(body.client?.clientId ?? "").trim();

  if (clientId && !quoted) {
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

  const products = quoted ? [] : await Product.find({}, { name: 1, code: 1, group: 1 }).lean();
  const normalizedLines = quoted
    ? (body as ApprovedProformaInput).lineItems.map((line) => ({ ...line }))
    : priceLinesByCategory(lineItems, buildCategoryLookup(products), categoryPrices);
  const subtotal = round2(normalizedLines.reduce((sum, line) => sum + line.lineTotal, 0));
  const shipping = round2(Math.max(0, Number(body.shipping) || 0));
  if (quoted) {
    vatRate = Math.max(0, Number(body.vatRate) || 0);
    currency = normalizeCurrency((body as ApprovedProformaInput).currency);
  }
  const vat = round2((subtotal * vatRate) / 100);
  const total = round2(subtotal + shipping + vat);

  const sourceProformaId = quoted ? (body as ApprovedProformaInput).sourceProformaId : "";
  let order = sourceProformaId ? await Order.findOne({ sourceProformaId }) : null;
  let createdOrder = !order;
  if (!order) {
    try {
      order = await Order.create({
        orderNumber: await nextOrderNumber(),
        ...(sourceProformaId ? { sourceProformaId } : {}),
        status: "received",
        planogram: { id: String(body.planogram?.id ?? ""), name: String(body.planogram?.name ?? "") },
        grid: body.grid ?? {},
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
        creditApplied: 0,
        currency,
        poNumber: String(body.poNumber ?? ""),
        referenceNumber: String(body.referenceNumber ?? ""),
        notes: String(body.notes ?? ""),
      });
    } catch (error) {
      // A retry may have raced with the first attempt. The unique source ID
      // ensures both requests continue with the same order.
      order = sourceProformaId ? await Order.findOne({ sourceProformaId }) : null;
      if (!order) throw error;
      createdOrder = false;
    }
  }
  const orderNumber = order.orderNumber;

  let invoice = sourceProformaId ? await Invoice.findOne({ sourceProformaId }) : null;
  try {
    if (!invoice) {
      const invoiceNumber = await nextInvoiceNumber();
      invoice = await Invoice.create({
        invoiceNumber,
        ...(sourceProformaId ? { sourceProformaId } : {}),
        orderId: order._id,
        orderNumber,
        client: body.client ?? {},
        lineItems: groupIntoCategoryLines(normalizedLines),
        subtotal,
        shipping,
        vatRate,
        vat,
        total,
        creditApplied: 0,
        amountDue: total,
        creditFinalized: false,
        currency,
        status: "issued",
      });
    }
  } catch (error) {
    invoice = sourceProformaId ? await Invoice.findOne({ sourceProformaId }) : null;
    if (!invoice) {
      if (!quoted && createdOrder) await Order.deleteOne({ _id: order._id });
      throw error;
    }
  }

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
    if (!quoted) await Promise.all([Invoice.deleteOne({ _id: invoice._id }), Order.deleteOne({ _id: order._id })]);
    throw new Error("could not add order to the digital whiteboard", { cause: error });
  }

  try {
    invoice = await finalizeInvoiceCredit(String(invoice._id));
    order = await Order.findById(order._id) ?? order;
  } catch (error) {
    // A proforma approval is retryable by source ID. Normal orders already
    // exist here, so leave their invoice pending for repair on invoice read.
    if (quoted) throw error;
    console.error("Order created but credit allocation needs retry", error);
  }

  try {
    if (!quoted || createdOrder) await logActivity({
      action: "confirmed",
      entityType: "order",
      entityName: orderNumber,
      entityId: String(order._id),
      quantity: normalizedLines.reduce((sum, line) => sum + line.qtyOrdered, 0),
      details: `for ${body.client?.name || body.client?.clientId || "client"}${body.agent?.name ? ` · agent ${body.agent.name}` : ""} — invoice ${invoice.invoiceNumber} created`,
    });
  } catch (error) {
    console.error("Order created but activity logging failed", error);
  }

  return { order: serializeOrder(order.toObject()), invoice: serializeInvoice(invoice.toObject()) };
}
