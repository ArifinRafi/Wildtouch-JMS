import { AppShell } from "@/components/layout/app-shell";
import { AppStoreProvider } from "@/lib/store/app-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStoreProvider>
      <AppShell>{children}</AppShell>
    </AppStoreProvider>
  );
}
