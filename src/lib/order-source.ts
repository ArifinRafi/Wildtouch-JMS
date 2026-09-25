export const ORDER_SOURCE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "agent", label: "Agent" },
  { value: "phone_call", label: "Phone Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "trade_show", label: "Trade Show" },
  { value: "website", label: "Website" },
] as const;

export type OrderSource = (typeof ORDER_SOURCE_OPTIONS)[number]["value"];

export function orderSourceLabel(value?: string | null): string {
  return ORDER_SOURCE_OPTIONS.find((option) => option.value === value)?.label ?? "—";
}

export function normalizeOrderSource(value: unknown): OrderSource | "" {
  const candidate = String(value ?? "").trim().toLowerCase();
  return ORDER_SOURCE_OPTIONS.some((option) => option.value === candidate)
    ? candidate as OrderSource
    : "";
}
