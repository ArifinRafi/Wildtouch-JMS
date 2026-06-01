import { AppShell } from "@/components/layout/app-shell";
import { AppStoreProvider } from "@/lib/store/app-store";
import { InventoryProvider } from "@/lib/store/inventory-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStoreProvider>
      <InventoryProvider>
        <AppShell>{children}</AppShell>
      </InventoryProvider>
    </AppStoreProvider>
  );
}
