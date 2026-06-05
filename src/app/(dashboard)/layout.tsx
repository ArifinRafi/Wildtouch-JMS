import { AppShell } from "@/components/layout/app-shell";
import { AppStoreProvider } from "@/lib/store/app-store";
import { InventoryProvider } from "@/lib/store/inventory-store";
import { OrdersProvider } from "@/lib/store/orders-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStoreProvider>
      <InventoryProvider>
        <OrdersProvider>
          <AppShell>{children}</AppShell>
        </OrdersProvider>
      </InventoryProvider>
    </AppStoreProvider>
  );
}
