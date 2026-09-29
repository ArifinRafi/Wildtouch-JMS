import { isValidObjectId } from "mongoose";
import { Client } from "@/lib/models/Client";
import { Employee } from "@/lib/models/Employee";
import { Order } from "@/lib/models/Order";
import { ProductGroup } from "@/lib/models/ProductGroup";
import { normalizeCurrency } from "@/lib/currency";

export interface WastageInput {
  date?: unknown;
  staffId?: unknown;
  clientId?: unknown;
  orderNumber?: unknown;
  productGroupId?: unknown;
  wasteQuantity?: unknown;
  note?: unknown;
  costItems?: unknown;
  currency?: unknown;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const clean = (value: unknown) => String(value ?? "").trim();

export async function prepareWastage(input: WastageInput) {
  const date = clean(input.date);
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error("a valid wastage date is required");
  }
  const staffId = clean(input.staffId);
  const clientId = clean(input.clientId);
  const orderNumber = clean(input.orderNumber);
  const productGroupId = clean(input.productGroupId);
  if (!staffId || !clientId || !orderNumber || !isValidObjectId(productGroupId)) {
    throw new Error("staff, client, client order and product group are required");
  }
  const wasteQuantity = Number(input.wasteQuantity);
  if (!Number.isSafeInteger(wasteQuantity) || wasteQuantity < 1 || wasteQuantity > 1_000_000) {
    throw new Error("waste quantity must be a positive whole number");
  }
  const note = clean(input.note);
  if (note.length > 5000) throw new Error("note must be 5000 characters or less");

  const [staff, client, group, order] = await Promise.all([
    Employee.findById(staffId).lean(),
    Client.findById(clientId).lean(),
    ProductGroup.findById(productGroupId).lean(),
    Order.findOne({ orderNumber }).lean(),
  ]);
  if (!staff) throw new Error("selected staff member no longer exists");
  if (!client) throw new Error("selected client no longer exists");
  if (!group) throw new Error("selected product group no longer exists");
  if (!order || String(order.client?.clientId ?? "") !== clientId) {
    throw new Error("selected order does not belong to the client");
  }

  if (!Array.isArray(input.costItems) || input.costItems.length < 1 || input.costItems.length > 30) {
    throw new Error("add 1–30 cost items");
  }
  const costItems = input.costItems.map((item: unknown) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const description = clean(row.description);
    const amount = Number(row.amount);
    if (!description || description.length > 200 || row.amount === "" || row.amount == null || !Number.isFinite(amount) || amount < 0 || amount > 100_000_000) {
      throw new Error("each cost needs a description and a non-negative amount");
    }
    return { description, amount: round2(amount) };
  });
  const totalCost = round2(costItems.reduce((sum, item) => sum + item.amount, 0));
  if (totalCost > 100_000_000) throw new Error("total cost is too large");

  return {
    date,
    staffId,
    staffName: String(staff.name ?? ""),
    clientId,
    clientName: String(client.name ?? ""),
    orderNumber,
    productGroupId,
    productGroupName: group.name,
    wasteQuantity,
    note,
    costItems,
    currency: normalizeCurrency(input.currency),
    totalCost,
  };
}
