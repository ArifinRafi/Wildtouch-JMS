"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  LayoutDashboard,
  Search,
  Users,
  Boxes,
  Package,
  LayoutGrid,
  Monitor,
  ListChecks,
  ShoppingCart,
  PenTool,
  Waves,
  UserCheck,
  CreditCard,
  Receipt,
  History,
  Settings,
  CalendarClock,
  ShieldCheck,
  LogIn,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Role badges ─────────────────────────────────────────────────────────────

type Role = "admin" | "manager" | "viewer";

const ROLE_STYLE: Record<Role, string> = {
  admin: "border-primary/30 bg-primary/10 text-primary",
  manager: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  viewer: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

function RolePills({ roles }: { roles: Role[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {roles.map((r) => (
        <Badge key={r} variant="outline" className={cn("text-[9px] font-bold uppercase", ROLE_STYLE[r])}>{r}</Badge>
      ))}
    </span>
  );
}

// ─── Manual content ──────────────────────────────────────────────────────────

interface Shot { src: string; caption: string }
interface Section {
  id: string;
  title: string;
  icon: typeof BookOpen;
  intro: string;
  /** Who can do what, shown as compact permission lines. */
  permissions: { action: string; roles: Role[] }[];
  steps?: { heading: string; items: string[] }[];
  tips?: string[];
  shots: Shot[];
}

const SECTIONS: Section[] = [
  {
    id: "login",
    title: "Signing In",
    icon: LogIn,
    intro:
      "Every user signs in with a username (or email) and password created by an Admin in Settings. Your role — Admin, Manager or Viewer — decides what you can do once inside.",
    permissions: [
      { action: "Sign in and browse all data", roles: ["admin", "manager", "viewer"] },
      { action: "Create new user accounts", roles: ["admin"] },
    ],
    steps: [
      { heading: "To sign in", items: [
        "Open the app and enter your username (e.g. admin) or email.",
        "Enter your password and press Sign In.",
        "You land on the Dashboard. If your details are wrong you'll see an error — contact your Admin if you're locked out.",
      ]},
    ],
    shots: [{ src: "/manual/login.png", caption: "The sign-in screen" }],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    intro:
      "The home screen. It shows live business numbers pulled from the database: active orders, active clients, catalogue size, month-to-date revenue, a 7-day revenue chart, the orders pipeline and low-stock alerts.",
    permissions: [
      { action: "View the dashboard", roles: ["admin", "manager", "viewer"] },
      { action: "Create New Order (top-right button)", roles: ["admin", "manager"] },
    ],
    tips: ["The Stock Alerts card highlights components at or below their threshold — restock these via River or Inventory."],
    shots: [{ src: "/manual/dashboard.png", caption: "Dashboard with live stats, revenue and pipeline" }],
  },
  {
    id: "search",
    title: "Global Search",
    icon: Search,
    intro:
      "The search bar in the top header finds anything: clients, products, orders, invoices and planograms. Results are grouped with a coloured badge per type.",
    permissions: [{ action: "Search everything", roles: ["admin", "manager", "viewer"] }],
    steps: [
      { heading: "To search", items: [
        "Click the header search box and start typing (name, code, order number…).",
        "Use ↑ / ↓ to move through results and Enter to open one, or just click it.",
        "Products open the Products page pre-filtered; everything else opens its own page.",
      ]},
    ],
    shots: [{ src: "/manual/global-search.png", caption: "Typing a client name shows their record, orders and invoices" }],
  },
  {
    id: "clients",
    title: "Clients",
    icon: Users,
    intro:
      "The customer database. Each client holds contacts, addresses, invoicing settings (VAT rate, PO requirement), product preferences, brand card & barcode images — and Pricing: this client's £ price for each product category, which drives every invoice.",
    permissions: [
      { action: "View clients and profiles", roles: ["admin", "manager", "viewer"] },
      { action: "Add / edit clients (incl. pricing & VAT)", roles: ["admin", "manager"] },
      { action: "Delete a client", roles: ["admin"] },
    ],
    steps: [
      { heading: "To set a client's category prices", items: [
        "Open the client → Edit → scroll to the Pricing section.",
        "Search a product group (groups are created on the Products page), type the £ price, press Add.",
        "Repeat per category, then Save. Invoices for this client now bill each planogram product at its category's price.",
      ]},
      { heading: "To set the VAT rate", items: [
        "Edit the client → Invoicing → VAT rate (%). New invoices apply this rate automatically.",
      ]},
    ],
    tips: ["Click the brand card or barcode image on a profile to view it full-screen."],
    shots: [
      { src: "/manual/clients.png", caption: "Clients list" },
      { src: "/manual/client-profile.png", caption: "A client profile — contacts, invoicing, pricing and images" },
    ],
  },
  {
    id: "inventory",
    title: "Inventory (Components)",
    icon: Boxes,
    intro:
      "The stock room. Inventory holds components — the physical parts (charms, findings, cards) that products are built from. Completing a River order tops these up automatically; confirming orders can deduct them.",
    permissions: [
      { action: "View stock levels", roles: ["admin", "manager", "viewer"] },
      { action: "Add / edit components & quantities", roles: ["admin", "manager"] },
      { action: "Delete a component", roles: ["admin"] },
    ],
    shots: [{ src: "/manual/inventory.png", caption: "Component stock list" }],
  },
  {
    id: "products",
    title: "Products & Groups",
    icon: Package,
    intro:
      "The sellable catalogue. A product has a name, optional code, a photo, a Group (its category — e.g. Magnets, Large Keyrings) and a bill of materials: which inventory components it's made from. The Group matters: invoices are priced per group using each client's category prices.",
    permissions: [
      { action: "View the catalogue", roles: ["admin", "manager", "viewer"] },
      { action: "Create / edit products and groups", roles: ["admin", "manager"] },
      { action: "Delete a product / delete a group", roles: ["admin", "manager"] },
    ],
    steps: [
      { heading: "To create a product", items: [
        "Products → Create a Product.",
        "Name it, optionally add a code and upload a photo.",
        "Pick its Group (type to search; typing a new name creates the group on save).",
        "Search inventory components and add each with its per-unit quantity, then Create.",
      ]},
      { heading: "To add a group without a product", items: [
        "Products → Add Group.",
        "Type the group name and press Add — it's instantly available in client Pricing.",
        "Deleting a group from the list asks for confirmation first.",
      ]},
    ],
    shots: [
      { src: "/manual/products.png", caption: "Products list with Group column" },
      { src: "/manual/products-add-group.png", caption: "The Add Group dialog — create and manage categories" },
    ],
  },
  {
    id: "planogram",
    title: "Planogram",
    icon: LayoutGrid,
    intro:
      "Stand layouts. Built-in planograms cover the standard Wildtouch stands; the builder lets you create custom ones where every grid cell is its own product with a photo and quantity. Each side can also carry a Charms list shown at the bottom of the side and on prints.",
    permissions: [
      { action: "View planograms & print PDFs", roles: ["admin", "manager", "viewer"] },
      { action: "Build, edit and duplicate planograms", roles: ["admin", "manager"] },
      { action: "Delete a planogram", roles: ["admin"] },
    ],
    steps: [
      { heading: "To build a planogram", items: [
        "Planogram → Add New Planogram.",
        "Name it, choose sides / rows / columns, then Generate Grid.",
        "In each cell, search a product — its photo appears — and set the quantity.",
        "Fill the Charms field per side if needed, then Save Planogram.",
      ]},
      { heading: "To edit or duplicate", items: [
        "Open a custom planogram → Edit changes anything (including charms); Duplicate makes a '(Copy)' to start from.",
      ]},
    ],
    shots: [
      { src: "/manual/planogram.png", caption: "Built-in and custom planograms" },
      { src: "/manual/planogram-builder.png", caption: "The builder setup — name and grid size" },
    ],
  },
  {
    id: "whiteboard",
    title: "Digital Whiteboard",
    icon: Monitor,
    intro:
      "A shared board for quick order/task tracking — the digital version of the office whiteboard. All roles can see it; Admins and Managers can add, update and remove entries.",
    permissions: [
      { action: "View the board", roles: ["admin", "manager", "viewer"] },
      { action: "Add / edit / delete entries", roles: ["admin", "manager"] },
    ],
    shots: [{ src: "/manual/whiteboard.png", caption: "The Digital Whiteboard" }],
  },
  {
    id: "tasks",
    title: "Task Manager",
    icon: ListChecks,
    intro:
      "Daily task lists per employee. Pick a date, add tasks with an employee, a note, status and priority. Tasks sort High → Medium → Low, and each row's note is editable inline (saves when you click away).",
    permissions: [
      { action: "View tasks", roles: ["admin", "manager", "viewer"] },
      { action: "Add, complete, edit and delete tasks", roles: ["admin", "manager"] },
    ],
    steps: [
      { heading: "To assign a task", items: [
        "Pick the date with the calendar (top-right).",
        "Choose the employee (searchable), type the task and an optional note, set status & priority, press Add Task.",
        "Tick the circle to mark complete; use the dropdown to change priority any time.",
      ]},
    ],
    shots: [{ src: "/manual/task-manager.png", caption: "Tasks for a selected date, sorted by priority" }],
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingCart,
    intro:
      "The heart of the system. Orders are created through a wizard (planogram → stock check → client → review) and confirming one generates its invoice automatically, billed by product category at the client's prices. The list shows a date filter, per-row Packing List and Partial invoice buttons, and an Invoice Summary panel at the bottom (total invoiced, partial invoiced, outstanding — date-aware).",
    permissions: [
      { action: "View orders, print order PDFs & packing lists", roles: ["admin", "manager", "viewer"] },
      { action: "Create orders & partial invoices", roles: ["admin", "manager"] },
      { action: "Delete an order", roles: ["admin"] },
    ],
    steps: [
      { heading: "To create an order", items: [
        "Orders → Create New Order.",
        "Pick a planogram and set quantities → the stock step checks component availability.",
        "Choose the client (addresses pre-fill) → Review shows the invoice preview billed by category.",
        "Confirm Order — the order and its invoice are created together.",
      ]},
      { heading: "To generate a packing list", items: [
        "Press Packing List on any order row (or inside the order).",
        "Choose With or Without Proof of Delivery — the slip opens on screen with a Download PDF button.",
      ]},
      { heading: "To bill in instalments (partial invoices)", items: [
        "Press Partial on the order row (or New Partial Invoice inside the order).",
        "Enter the amount (quick 25% / 50% / Remaining buttons) — the remaining balance is tracked per order.",
      ]},
    ],
    shots: [
      { src: "/manual/orders.png", caption: "Orders list — packing list, partial invoicing, date filter" },
      { src: "/manual/order-wizard.png", caption: "The order wizard" },
      { src: "/manual/order-detail.png", caption: "An order — billing panel, invoices, packing list" },
      { src: "/manual/packing-list.png", caption: "Packing slip (Proof of Delivery optional)" },
    ],
  },
  {
    id: "design-tracker",
    title: "Design Tracker",
    icon: PenTool,
    intro:
      "The pipeline for new component designs. Each design moves through Stages: New Design Request → Research → Feedback → New Design Template. Reaching the final stage marks it finished and sends it to River as an orderable component. Moving a design backwards requires a note, and every stage change is recorded in the History column.",
    permissions: [
      { action: "View designs", roles: ["admin", "manager", "viewer"] },
      { action: "Add / edit designs & change stages", roles: ["admin", "manager"] },
      { action: "Delete a design", roles: ["admin"] },
    ],
    steps: [
      { heading: "To track a design", items: [
        "Add Design — the row opens like a spreadsheet: image, name, client, category, notes, code sheet, brochure and Ordered columns.",
        "Move the Stage dropdown forward as work progresses.",
        "Choosing 'New Design Template → River' finishes it — River gets a New Design notification.",
        "Moving back a stage asks for a mandatory reason, saved to the row's History.",
      ]},
    ],
    shots: [{ src: "/manual/design-tracker.png", caption: "Live designs with Stage and History columns" }],
  },
  {
    id: "river",
    title: "River",
    icon: Waves,
    intro:
      "Purchase orders to the vendor River, who makes new components. Rows edit inline like a spreadsheet: order number, component (searchable from completed designs), quantities, £/¥ values, priority, shipment method and a dated notes log. Receiving stock — fully or partially — adds it straight into Inventory.",
    permissions: [
      { action: "View River orders", roles: ["admin", "manager", "viewer"] },
      { action: "Add / edit orders, receive stock", roles: ["admin", "manager"] },
      { action: "Delete a River order", roles: ["admin"] },
    ],
    steps: [
      { heading: "To order a new design", items: [
        "The New Design button shows finished designs waiting to be ordered — press Order it to pre-fill a row.",
        "Fill quantity, values, priority and shipment, then Save.",
      ]},
      { heading: "To receive stock", items: [
        "Use Complete (everything) or Partial (a quantity) on the row.",
        "The received amount is added to Inventory automatically — first receipt creates the component, later ones top it up.",
      ]},
    ],
    tips: ["Notes default to today's date — just type and press Add; pick another date only when back-dating."],
    shots: [{ src: "/manual/river.png", caption: "River orders with inline editing and the New Design notification" }],
  },
  {
    id: "agents",
    title: "Agents",
    icon: UserCheck,
    intro: "Sales agents with their contact details and referred points.",
    permissions: [
      { action: "View agents", roles: ["admin", "manager", "viewer"] },
      { action: "Add / edit agents", roles: ["admin", "manager"] },
      { action: "Delete an agent", roles: ["admin"] },
    ],
    shots: [{ src: "/manual/agents.png", caption: "Agents list" }],
  },
  {
    id: "branding",
    title: "Branding Cards",
    icon: CreditCard,
    intro:
      "A searchable gallery of every client's uploaded brand card. Each card links back to its client; images are uploaded on the client profile.",
    permissions: [{ action: "Browse the gallery", roles: ["admin", "manager", "viewer"] }],
    shots: [{ src: "/manual/branding-cards.png", caption: "Brand card gallery" }],
  },
  {
    id: "invoices",
    title: "Invoicing",
    icon: Receipt,
    intro:
      "Every confirmed order produces an invoice in the official Wildtouch / Sterling-K layout — on screen and as an identical PDF. Line items are the product categories (not individual products), priced from the client's category prices, with the client's VAT applied. Partial invoices show the amount due now, what was previously invoiced, and the balance remaining.",
    permissions: [
      { action: "View invoices & download PDFs", roles: ["admin", "manager", "viewer"] },
      { action: "Generate invoices (by confirming orders) & partials", roles: ["admin", "manager"] },
      { action: "Delete an invoice (also deletes its order)", roles: ["admin"] },
    ],
    steps: [
      { heading: "On an invoice page you can", items: [
        "Download PDF — the printed invoice, identical to the screen.",
        "Download the Planogram PDF from the side panel — products with photos and quantities, no pricing.",
        "See the planogram summary beside the invoice (screen only, never printed).",
      ]},
    ],
    tips: ["Deleting an invoice is admin-only and removes the linked order and all its sibling invoices — the confirmation dialog spells this out."],
    shots: [
      { src: "/manual/invoices.png", caption: "Invoices list with date filter" },
      { src: "/manual/invoice-detail.png", caption: "An invoice with the planogram side panel" },
    ],
  },
  {
    id: "history",
    title: "History (Admin)",
    icon: History,
    intro:
      "The audit trail. Every add, update, delete, receive and completion across the app is recorded with who did it, what changed and the exact time — grouped by date with search and a date picker. Only Admins can see this page.",
    permissions: [{ action: "View the activity history", roles: ["admin"] }],
    shots: [{ src: "/manual/history.png", caption: "Daily activity feed (admin only)" }],
  },
  {
    id: "settings",
    title: "Settings & User Management",
    icon: Settings,
    intro:
      "Your account details, plus (for Admins) password change and user management. Admins create accounts with a username, email, password and role — Viewer, Manager or Admin — and can delete any account except their own.",
    permissions: [
      { action: "View own account", roles: ["admin", "manager", "viewer"] },
      { action: "Create / delete users, choose roles", roles: ["admin"] },
      { action: "Change password (code sent to the master email)", roles: ["admin"] },
    ],
    steps: [
      { heading: "To add a user", items: [
        "Settings → Users → fill username, email, password (min 8 characters).",
        "Pick the role: Viewer (read-only), Manager (day-to-day work) or Admin (everything).",
        "Press Create — share the credentials with the person privately.",
      ]},
    ],
    shots: [{ src: "/manual/settings.png", caption: "Settings — account, password and users" }],
  },
  {
    id: "shifts",
    title: "Shift Manager",
    icon: CalendarClock,
    intro: "The staff shift rota, pinned at the bottom of the sidebar. Employee names from here also feed the Task Manager's employee search.",
    permissions: [
      { action: "View shifts", roles: ["admin", "manager", "viewer"] },
      { action: "Manage shifts", roles: ["admin", "manager"] },
    ],
    shots: [{ src: "/manual/shifts.png", caption: "Shift Manager" }],
  },
];

// ─── Role overview data ──────────────────────────────────────────────────────

const ROLE_CARDS: { role: Role; title: string; blurb: string; points: string[] }[] = [
  {
    role: "admin",
    title: "Admin",
    blurb: "Full control of the system.",
    points: [
      "Everything Managers can do",
      "Delete records everywhere (orders, invoices, products, clients…)",
      "Manage users & roles, change password",
      "See the History audit trail",
    ],
  },
  {
    role: "manager",
    title: "Manager",
    blurb: "Runs the day-to-day work.",
    points: [
      "Create & edit orders, clients, products, planograms, designs, River orders",
      "Generate invoices, partials & packing lists",
      "Manage whiteboard and tasks (incl. deleting tasks)",
      "Cannot delete core records or manage users",
    ],
  },
  {
    role: "viewer",
    title: "Viewer",
    blurb: "Read-only access.",
    points: [
      "Browse every page and search all data",
      "Download PDFs (invoices, packing lists, planograms)",
      "Any attempt to create, edit or delete shows a “view-only access” message",
      "Contact an Admin if you need more access",
    ],
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ManualPage() {
  const [lightbox, setLightbox] = useState<Shot | null>(null);
  const toc = useMemo(() => SECTIONS.map((s) => ({ id: s.id, title: s.title })), []);

  return (
    <div className="space-y-8 pb-16 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" /> User Manual
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          How to use every part of Wildtouch JMS — with what Admins, Managers and Viewers can each do.
        </p>
      </motion.div>

      {/* Roles at a glance */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Roles at a glance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLE_CARDS.map((c) => (
            <div key={c.role} className="rounded-xl border border-border/40 bg-muted/10 p-4">
              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase mb-2", ROLE_STYLE[c.role])}>{c.title}</Badge>
              <p className="text-xs font-medium mb-2">{c.blurb}</p>
              <ul className="space-y-1">
                {c.points.map((p, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Table of contents */}
      <div className="flex flex-wrap gap-2">
        {toc.map((t) => (
          <a key={t.id} href={`#${t.id}`}
            className="rounded-full border border-border/40 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
            {t.title}
          </a>
        ))}
      </div>

      {/* Sections */}
      {SECTIONS.map((s, idx) => {
        const Icon = s.icon;
        return (
          <motion.section key={s.id} id={s.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.35 }}
            className="scroll-mt-20 rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 border-b border-border/30 bg-muted/10 px-6 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/25">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">{idx + 1}. {s.title}</h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">{s.intro}</p>

              {/* Permissions */}
              <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Who can do what</p>
                <div className="space-y-1.5">
                  {s.permissions.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <span>{p.action}</span>
                      <RolePills roles={p.roles} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              {s.steps?.map((st, i) => (
                <div key={i}>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">{st.heading}</p>
                  <ol className="space-y-1.5">
                    {st.items.map((it, j) => (
                      <li key={j} className="flex gap-2.5 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">{j + 1}</span>
                        <span className="text-muted-foreground">{it}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}

              {/* Tips */}
              {s.tips?.map((t, i) => (
                <p key={i} className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground">
                  <span className="font-bold text-primary">Tip:</span> {t}
                </p>
              ))}

              {/* Screenshots */}
              <div className={cn("grid gap-4", s.shots.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")}>
                {s.shots.map((sh) => (
                  <figure key={sh.src}>
                    <button type="button" onClick={() => setLightbox(sh)} title="Click to enlarge" className="block w-full group">
                      <img src={sh.src} alt={sh.caption}
                        className="w-full rounded-xl border border-border/40 shadow-sm group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all" />
                    </button>
                    <figcaption className="mt-1.5 text-[11px] text-muted-foreground text-center">{sh.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </motion.section>
        );
      })}

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground text-center">
        Wildtouch JMS · User Manual · If something here doesn&rsquo;t match what you see, your role may not include that action — ask your Admin.
      </p>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-6" onClick={() => setLightbox(null)}>
          <button className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" title="Close">
            <X className="h-5 w-5" />
          </button>
          <figure className="max-h-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.caption} className="max-h-[85vh] w-auto rounded-xl shadow-2xl" />
            <figcaption className="mt-2 text-center text-xs text-white/80">{lightbox.caption}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
