/** Ordered steps of the multi-page "new order" flow. */
export const NEW_ORDER_STEPS = [
  { key: "planogram", title: "Planogram", path: "/orders/new/planogram" },
  { key: "inventory", title: "Inventory Check", path: "/orders/new/inventory" },
  { key: "client", title: "Client & Address", path: "/orders/new/client" },
  { key: "review", title: "Review & Confirm", path: "/orders/new/review" },
] as const;

export type NewOrderStepKey = (typeof NEW_ORDER_STEPS)[number]["key"];

export function stepIndexForPath(pathname: string): number {
  const i = NEW_ORDER_STEPS.findIndex((s) => pathname.startsWith(s.path));
  return i === -1 ? 0 : i;
}
