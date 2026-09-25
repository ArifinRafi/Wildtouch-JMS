export const ACCOUNT_STATUS_OPTIONS = [
  { value: "new_client", label: "New Client" },
  { value: "potential_client", label: "Potential Client" },
  { value: "previous_client", label: "Previous Client" },
  { value: "existing_client", label: "Existing Client" },
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUS_OPTIONS)[number]["value"];

/** Map legacy database values to the current client lifecycle statuses. */
export function normalizeAccountStatus(value: unknown): AccountStatus {
  switch (String(value ?? "").toLowerCase()) {
    case "potential_client":
    case "proforma":
      return "potential_client";
    case "previous_client":
    case "on_hold":
    case "bad_credit":
      return "previous_client";
    case "existing_client":
    case "active":
      return "existing_client";
    default:
      return "new_client";
  }
}

export function accountStatusLabel(value: unknown): string {
  const normalized = normalizeAccountStatus(value);
  return ACCOUNT_STATUS_OPTIONS.find((option) => option.value === normalized)?.label ?? "New Client";
}
