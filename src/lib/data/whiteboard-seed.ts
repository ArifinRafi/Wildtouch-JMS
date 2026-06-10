const now = new Date();
const iso = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
const today = iso(now);
const d = (daysAgo: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - daysAgo);
  return iso(dt);
};

export interface WhiteboardSeed {
  id: string;
  date: string;
  priority: string;
  customerName: string;
  orderType: string;
  proforma: string;
  product: string;
  qty: number | null;
  location: string;
  status: string;
  dueDate: string;
  dateOut: string | null;
  deliveryDate: string | null;
  completed: string;
  notes: string;
}

export const WHITEBOARD_SEED: WhiteboardSeed[] = [
  { id: "WB-0001", date: d(12), priority: "1 - Urgent", customerName: "Chester Zoo", orderType: "Order", proforma: "", product: "Floor", qty: 1, location: "UPS", status: "In Transit", dueDate: "15 Apr", dateOut: d(5), deliveryDate: null, completed: "", notes: "Priority dispatch — seasonal restock" },
  { id: "WB-0002", date: d(10), priority: "2 - Moderate", customerName: "Longleat Safari Park", orderType: "Order", proforma: "", product: "Large Keyrings", qty: 144, location: "DHL", status: "In Transit", dueDate: "20 Apr", dateOut: d(3), deliveryDate: null, completed: "", notes: "" },
  { id: "WB-0003", date: d(9), priority: "2 - Moderate", customerName: "Marwell Zoo", orderType: "Order", proforma: "", product: "Magnets", qty: 200, location: "Kiran", status: "TTO - To Take Out", dueDate: "22 Apr", dateOut: null, deliveryDate: null, completed: "", notes: "Kiran collecting Friday" },
  { id: "WB-0004", date: d(8), priority: "2 - Moderate", customerName: "Yorkshire Wildlife Park", orderType: "Pre Order", proforma: "PF-2026-041", product: "Boxed Necklaces", qty: 96, location: "UPS", status: "OIP - Order In Process", dueDate: "28 Apr", dateOut: null, deliveryDate: null, completed: "", notes: "Pre-order for summer season" },
  { id: "WB-0005", date: d(7), priority: "3 - Normal", customerName: "Twycross Zoo", orderType: "Order", proforma: "", product: "Pin Badges", qty: 288, location: "DHL", status: "In Transit", dueDate: "18 Apr", dateOut: d(2), deliveryDate: null, completed: "", notes: "" },
  { id: "WB-0006", date: d(6), priority: "1 - Urgent", customerName: "Woburn Safari Park", orderType: "Order", proforma: "", product: "Boxed Bracelets", qty: 72, location: "FED-EX", status: "TBC - To Be Checked", dueDate: "ASAP", dateOut: null, deliveryDate: null, completed: "", notes: "Quality check needed before dispatch" },
  { id: "WB-0007", date: d(14), priority: "2 - Moderate", customerName: "Colchester Zoo", orderType: "Order", proforma: "", product: "Boxed Earrings", qty: 120, location: "Richard", status: "In Transit", dueDate: "10 Apr", dateOut: d(7), deliveryDate: d(2), completed: "Completed", notes: "" },
  { id: "WB-0008", date: d(13), priority: "2 - Moderate", customerName: "Blackpool Zoo", orderType: "Order", proforma: "", product: "Magnets", qty: 150, location: "UPS", status: "In Transit", dueDate: "12 Apr", dateOut: d(6), deliveryDate: d(1), completed: "Completed", notes: "Delivered on time" },
  { id: "WB-0009", date: d(3), priority: "2 - Moderate", customerName: "Cotswold Wildlife Park", orderType: "Order", proforma: "", product: "Large Keyrings", qty: 60, location: "OFC", status: "TBM - To Be Made", dueDate: "30 Apr", dateOut: null, deliveryDate: null, completed: "", notes: "Awaiting stock from production" },
  { id: "WB-0010", date: today, priority: "2 - Moderate", customerName: "Dudley Zoo", orderType: "Order", proforma: "", product: "Floor", qty: 1, location: "Palletways", status: "Order Made - Await Delivery", dueDate: "05 May", dateOut: null, deliveryDate: null, completed: "", notes: "Pallet delivery — confirm dimensions" },
];
