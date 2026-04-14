"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertCircle,
  Clock,
  Truck,
  CheckCircle2,
  Package,
  LayoutGrid,
  Printer,
  CalendarDays,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WhiteboardOrder {
  id: string;
  date: string;            // YYYY-MM-DD
  priority: Priority;
  customerName: string;
  orderType: OrderType;
  proforma: string;
  product: string;
  qty: number | null;
  location: string;        // courier or handler
  status: OrderStatus;
  dueDate: string;         // free text
  dateOut: string | null;  // YYYY-MM-DD
  deliveryDate: string | null;
  completed: string;       // "Completed" | ""
  notes: string;
}

type Priority   = "1 - Urgent" | "2 - Moderate" | "3 - Normal";
type OrderType  = "Order" | "Pre Order" | "Proforma";
type OrderStatus =
  | "TTO - To Take Out"
  | "OIP - Order In Process"
  | "TBC - To Be Checked"
  | "TBM - To Be Made"
  | "In Transit"
  | "Order Made - Await Delivery";

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIORITIES: Priority[]    = ["1 - Urgent", "2 - Moderate", "3 - Normal"];
const ORDER_TYPES: OrderType[]  = ["Order", "Pre Order", "Proforma"];
const STATUSES: OrderStatus[]   = [
  "TTO - To Take Out",
  "OIP - Order In Process",
  "TBC - To Be Checked",
  "TBM - To Be Made",
  "In Transit",
  "Order Made - Await Delivery",
];
const LOCATIONS = [
  "UPS", "DHL", "FED-EX", "Palletways",
  "Kiran", "Richard", "Zia", "OFC",
];
const PRIORITY_FILTERS = ["All", "1 - Urgent", "2 - Moderate", "3 - Normal"] as const;
type PriorityFilter = typeof PRIORITY_FILTERS[number];

// ─── Seed data ────────────────────────────────────────────────────────────────
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const d = (daysAgo: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - daysAgo);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const seedOrders: WhiteboardOrder[] = [
  {
    id: "WB-0001", date: d(12), priority: "1 - Urgent", customerName: "Chester Zoo",
    orderType: "Order", proforma: "", product: "Floor", qty: 1,
    location: "UPS", status: "In Transit", dueDate: "15 Apr",
    dateOut: d(5), deliveryDate: null, completed: "", notes: "Priority dispatch — seasonal restock",
  },
  {
    id: "WB-0002", date: d(10), priority: "2 - Moderate", customerName: "Longleat Safari Park",
    orderType: "Order", proforma: "", product: "Large Keyrings", qty: 144,
    location: "DHL", status: "In Transit", dueDate: "20 Apr",
    dateOut: d(3), deliveryDate: null, completed: "", notes: "",
  },
  {
    id: "WB-0003", date: d(9), priority: "2 - Moderate", customerName: "Marwell Zoo",
    orderType: "Order", proforma: "", product: "Magnets", qty: 200,
    location: "Kiran", status: "TTO - To Take Out", dueDate: "22 Apr",
    dateOut: null, deliveryDate: null, completed: "", notes: "Kiran collecting Friday",
  },
  {
    id: "WB-0004", date: d(8), priority: "2 - Moderate", customerName: "Yorkshire Wildlife Park",
    orderType: "Pre Order", proforma: "PF-2026-041", product: "Boxed Necklaces", qty: 96,
    location: "UPS", status: "OIP - Order In Process", dueDate: "28 Apr",
    dateOut: null, deliveryDate: null, completed: "", notes: "Pre-order for summer season",
  },
  {
    id: "WB-0005", date: d(7), priority: "3 - Normal", customerName: "Twycross Zoo",
    orderType: "Order", proforma: "", product: "Pin Badges", qty: 288,
    location: "DHL", status: "In Transit", dueDate: "18 Apr",
    dateOut: d(2), deliveryDate: null, completed: "", notes: "",
  },
  {
    id: "WB-0006", date: d(6), priority: "1 - Urgent", customerName: "Woburn Safari Park",
    orderType: "Order", proforma: "", product: "Boxed Bracelets", qty: 72,
    location: "FED-EX", status: "TBC - To Be Checked", dueDate: "ASAP",
    dateOut: null, deliveryDate: null, completed: "", notes: "Quality check needed before dispatch",
  },
  {
    id: "WB-0007", date: d(14), priority: "2 - Moderate", customerName: "Colchester Zoo",
    orderType: "Order", proforma: "", product: "Boxed Earrings", qty: 120,
    location: "Richard", status: "In Transit", dueDate: "10 Apr",
    dateOut: d(7), deliveryDate: d(2), completed: "Completed", notes: "",
  },
  {
    id: "WB-0008", date: d(13), priority: "2 - Moderate", customerName: "Blackpool Zoo",
    orderType: "Order", proforma: "", product: "Magnets", qty: 150,
    location: "UPS", status: "In Transit", dueDate: "12 Apr",
    dateOut: d(6), deliveryDate: d(1), completed: "Completed", notes: "Delivered on time",
  },
  {
    id: "WB-0009", date: d(3), priority: "2 - Moderate", customerName: "Cotswold Wildlife Park",
    orderType: "Order", proforma: "", product: "Large Keyrings", qty: 60,
    location: "OFC", status: "TBM - To Be Made", dueDate: "30 Apr",
    dateOut: null, deliveryDate: null, completed: "", notes: "Awaiting stock from production",
  },
  {
    id: "WB-0010", date: today, priority: "2 - Moderate", customerName: "Dudley Zoo",
    orderType: "Order", proforma: "", product: "Floor", qty: 1,
    location: "Palletways", status: "Order Made - Await Delivery",
    dueDate: "05 May", dateOut: null, deliveryDate: null, completed: "",
    notes: "Pallet delivery — confirm dimensions",
  },
];

