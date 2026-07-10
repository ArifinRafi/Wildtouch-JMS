import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, nextOrderNumber, serializeOrder } from "@/lib/models/Order";
import { Invoice, nextInvoiceNumber, serializeInvoice } from "@/lib/models/Invoice";
import { Client } from "@/lib/models/Client";
import { logActivity } from "@/lib/activity";

interface LineItemInput {
  code?: string;
  description?: string;
  category?: string;
  qtyOrdered?: number;
  unitPrice?: number;
  lineTotal?: number;
}

/**
 * Confirm an order: creates the Order and a basic Invoice (planogram products +
 * client info). Pricing is left at 0 for now.
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

  const normalizedLines = lineItems.map((li) => ({
    code: String(li.code ?? ""),
    description: String(li.description ?? ""),
    category: String(li.category ?? ""),
    qtyOrdered: Math.max(0, Number(li.qtyOrdered) || 0),
    unitPrice: Math.max(0, Number(li.unitPrice) || 0),
    lineTotal: Math.max(0, Number(li.lineTotal) || 0),
  }));

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const subtotal = round2(normalizedLines.reduce((s, l) => s + l.lineTotal, 0));
  const shipping = round2(Math.max(0, Number(body.shipping) || 0));
  // VAT rate comes from the client. The snapshot the browser sends can be stale
  // (drafted before the client's VAT was edited), so the CURRENT rate on the
  // client record is authoritative; the submitted snapshot is only a fallback.
  let vatRate = Math.max(0, Number(body.client?.vatRate ?? body.vatRate) || 0);
  const clientId = String(body.client?.clientId ?? "").trim();
  if (clientId) {
    const clientDoc = await Client.findById(clientId).lean<{ vatRate?: unknown } | null>();
    if (clientDoc && clientDoc.vatRate != null) {
      const dbRate = Number(clientDoc.vatRate);
      if (Number.isFinite(dbRate)) vatRate = Math.max(0, dbRate);
    }
  }
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

  // 2. Create the invoice
  const invoiceNumber = await nextInvoiceNumber();
  const invoice = await Invoice.create({
    invoiceNumber,
    orderId: order._id,
    orderNumber,
    client: body.client ?? {},
    lineItems: normalizedLines.map((l) => ({
      code: l.code,
      description: l.description,
      qty: l.qtyOrdered,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
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
