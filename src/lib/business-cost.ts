import type { SupportedCurrency } from "@/lib/currency";

export interface BusinessCostInput {
  date?: unknown;
  productService?: unknown;
  supplier?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  currency?: unknown;
  note?: unknown;
  paid?: unknown;
  paymentDate?: unknown;
}

const clean = (value: unknown) => String(value ?? "").trim();
const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const round3 = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function prepareBusinessCost(input: BusinessCostInput) {
  const date = clean(input.date);
  if (!isDate(date)) throw new Error("a valid purchase or service date is required");
  const productService = clean(input.productService);
  if (!productService || productService.length > 300) throw new Error("product/service must be 1–300 characters");

  const supplierInput = input.supplier && typeof input.supplier === "object" && !Array.isArray(input.supplier)
    ? input.supplier as Record<string, unknown> : {};
  const supplier = {
    name: clean(supplierInput.name),
    contactName: clean(supplierInput.contactName),
    address: clean(supplierInput.address),
    email: clean(supplierInput.email),
    telephone: clean(supplierInput.telephone),
  };
  if (!supplier.name || supplier.name.length > 200) throw new Error("supplier name is required (up to 200 characters)");
  if (supplier.contactName.length > 200 || supplier.address.length > 1000 || supplier.email.length > 320 || supplier.telephone.length > 100) {
    throw new Error("supplier contact details are too long");
  }
  if (supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email)) throw new Error("supplier email is invalid");

  if (input.quantity === "" || input.quantity == null || input.unitPrice === "" || input.unitPrice == null) {
    throw new Error("quantity and unit price are required");
  }
  const rawQuantity = Number(input.quantity);
  const rawUnitPrice = Number(input.unitPrice);
  if (!Number.isFinite(rawQuantity) || rawQuantity <= 0 || rawQuantity > 1_000_000) throw new Error("quantity must be greater than zero");
  if (!Number.isFinite(rawUnitPrice) || rawUnitPrice < 0 || rawUnitPrice > 100_000_000) throw new Error("unit price must be zero or more");
  const quantity = round3(rawQuantity);
  const unitPrice = round2(rawUnitPrice);
  if (quantity <= 0) throw new Error("quantity must be at least 0.001");
  const totalPrice = round2(quantity * unitPrice);
  if (totalPrice > 100_000_000) throw new Error("total price is too large");

  const currency = input.currency as SupportedCurrency;
  if (currency !== "GBP" && currency !== "EUR") throw new Error("currency must be GBP or EUR");
  const note = clean(input.note);
  if (note.length > 5000) throw new Error("note must be 5000 characters or less");
  if (typeof input.paid !== "boolean") throw new Error("payment tick must be true or false");
  const paid = input.paid;
  const paymentDate = paid ? clean(input.paymentDate) : "";
  if (paid && !isDate(paymentDate)) throw new Error("a valid payment date is required when paid is ticked");

  return { date, productService, supplier, quantity, unitPrice, totalPrice, currency, note, paid, paymentDate };
}
