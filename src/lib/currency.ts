export type SupportedCurrency = "GBP" | "EUR";

export function normalizeCurrency(value: unknown): SupportedCurrency {
  return String(value ?? "").toUpperCase() === "EUR" ? "EUR" : "GBP";
}

export function currencySymbol(currency: unknown): "£" | "€" {
  return normalizeCurrency(currency) === "EUR" ? "€" : "£";
}

export function formatCurrency(value: number, currency: unknown): string {
  return `${currencySymbol(currency)}${(Number(value) || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
