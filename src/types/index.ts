export type UserRole =
  | "super_admin"
  | "manager"
  | "sales"
  | "warehouse"
  | "bookkeeper"
  | "agent";

export type AccountStatus =
  | "active"
  | "proforma"
  | "on_hold"
  | "bad_credit";

export type OrderStatus =
  | "received"
  | "in_production"
  | "quality_check"
  | "packing"
  | "ready_for_dispatch"
  | "dispatched"
  | "delivered"
  | "archived";

export type ProductStatus =
  | "active"
  | "discontinued"
  | "seasonal"
  | "development";

export type Priority = "urgent" | "standard" | "deferred";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: UserRole[];
  badge?: number;
}
