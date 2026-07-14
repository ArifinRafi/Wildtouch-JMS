import { SessionProvider } from "next-auth/react";
import { AppShell } from "@/components/layout/app-shell";
import { ViewerGuard } from "@/components/viewer-guard";
import { AppStoreProvider } from "@/lib/store/app-store";
import { InventoryProvider } from "@/lib/store/inventory-store";
import { OrdersProvider } from "@/lib/store/orders-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AppStoreProvider>
        <InventoryProvider>
          <OrdersProvider>
            <AppShell>{children}</AppShell>
            <ViewerGuard />
          </OrdersProvider>
        </InventoryProvider>
      </AppStoreProvider>
    </SessionProvider>
  );
}
