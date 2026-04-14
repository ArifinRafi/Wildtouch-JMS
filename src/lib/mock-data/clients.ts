// Mock client data shared across pages.
// Extracted so other pages (e.g. Home Workers production logs) can reference
// the same client list without importing from a Next.js page module.

export type AccountStatus = "active" | "proforma" | "on_hold" | "bad_credit";
export type History       = "good" | "bad";

export interface ClientPricing {
  cardedFloor?: number;
  pinBadges?: number;
  christmasDecorations?: number;
  largeKeyrings?: number;
  earringsCarded?: number;
  boxedNecklace?: number;
  magnet?: number;
  rings?: number;
  boxedBracelets?: number;
  logoKeyrings?: number;
  logoMagnets?: number;
  christmasKeyrings?: number;
}

/** Label + key pairs for the pricing form */
export const PRODUCT_PRICE_FIELDS: { key: keyof ClientPricing; label: string }[] = [
  { key: "cardedFloor",          label: "Carded Floor" },
  { key: "pinBadges",            label: "Pin Badges" },
  { key: "christmasDecorations", label: "Christmas Decorations" },
  { key: "largeKeyrings",        label: "Large Keyrings" },
  { key: "earringsCarded",       label: "Earrings Carded" },
  { key: "boxedNecklace",        label: "Boxed Necklace" },
  { key: "magnet",               label: "Magnet" },
  { key: "rings",                label: "Rings" },
  { key: "boxedBracelets",       label: "Boxed Bracelets" },
  { key: "logoKeyrings",         label: "Logo Keyrings" },
  { key: "logoMagnets",          label: "Logo Magnets" },
  { key: "christmasKeyrings",    label: "Christmas Keyrings" },
];

export interface Client {
  // === Core fields (mandatory — backward compatible) ===
  id: string;
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  email: string;
  history: History;
  accountStatus: AccountStatus;
  lastOrder: string;
  totalOrders: number;

  // === Contact (optional) ===
  mainBuyerNames?: string;
  otherContactAndPosition?: string;
  mobOther?: string;
  emailOther?: string;
  shopManagerName?: string;
  giftShopContactNo?: string;

  // === Address (optional) ===
  invoiceAddressFull?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;

  // === Invoicing (optional) ===
  invoiceProcedure?: string;
  requirePO?: boolean;
  emailInvoiceTo?: string;

  // === Sales intelligence (optional) ===
  topSellingAnimals?: string;
  slowSellerDesigns?: string;
  substituteDesigns?: boolean;
  webAddress?: string;
  standsInfo?: string;
  upsellInfo?: string;

  // === Other (optional) ===
  cardsUsed?: string;
  boxesUsed?: string;
  pricing?: ClientPricing;
  specialInformation?: string;
}

export const clients: Client[] = [
  {
    id: "CLT-001",
    name: "Boutique Gems Ltd",
    address: "14 Jewellery Quarter, Vyse Street",
    city: "Birmingham",
    contactNumber: "+44 121 456 7890",
    email: "sarah.j@boutiquegems.co.uk",
    history: "good",
    accountStatus: "active",
    lastOrder: "62 days ago",
    totalOrders: 48,
  },
  {
    id: "CLT-002",
    name: "Silver Dreams",
    address: "7 The Strand",
    city: "London",
    contactNumber: "+44 207 123 4567",
    email: "orders@silverdreams.co.uk",
    history: "good",
    accountStatus: "active",
    lastOrder: "12 days ago",
    totalOrders: 112,
  },
  {
    id: "CLT-003",
    name: "Coastal Jewellers",
    address: "2 Harbour View, Marine Parade",
    city: "Brighton",
    contactNumber: "+44 1273 654 321",
    email: "mark@coastaljewellers.co.uk",
    history: "bad",
    accountStatus: "bad_credit",
    lastOrder: "78 days ago",
    totalOrders: 9,
  },
  {
    id: "CLT-004",
    name: "The Gift Shop Cheltenham",
    address: "33 Promenade",
    city: "Cheltenham",
    contactNumber: "+44 1242 889 900",
    email: "emily@giftcheltenham.co.uk",
    history: "good",
    accountStatus: "active",
    lastOrder: "95 days ago",
    totalOrders: 67,
  },
  {
    id: "CLT-005",
    name: "Gems & Grace",
    address: "9 King Street",
    city: "Manchester",
    contactNumber: "+44 161 234 5678",
    email: "contact@gemsandgrace.co.uk",
    history: "good",
    accountStatus: "proforma",
    lastOrder: "5 days ago",
    totalOrders: 31,
  },
  {
    id: "CLT-006",
    name: "North Wales Gifts",
    address: "18 Castle Square",
    city: "Conwy",
    contactNumber: "+44 1492 776 543",
    email: "info@northwalesgifts.co.uk",
    history: "bad",
    accountStatus: "on_hold",
    lastOrder: "120 days ago",
    totalOrders: 4,
  },
  {
    id: "CLT-007",
    name: "The Bead Shop",
    address: "55 Carnaby Street",
    city: "London",
    contactNumber: "+44 207 987 6543",
    email: "trade@thebeadshop.co.uk",
    history: "good",
    accountStatus: "active",
    lastOrder: "3 days ago",
    totalOrders: 89,
  },
  {
    id: "CLT-008",
    name: "Hartley's Boutique",
    address: "22 George Street",
    city: "Edinburgh",
    contactNumber: "+44 131 556 7788",
    email: "orders@hartleysboutique.co.uk",
    history: "good",
    accountStatus: "active",
    lastOrder: "19 days ago",
    totalOrders: 23,
  },
  {
    id: "CLT-009",
    name: "Crown Jewels Retail",
    address: "4 High Street",
    city: "Windsor",
    contactNumber: "+44 1753 443 221",
    email: "buy@crownjewelsretail.co.uk",
    history: "bad",
    accountStatus: "bad_credit",
    lastOrder: "200 days ago",
    totalOrders: 2,
  },
  {
    id: "CLT-010",
    name: "Emerald & Co",
    address: "77 Buchanan Street",
    city: "Glasgow",
    contactNumber: "+44 141 332 9988",
    email: "hello@emeraldandco.co.uk",
    history: "good",
    accountStatus: "active",
    lastOrder: "28 days ago",
    totalOrders: 55,
  },
  {
    id: "CLT-011",
    name: "Silver Wishes",
    address: "3 Church Lane",
    city: "York",
    contactNumber: "+44 1904 667 112",
    email: "silverwishes@email.co.uk",
    history: "good",
    accountStatus: "proforma",
    lastOrder: "7 days ago",
    totalOrders: 17,
  },
  {
    id: "CLT-012",
    name: "Lakeview Gifts",
    address: "12 Waterside",
    city: "Windermere",
    contactNumber: "+44 15394 44321",
    email: "lakeview@giftsuk.co.uk",
    history: "bad",
    accountStatus: "on_hold",
    lastOrder: "89 days ago",
    totalOrders: 6,
  },
];
