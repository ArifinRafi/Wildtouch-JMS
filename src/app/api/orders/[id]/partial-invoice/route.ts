import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { Order, serializeOrder } from "@/lib/models/Order";
import { Invoice, nextInvoiceNumber, serializeInvoice } from "@/lib/models/Invoice";
import { groupIntoCategoryLines } from "@/lib/invoicing";
import { logActivity } from "@/lib/activity";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Issue a partial (installment) invoice against an order. The invoice carries
 * the full order document (items + totals) plus a payment section: previously
 * invoiced, this payment, and the balance remaining. The order keeps a running
 * `amountInvoiced` so the next partial invoice starts from the new balance.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const body = await request.json();
  const amount = round2(Math.max(0, Number(body.amount) || 0));
  if (amount <= 0) {
    return NextResponse.json({ error: "amount must be greater than 0" }, { status: 400 });
  }

  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  const orderTotal = round2(order.total ?? 0);
  if (orderTotal <= 0) {
    return NextResponse.json(
      { error: "this order has no total amount — add pricing before creating a partial invoice" },
      { status: 400 },
    );
  }

  const previouslyPaid = round2(order.amountInvoiced ?? 0);
  const remaining = round2(orderTotal - previouslyPaid);
  if (remaining <= 0) {
    return NextResponse.json({ error: "this order is already fully invoiced" }, { status: 400 });
  }
  if (amount > remaining + 0.005) {
    return NextResponse.json(
      { error: `amount exceeds the remaining balance of £${remaining.toFixed(2)}` },
      { status: 400 },
    );
  }

  const balanceDue = round2(remaining - amount);
  const invoiceNumber = await nextInvoiceNumber();
  const invoice = await Invoice.create({
    invoiceNumber,
    orderId: order._id,
    orderNumber: order.orderNumber,
    client: order.client ?? {},
    // Same category-level lines as the main invoice.
    lineItems: groupIntoCategoryLines(
      (order.lineItems ?? []).map((l) => ({
        code: l.code ?? "",
        description: l.description ?? "",
        category: l.category ?? "",
        qtyOrdered: l.qtyOrdered ?? 0,
        unitPrice: l.unitPrice ?? 0,
        lineTotal: l.lineTotal ?? 0,
      })),
    ),
    subtotal: order.subtotal ?? 0,
    shipping: order.shipping ?? 0,
    vatRate: order.vatRate ?? 0,
    vat: order.vat ?? 0,
    total: orderTotal,
    currency: "GBP",
    status: "issued",
    isPartial: true,
    paymentAmount: amount,
    previouslyPaid,
    balanceDue,
  });

  order.amountInvoiced = round2(previouslyPaid + amount);
  await order.save();

  await logActivity({
    action: "added",
    entityType: "partial invoice",
    entityName: invoiceNumber,
    entityId: String(invoice._id),
    details: `£${amount.toFixed(2)} against ${order.orderNumber} — £${balanceDue.toFixed(2)} remaining`,
  });

  return NextResponse.json(
    { invoice: serializeInvoice(invoice.toObject()), order: serializeOrder(order.toObject()) },
    { status: 201 },
  );
}
