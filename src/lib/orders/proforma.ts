import { Client } from "@/lib/models/Client";
import { Product } from "@/lib/models/Product";
import { buildCategoryLookup, priceLinesByCategory } from "@/lib/invoicing";
import { normalizeCurrency } from "@/lib/currency";
import { normalizeOrderSource } from "@/lib/order-source";

export interface ProformaInput {
  planogram?: { id?: string; name?: string };
  client?: Record<string, unknown>;
  agent?: Record<string, unknown>;
  orderSource?: string;
  lineItems?: Array<{ code?: string; description?: string; category?: string; qtyOrdered?: number }>;
  grid?: { slots?: number[][][]; segQty?: number[][][]; rowQty?: number[][][] };
  categoryPrices?: Record<string, number>;
  shipping?: number;
  vatRate?: number;
  currency?: string;
  poNumber?: string;
  referenceNumber?: string;
  notes?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const cleanText = (value: unknown) => String(value ?? "").trim();

export async function prepareProforma(input: ProformaInput) {
  const planogram = { id: cleanText(input.planogram?.id), name: cleanText(input.planogram?.name) };
  if (!planogram.id || !planogram.name) throw new Error("a planogram is required");
  const clientInput = input.client ?? {};
  const clientId = cleanText(clientInput.clientId);
  const clientDoc = clientId ? await Client.findById(clientId).lean<Record<string, unknown> | null>() : null;
  if (clientId && !clientDoc) throw new Error("selected client no longer exists");
  const name = cleanText(clientInput.name || clientDoc?.name);
  if (!name) throw new Error("a client or prospect name is required");
  const client = {
    clientId,
    name,
    contactName: cleanText(clientInput.contactName),
    companyName: cleanText(clientInput.companyName || name),
    email: cleanText(clientInput.email),
    contactNumber: cleanText(clientInput.contactNumber),
    invoiceAddress: cleanText(clientInput.invoiceAddress),
    deliveryAddress: cleanText(clientInput.deliveryAddress || clientInput.invoiceAddress),
    brandCardImage: cleanText(clientInput.brandCardImage),
    barcodeImage: cleanText(clientInput.barcodeImage),
  };
  if (!client.invoiceAddress) throw new Error("an invoice address is required");
  const orderSource = normalizeOrderSource(input.orderSource);
  if (!orderSource) throw new Error("source of order is required");
  const rawLines = (Array.isArray(input.lineItems) ? input.lineItems : [])
    .map((line) => ({
      code: cleanText(line.code),
      description: cleanText(line.description),
      category: cleanText(line.category || line.description),
      qtyOrdered: Number(line.qtyOrdered),
    }))
    .filter((line) => line.description && Number.isInteger(line.qtyOrdered) && line.qtyOrdered > 0);
  if (!rawLines.length) throw new Error("at least one product with a positive quantity is required");
  if (rawLines.length > 500) throw new Error("too many product lines");

  const dbPrices = clientDoc?.categoryPrices && typeof clientDoc.categoryPrices === "object"
    ? clientDoc.categoryPrices as Record<string, number> : {};
  const categoryPrices: Record<string, number> = { ...dbPrices };
  for (const [key, value] of Object.entries(input.categoryPrices ?? {})) {
    const price = Number(value);
    if (!key.trim() || !Number.isFinite(price) || price < 0) throw new Error("category prices must be zero or more");
    categoryPrices[key.trim()] = round2(price);
  }
  const products = await Product.find({}, { name: 1, code: 1, group: 1 }).lean();
  const lines = priceLinesByCategory(rawLines, buildCategoryLookup(products), categoryPrices);
  for (const line of lines) {
    if (!line.category) line.category = line.description;
  }
  const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const shipping = Number(input.shipping ?? 0);
  const vatRate = Number(input.vatRate ?? clientDoc?.vatRate ?? 0);
  if (!Number.isFinite(shipping) || shipping < 0 || !Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw new Error("shipping or VAT rate is invalid");
  }
  const vat = round2(subtotal * vatRate / 100);
  return {
    planogram,
    client,
    agent: input.agent ?? {},
    orderSource,
    lineItems: lines,
    grid: input.grid ?? {},
    categoryPrices,
    subtotal,
    shipping: round2(shipping),
    vatRate,
    vat,
    total: round2(subtotal + shipping + vat),
    currency: normalizeCurrency(input.currency ?? clientDoc?.pricingCurrency),
    poNumber: cleanText(input.poNumber),
    referenceNumber: cleanText(input.referenceNumber),
    notes: cleanText(input.notes),
  };
}
