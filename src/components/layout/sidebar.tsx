"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Warehouse,
  UserCheck,
  Factory,
  Receipt,
  UserPlus,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronDown,
  Gem,
  CalendarClock,
  Home,
  Monitor,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";

type NavChild = { title: string; href: string; icon: typeof LayoutDashboard };
type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  section: string;
  children?: NavChild[];
};

const navigation: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "overview" },
  { title: "Clients", href: "/clients", icon: Users, section: "core" },
  { title: "Products", href: "/products", icon: Package, section: "core" },
  { title: "Planogram", href: "/planogram", icon: LayoutGrid, section: "core" },
  { title: "Digital Whiteboard", href: "/digital-whiteboard", icon: Monitor, section: "operations" },
  { title: "Orders", href: "/orders", icon: ShoppingCart, section: "operations" },
  { title: "Stock Control", href: "/stock", icon: Warehouse, section: "operations" },
  {
    title: "Production",
    href: "/production",
    icon: Factory,
    section: "operations",
    children: [
      { title: "Home Workers", href: "/production/home-workers", icon: Home },
      // Overseas placeholder — enable when the page is built
      // { title: "Overseas", href: "/production/overseas", icon: Globe },
    ],
  },
  { title: "Agents", href: "/agents", icon: UserCheck, section: "operations" },
  { title: "Branding Cards", href: "/branding-cards", icon: CreditCard, section: "operations" },
  { title: "Invoicing", href: "/invoices", icon: Receipt, section: "finance" },
  { title: "New Clients", href: "/pipeline", icon: UserPlus, section: "sales" },
  { title: "Settings", href: "/settings", icon: Settings, section: "admin" },
];

const sectionLabels: Record<string, string> = {
  overview: "Overview",
  core: "Core Data",
  operations: "Operations",
  finance: "Finance",
  sales: "Sales",
  admin: "Admin",
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // Track which parent items are expanded (by title)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Auto-expand a parent if one of its children is the active route
  useEffect(() => {
    navigation.forEach((item) => {
      if (item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))) {
        setExpanded((prev) => {
          if (prev.has(item.title)) return prev;
          const next = new Set(prev);
          next.add(item.title);
          return next;
        });
      }
    });
  }, [pathname]);

  const toggleExpanded = (title: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const sections = navigation.reduce(
    (acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Gem className="h-4.5 w-4.5" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
              >
                Wildtouch
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {Object.entries(sections).map(([section, items], sectionIdx) => (
          <div key={section} className="mb-1">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-1.5 mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70"
                >
                  {sectionLabels[section]}
                </motion.p>
              )}
            </AnimatePresence>
            {collapsed && sectionIdx > 0 && (
              <Separator className="mx-auto my-2 w-8 opacity-30" />
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const hasChildren = !!item.children?.length;

              // ── Active state ──
              // For leaf items: exact path match.
              // For parent items: true if any child route is active.
              const isActive = hasChildren
                ? !!item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))
                : pathname === item.href;

              // ─────────────────────────────────────────────────────────────
              // PARENT ITEM WITH CHILDREN (e.g. Production)
              // ─────────────────────────────────────────────────────────────
              if (hasChildren) {
                const isExpanded = expanded.has(item.title);

                // Collapsed sidebar: render as a regular link to the first child
                // (no popout flyout in this iteration — keep it simple).
                if (collapsed) {
                  const firstChildHref = item.children![0].href;
                  return (
                    <Tooltip key={item.title}>
                      <TooltipTrigger className="w-full block mb-0.5">
                        <Link
                          href={firstChildHref}
                          className={cn(
                            "group relative flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                          {!isActive && (
                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-accent/60 transition-opacity duration-200" />
                          )}
                          <Icon className="h-4 w-4 shrink-0 relative z-10" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-card border border-border/60 text-foreground font-semibold shadow-lg px-3 py-1.5 text-xs tracking-wide"
                      >
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                // Expanded sidebar: parent button + collapsible children
                return (
                  <div key={item.title} className="mb-0.5">
                    <button
                      onClick={() => toggleExpanded(item.title)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-accent/60 transition-opacity duration-200" />
                      <Icon className="h-4 w-4 shrink-0 relative z-10" />
                      <span className="relative z-10 flex-1 text-left">{item.title}</span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10"
                      >
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      </motion.div>
                    </button>

                    {/* Children */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-1 pl-3 ml-2 border-l border-border/30 space-y-0.5">
                            {item.children!.map((child) => {
                              const ChildIcon = child.icon;
                              const childActive =
                                pathname === child.href || pathname.startsWith(child.href + "/");
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                                    childActive
                                      ? "text-primary-foreground"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {childActive && (
                                    <motion.div
                                      layoutId="sidebar-active"
                                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20"
                                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                  )}
                                  {!childActive && (
                                    <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-accent/40 transition-opacity duration-200" />
                                  )}
                                  <ChildIcon className="h-3.5 w-3.5 shrink-0 relative z-10" />
                                  <span className="relative z-10">{child.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // ─────────────────────────────────────────────────────────────
              // LEAF ITEM (no children) — original behaviour
              // ─────────────────────────────────────────────────────────────
              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-accent/60 transition-opacity duration-200" />
                  )}
                  <Icon className="h-4 w-4 shrink-0 relative z-10" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.15 }}
                        className="relative z-10"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger className="w-full block mb-0.5">
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        className="bg-card border border-border/60 text-foreground font-semibold shadow-lg px-3 py-1.5 text-xs tracking-wide"
                      >
                        {item.title}
                      </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <div key={item.href} className="mb-0.5">
                  {linkContent}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Shift Manager — pinned bottom nav item */}
      <div className="border-t border-border/30 px-2 pt-2 pb-1">
        {(() => {
          const href = "/shifts";
          const isActive = pathname === href;
          const item = (
            <Link
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center" : "",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-accent/60 transition-opacity duration-200" />
              )}
              <CalendarClock className="h-4 w-4 shrink-0 relative z-10" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.15 }}
                    className="relative z-10"
                  >
                    Shift Manager
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip>
                <TooltipTrigger className="w-full block mb-0.5">{item}</TooltipTrigger>
                <TooltipContent
              side="right"
              className="bg-card border border-border/60 text-foreground font-semibold shadow-lg px-3 py-1.5 text-xs tracking-wide"
            >
              Shift Manager
            </TooltipContent>
              </Tooltip>
            );
          }
          return <div className="mb-0.5">{item}</div>;
        })()}
      </div>

      {/* Theme Toggle */}
      <div className="border-t border-border/30 px-2 py-2 flex items-center justify-center">
        <ThemeToggle />
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-border/30 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "w-full rounded-xl hover:bg-accent/60 transition-colors",
            collapsed ? "justify-center" : ""
          )}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-2"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.aside>
  );
}