// ─── Empty form ────────────────────────────────────────────────────────────────
interface OrderForm {
  date: string; priority: Priority; customerName: string;
  orderType: OrderType; proforma: string; product: string;
  qty: string; location: string; status: OrderStatus;
  dueDate: string; dateOut: string; deliveryDate: string;
  completed: string; notes: string;
}
const emptyForm = (): OrderForm => ({
  date: today, priority: "2 - Moderate", customerName: "",
  orderType: "Order", proforma: "", product: "",
  qty: "", location: "UPS", status: "OIP - Order In Process",
  dueDate: "", dateOut: "", deliveryDate: "",
  completed: "", notes: "",
});

// ─── Priority helpers ─────────────────────────────────────────────────────────
const priorityStyle: Record<Priority, string> = {
  "1 - Urgent":   "bg-red-500/15 border-red-500/30 text-red-500 dark:text-red-400",
  "2 - Moderate": "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
  "3 - Normal":   "bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400",
};
const priorityLabel: Record<Priority, string> = {
  "1 - Urgent": "Urgent", "2 - Moderate": "Moderate", "3 - Normal": "Normal",
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusStyle: Record<OrderStatus, string> = {
  "TTO - To Take Out":            "bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-400",
  "OIP - Order In Process":       "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400",
  "TBC - To Be Checked":          "bg-yellow-500/15 border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
  "TBM - To Be Made":             "bg-pink-500/15 border-pink-500/30 text-pink-600 dark:text-pink-400",
  "In Transit":                   "bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
  "Order Made - Await Delivery":  "bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400",
};
const statusShort: Record<OrderStatus, string> = {
  "TTO - To Take Out":           "TTO",
  "OIP - Order In Process":      "In Process",
  "TBC - To Be Checked":         "To Check",
  "TBM - To Be Made":            "To Make",
  "In Transit":                  "In Transit",
  "Order Made - Await Delivery": "Awaiting",
};

// ─── Date formatter ───────────────────────────────────────────────────────────
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DigitalWhiteboardPage() {
  const [orders, setOrders] = useState<WhiteboardOrder[]>(seedOrders);
  const [search, setSearch]               = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");
  const [statusFilter, setStatusFilter]   = useState<string>("all");

  // ── Dialog state ──
  const [dlgOpen, setDlgOpen]       = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<OrderForm>(emptyForm());
  const [formError, setFormError]   = useState("");

  // ── Filtered list ─────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...orders];

    // Priority filter
    if (priorityFilter !== "All") {
      list = list.filter((o) => o.priority === priorityFilter);
    }

    // Status dropdown filter
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q) ||
        o.notes.toLowerCase().includes(q) ||
        o.dueDate.toLowerCase().includes(q)
      );
    }

    // Sort: Urgent first, then by date desc
    return list.sort((a, b) => {
      const pa = a.priority === "1 - Urgent" ? 0 : a.priority === "2 - Moderate" ? 1 : 2;
      const pb = b.priority === "1 - Urgent" ? 0 : b.priority === "2 - Moderate" ? 1 : 2;
      if (pa !== pb) return pa - pb;
      return b.date.localeCompare(a.date);
    });
  }, [orders, priorityFilter, statusFilter, search]);

  // ── Stats (counts per priority, always from full orders list) ─────────────
  const stats = useMemo(() => ({
    total:    orders.length,
    urgent:   orders.filter((o) => o.priority === "1 - Urgent").length,
    moderate: orders.filter((o) => o.priority === "2 - Moderate").length,
    normal:   orders.filter((o) => o.priority === "3 - Normal").length,
    completed:orders.filter((o) => o.completed === "Completed").length,
  }), [orders]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setDlgOpen(true);
  };

  const openEdit = (o: WhiteboardOrder) => {
    setEditingId(o.id);
    setForm({
      date: o.date, priority: o.priority, customerName: o.customerName,
      orderType: o.orderType, proforma: o.proforma, product: o.product,
      qty: o.qty?.toString() ?? "", location: o.location, status: o.status,
      dueDate: o.dueDate, dateOut: o.dateOut ?? "", deliveryDate: o.deliveryDate ?? "",
      completed: o.completed, notes: o.notes,
    });
    setFormError("");
    setDlgOpen(true);
  };

  const handleSave = useCallback(() => {
    if (!form.customerName.trim()) { setFormError("Customer name is required."); return; }
    if (!form.product.trim())      { setFormError("Product is required.");        return; }

    const built: Omit<WhiteboardOrder, "id"> = {
      date: form.date, priority: form.priority, customerName: form.customerName.trim(),
      orderType: form.orderType, proforma: form.proforma.trim(), product: form.product.trim(),
      qty: form.qty ? Number(form.qty) : null, location: form.location, status: form.status,
      dueDate: form.dueDate.trim(), dateOut: form.dateOut || null,
      deliveryDate: form.deliveryDate || null, completed: form.completed, notes: form.notes.trim(),
    };

    if (editingId) {
      setOrders((prev) => prev.map((o) => o.id === editingId ? { ...o, ...built } : o));
    } else {
      const id = `WB-${String(orders.length + 1).padStart(4, "0")}`;
      setOrders((prev) => [{ id, ...built }, ...prev]);
    }
    setDlgOpen(false);
  }, [form, editingId, orders.length]);

  const deleteOrder = (id: string) => setOrders((prev) => prev.filter((o) => o.id !== id));

  // ── Print PDF ─────────────────────────────────────────────────────────────
  const printBoard = useCallback(() => {
    const tabLabel = priorityFilter === "All" ? "Full Board" : priorityLabel[priorityFilter as Priority] ?? priorityFilter;
    const title = `Wildtouch JMS — Digital Whiteboard — ${tabLabel}`;

    const rows = visible.map((o) => `
      <tr class="${o.priority === "1 - Urgent" ? "urgent" : ""}">
        <td>${fmtDate(o.date)}</td>
        <td class="priority-${o.priority === "1 - Urgent" ? "urgent" : o.priority === "2 - Moderate" ? "moderate" : "normal"}">${priorityLabel[o.priority]}</td>
        <td><strong>${o.customerName}</strong></td>
        <td>${o.orderType}</td>
        <td>${o.product}</td>
        <td>${o.qty ?? "—"}</td>
        <td>${o.location}</td>
        <td>${statusShort[o.status]}</td>
        <td>${o.dueDate || "—"}</td>
        <td>${fmtDate(o.dateOut)}</td>
        <td>${fmtDate(o.deliveryDate)}</td>
        <td>${o.completed || "—"}</td>
        <td>${o.notes || "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  @page { size: A3 landscape; margin: 14mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 9px; color: #111; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #6d28d9; padding-bottom: 8px; margin-bottom: 12px; }
  .brand { font-size: 18px; font-weight: 800; color: #6d28d9; }
  .meta h2 { font-size: 13px; font-weight: 700; }
  .meta p  { font-size: 9px; color: #666; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #6d28d9; color: #fff; }
  thead th { padding: 5px 6px; text-align: left; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
  tbody tr { border-bottom: 1px solid #e5e7eb; }
  tbody tr:nth-child(even) { background: #faf5ff; }
  tbody tr.urgent { background: #fff1f2; }
  tbody td { padding: 5px 6px; vertical-align: top; }
  .priority-urgent   { color: #dc2626; font-weight: 700; }
  .priority-moderate { color: #d97706; font-weight: 600; }
  .priority-normal   { color: #6b7280; }
  footer { margin-top: 14px; font-size: 8px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style></head><body>
<header>
  <div class="brand">Wildtouch JMS</div>
  <div class="meta">
    <h2>Digital Whiteboard — ${tabLabel}</h2>
    <p>${visible.length} orders &nbsp;|&nbsp; Printed: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
  </div>
</header>
<table>
  <thead><tr>
    <th>Date</th><th>Priority</th><th>Customer</th><th>Type</th>
    <th>Product</th><th>Qty</th><th>Handler</th><th>Status</th>
    <th>Due Date</th><th>Date Out</th><th>Delivered</th><th>Completed</th><th>Notes</th>
  </tr></thead>
  <tbody>${rows || `<tr><td colspan="13" style="text-align:center;padding:16px;color:#9ca3af;">No orders to display</td></tr>`}</tbody>
</table>
<footer>Wildtouch Jewellery Management System &mdash; Confidential</footer>
</body></html>`;

    const win = window.open("", "_blank", "width=1400,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  }, [visible, priorityFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-24">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Digital Whiteboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live order tracking board — prioritised, filtered, always up to date
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={openAdd}
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Order
          </Button>
        </motion.div>
      </motion.div>

      {/* ── Priority filter chips (clickable) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {/* All */}
        {(() => {
          const isActive = priorityFilter === "All";
          return (
            <motion.button
              key="All"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setPriorityFilter("All")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-gradient-to-r from-primary to-indigo-500 text-white border-transparent shadow-lg shadow-primary/25"
                  : "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              All Orders
              <span className={cn(
                "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isActive ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
              )}>
                {stats.total}
              </span>
            </motion.button>
          );
        })()}

        {/* Urgent */}
        {(() => {
          const isActive = priorityFilter === "1 - Urgent";
          return (
            <motion.button
              key="Urgent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.13 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setPriorityFilter(isActive ? "All" : "1 - Urgent")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-red-500 text-white border-transparent shadow-lg shadow-red-500/30"
                  : "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
              )}
            >
              <AlertCircle className="h-4 w-4" />
              Urgent
              <span className={cn(
                "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isActive ? "bg-white/20 text-white" : "bg-red-500/15 text-red-600 dark:text-red-400"
              )}>
                {stats.urgent}
              </span>
            </motion.button>
          );
        })()}

        {/* Moderate */}
        {(() => {
          const isActive = priorityFilter === "2 - Moderate";
          return (
            <motion.button
              key="Moderate"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setPriorityFilter(isActive ? "All" : "2 - Moderate")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-amber-500 text-white border-transparent shadow-lg shadow-amber-500/30"
                  : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
              )}
            >
              <Clock className="h-4 w-4" />
              Moderate
              <span className={cn(
                "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isActive ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              )}>
                {stats.moderate}
              </span>
            </motion.button>
          );
        })()}

        {/* Normal */}
        {(() => {
          const isActive = priorityFilter === "3 - Normal";
          return (
            <motion.button
              key="Normal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.23 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setPriorityFilter(isActive ? "All" : "3 - Normal")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-slate-500 text-white border-transparent shadow-lg shadow-slate-500/20"
                  : "text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/20"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Normal
              <span className={cn(
                "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isActive ? "bg-white/20 text-white" : "bg-slate-500/15 text-slate-600 dark:text-slate-400"
              )}>
                {stats.normal}
              </span>
            </motion.button>
          );
        })()}

        {/* Completed (info only, not a priority filter — stays right-aligned) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28 }}
          className="ml-auto flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        >
          <Truck className="h-4 w-4" />
          Completed: {stats.completed}
        </motion.div>
      </motion.div>

      {/* ── Secondary filter bar: status + search ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger size="sm" className="w-56 rounded-xl border-border/40 bg-card/70 glass">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Search customer, product, handler, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-card/70 glass border-border/40"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                {[
                  "Date", "Priority", "Customer Name", "Type", "Product",
                  "Qty", "Handler", "Status", "Due Date",
                  "Date Out", "Delivered", "Completed", "Notes", "Actions",
                ].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {visible.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={14}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                      >
                        <Package className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No orders match your filters</p>
                        <p className="text-xs mt-1 opacity-60">Try a different tab or clear the search</p>
                      </motion.div>
                    </td>
                  </tr>
                ) : visible.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.22, delay: i * 0.025 }}
                    className={cn(
                      "group border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0",
                      order.priority === "1 - Urgent" && order.completed !== "Completed"
                        ? "bg-red-500/5"
                        : ""
                    )}
                  >
                    {/* Date */}
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        <span className="text-xs tabular-nums">{fmtDate(order.date)}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-3 align-middle">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border",
                        priorityStyle[order.priority]
                      )}>
                        {priorityLabel[order.priority]}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-3 align-middle">
                      <p className="text-sm font-semibold whitespace-nowrap">{order.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{order.id}</p>
                    </td>

                    {/* Order Type */}
                    <td className="px-3 py-3 align-middle">
                      <span className="text-xs text-muted-foreground">{order.orderType}</span>
                    </td>

                    {/* Product */}
                    <td className="px-3 py-3 align-middle">
                      <p className="text-sm font-medium whitespace-nowrap">{order.product}</p>
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-3 align-middle">
                      <p className="text-sm tabular-nums font-medium">{order.qty ?? "—"}</p>
                    </td>

                    {/* Handler/Location */}
                    <td className="px-3 py-3 align-middle">
                      <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold bg-muted/60 border border-border/30 text-foreground">
                        {order.location}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold border",
                        statusStyle[order.status]
                      )}>
                        {statusShort[order.status]}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-3 py-3 align-middle">
                      <p className={cn(
                        "text-xs font-medium whitespace-nowrap",
                        order.dueDate.toLowerCase() === "asap" ? "text-red-500 font-bold" : "text-muted-foreground"
                      )}>
                        {order.dueDate || "—"}
                      </p>
                    </td>

                    {/* Date Out */}
                    <td className="px-3 py-3 align-middle">
                      <p className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">{fmtDate(order.dateOut)}</p>
                    </td>

                    {/* Delivery Date */}
                    <td className="px-3 py-3 align-middle">
                      <p className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">{fmtDate(order.deliveryDate)}</p>
                    </td>

                    {/* Completed */}
                    <td className="px-3 py-3 align-middle">
                      {order.completed === "Completed" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Done</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-3 align-middle max-w-[200px]">
                      <p className="text-xs text-muted-foreground truncate">{order.notes || "—"}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(order)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteOrder(order.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer bar */}
        <div className="px-5 py-3 border-t border-border/20 bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{visible.length}</span>{" "}
            order{visible.length === 1 ? "" : "s"}
            {priorityFilter !== "All" && (
              <> — <span className="font-semibold text-foreground">{priorityLabel[priorityFilter as Priority]}</span> priority</>
            )}
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={printBoard}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold text-foreground transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            Print / Download PDF
          </motion.button>
        </div>
      </motion.div>

      {/* ── Floating Add button ── */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={openAdd}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full px-5 py-3 bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-shadow"
      >
        <Plus className="h-5 w-5" />
        Add Order
      </motion.button>

      {/* ══ ADD / EDIT DIALOG ═══════════════════════════════════════════════ */}
      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl bg-card border-border/40 max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingId ? "Edit Order" : "New Order"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20"
              >
                {formError}
              </motion.p>
            )}

            {/* Row 1: Date + Priority + Order Type */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</Label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, date: e.target.value })); }}
                  className="h-9 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Type</Label>
                <Select value={form.orderType} onValueChange={(v) => setForm((f) => ({ ...f, orderType: v as OrderType }))}>
                  <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Customer + Proforma */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Name *</Label>
                <Input
                  placeholder="e.g. Chester Zoo"
                  value={form.customerName}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, customerName: e.target.value })); }}
                  className="rounded-xl bg-muted/30 border-border/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Proforma <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. PF-2026-041"
                  value={form.proforma}
                  onChange={(e) => setForm((f) => ({ ...f, proforma: e.target.value }))}
                  className="rounded-xl bg-muted/30 border-border/40"
                />
              </div>
            </div>

            {/* Row 3: Product + Qty */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product *</Label>
                <Input
                  placeholder="e.g. Floor, Large Keyrings, Magnets, Pin Badges…"
                  value={form.product}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, product: e.target.value })); }}
                  className="rounded-xl bg-muted/30 border-border/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 144"
                  value={form.qty}
                  onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                  className="rounded-xl bg-muted/30 border-border/40"
                />
              </div>
            </div>

            {/* Row 4: Handler + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Handler / Courier</Label>
                <Select value={form.location} onValueChange={(v) => setForm((f) => ({ ...f, location: v ?? "" }))}>
                  <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as OrderStatus }))}>
                  <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 5: Due Date + Date Out + Delivery Date */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date</Label>
                <Input
                  placeholder="e.g. 30 Apr or ASAP"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="rounded-xl bg-muted/30 border-border/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Date Out <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
                </Label>
                <input
                  type="date"
                  value={form.dateOut}
                  onChange={(e) => setForm((f) => ({ ...f, dateOut: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Delivery Date <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
                </Label>
                <input
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Completed toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completion</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, completed: "" }))}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border transition-all",
                    form.completed !== "Completed"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                      : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-amber-500/10"
                  )}
                >
                  <Clock className="h-4 w-4" /> In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, completed: "Completed" }))}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border transition-all",
                    form.completed === "Completed"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-emerald-500/10"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" /> Completed
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</Label>
              <Textarea
                placeholder="Any extra details, special instructions…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="rounded-xl bg-muted/30 border-border/40 min-h-[72px]"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/30 bg-transparent rounded-b-2xl">
            <Button variant="outline" onClick={() => setDlgOpen(false)} className="rounded-xl border-border/40">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              {editingId ? "Save Changes" : "Add Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
