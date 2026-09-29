import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { sessionUser } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { Product } from "@/lib/models/Product";
import { ProformaInvoice, claimProformaApproval, releaseProformaApproval } from "@/lib/models/ProformaInvoice";
import { Order } from "@/lib/models/Order";
import { createConfirmedOrderFromProforma } from "@/lib/orders/create-confirmed-order";
import { normalizeName } from "@/lib/orders/match";

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await sessionUser();
  if (user?.role !== "admin" && user?.role !== "manager") {
    return NextResponse.json({ error: "approval requires admin or manager" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();

  // A lease allows recovery after a server restart; the unique source ID on
  // Order and Invoice makes the conversion itself safe to retry.
  const claim = await claimProformaApproval(id);
  if (!claim) return NextResponse.json({ error: "proforma has already been approved or is being approved" }, { status: 409 });
  const { quote, token: approvalToken } = claim;

  let converted = false;
  try {
    const requirementMap = new Map<string, { code: string; label: string; qtyRequired: number; deducted: boolean }>();
    const existingOrder = await Order.findOne({ sourceProformaId: id }).lean();
    if (existingOrder) {
      for (const requirement of existingOrder.componentRequirements) {
        requirementMap.set(requirement.code, { code: requirement.code, label: requirement.label, qtyRequired: requirement.qtyRequired, deducted: false });
      }
    } else {
      const products = await Product.find({}, { name: 1, code: 1, components: 1 }).lean();
      const productByName = new Map(products.map((product) => [normalizeName(product.name), product]));
      const productByCode = new Map(products.filter((product) => product.code).map((product) => [String(product.code).toLowerCase(), product]));
      for (const line of quote.lineItems) {
        const product = productByCode.get(String(line.code).toLowerCase()) ?? productByName.get(normalizeName(line.description));
        for (const component of product?.components ?? []) {
          if (!component.code) continue;
          const current = requirementMap.get(component.code) ?? { code: component.code, label: component.label || component.code, qtyRequired: 0, deducted: false };
          current.qtyRequired += (component.qtyPerUnit || 1) * line.qtyOrdered;
          requirementMap.set(component.code, current);
        }
      }
    }

    const result = await createConfirmedOrderFromProforma({
      sourceProformaId: id,
      planogram: quote.planogram ?? undefined,
      grid: quote.grid as { slots?: number[][][]; segQty?: number[][][]; rowQty?: number[][][] },
      client: quote.client as Record<string, unknown>,
      agent: quote.agent as Record<string, unknown>,
      orderSource: quote.orderSource,
      lineItems: quote.lineItems.map((line) => ({
        code: line.code,
        description: line.description,
        category: line.category,
        qtyOrdered: line.qtyOrdered,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      componentRequirements: [...requirementMap.values()],
      shipping: quote.shipping,
      vatRate: quote.vatRate,
      subtotal: quote.subtotal,
      vat: quote.vat,
      total: quote.total,
      currency: quote.currency,
      poNumber: quote.poNumber,
      referenceNumber: quote.referenceNumber,
      notes: quote.notes,
    });
    converted = true;
    await ProformaInvoice.deleteOne({ _id: id, status: "approving", approvalToken });
    try { await logActivity({ action: "confirmed", entityType: "proforma invoice", entityName: quote.proformaNumber, entityId: id, details: `converted to ${result.order.orderNumber} / ${result.invoice.invoiceNumber}` }); }
    catch (error) { console.error("Proforma approved but activity logging failed", error); }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Could not approve proforma", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not approve proforma" }, { status: 500 });
  } finally {
    // A failed validation or creation leaves the quote editable and retryable.
    if (!converted) {
      try { await releaseProformaApproval(id, approvalToken); }
      catch (error) { console.error("Could not release failed proforma approval; stale lease will allow retry", error); }
    }
  }
}
