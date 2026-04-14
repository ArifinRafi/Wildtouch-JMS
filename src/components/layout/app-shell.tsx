"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedBackground } from "@/components/animated-background";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen relative">
        {/* Animated gradient background */}
        <AnimatedBackground />

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            "lg:block",
            mobileOpen ? "block" : "hidden"
          )}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main content */}
        <div
          className={cn(
            "transition-all duration-300",
            sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
          )}
        >
          <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
          <main className="p-4 sm:p-6">{children}</main>
        </div>

      </div>

    </TooltipProvider>
  );
}
