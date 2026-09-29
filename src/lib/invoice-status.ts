export const INVOICE_PAYMENT_STATUSES = [
  { value: "issued", label: "Select status" },
  { value: "remittance", label: "Remittance" },
  { value: "paid", label: "Paid" },
  { value: "partial_payment_outstanding", label: "Partial payment outstanding" },
] as const;

export type InvoicePaymentStatus = (typeof INVOICE_PAYMENT_STATUSES)[number]["value"];

export function isInvoicePaymentStatus(value: unknown): value is InvoicePaymentStatus {
  return typeof value === "string" && INVOICE_PAYMENT_STATUSES.some((option) => option.value === value);
}

export function invoiceStatusLabel(status: string): string {
  return INVOICE_PAYMENT_STATUSES.find((option) => option.value === status)?.label ??
    (status === "void" ? "Void" : status);
}
