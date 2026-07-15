"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  PackageCheck,
  PoundSterling,
  Store,
  UserCheck,
  Globe,
  Save,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  ScanLine,
  Users as UsersIcon,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CategoryPriceEditor } from "@/components/clients/category-price-editor";
import { uploadImage } from "@/lib/cloudinary";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, AdditionalContact } from "@/lib/store/app-store";
import { type AccountStatus } from "@/lib/mock-data/clients";

// ─── Status config ──────────────────────────────────────────────────────────
const statusConfig: Record<AccountStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  proforma: {
    label: "Proforma",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  on_hold: {
    label: "On Hold",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  bad_credit: {
    label: "Bad Credit",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

// ─── Form types ─────────────────────────────────────────────────────────────
interface ClientForm {
  name: string;
  motherCompany: string;
  mainBuyerNames: string;
  otherContactAndPosition: string;
  contactNumber: string;
  mobOther: string;
  email: string;
  emailOther: string;
  shopManagerName: string;
  giftShopContactNo: string;
  webAddress: string;
  history: string;
  accountStatus: string;
  address: string;
  city: string;
  invoiceAddressFull: string;
  deliveryAddress: string;
  deliveryInstructions: string;
  invoiceProcedure: string;
  requirePO: boolean;
  emailInvoiceTo: string;
  vatRate: string;
  topSellingAnimals: string;
  slowSellerDesigns: string;
  substituteDesigns: boolean;
  standsInfo: string;
  upsellInfo: string;
  cardsUsed: string;
  boxesUsed: string;
  specialInformation: string;
  categoryPrices: Record<string, string>;
  additionalContacts: AdditionalContact[];
  brandCardImage: string;
  barcodeImage: string;
}

function clientToForm(c: Client): ClientForm {
  const categoryPrices: Record<string, string> = {};
  if (c.categoryPrices) {
    for (const [k, v] of Object.entries(c.categoryPrices)) {
      if (v != null) categoryPrices[k] = String(v);
    }
  }
  return {
    name: c.name,
    motherCompany: c.motherCompany ?? "",
    mainBuyerNames: c.mainBuyerNames ?? "",
    otherContactAndPosition: c.otherContactAndPosition ?? "",
    contactNumber: c.contactNumber,
    mobOther: c.mobOther ?? "",
    email: c.email,
    emailOther: c.emailOther ?? "",
    shopManagerName: c.shopManagerName ?? "",
    giftShopContactNo: c.giftShopContactNo ?? "",
    webAddress: c.webAddress ?? "",
    history: c.history,
    accountStatus: c.accountStatus,
    address: c.address,
    city: c.city,
    invoiceAddressFull: c.invoiceAddressFull ?? "",
    deliveryAddress: c.deliveryAddress ?? "",
    deliveryInstructions: c.deliveryInstructions ?? "",
    invoiceProcedure: c.invoiceProcedure ?? "",
    requirePO: c.requirePO ?? false,
    emailInvoiceTo: c.emailInvoiceTo ?? "",
    vatRate: c.vatRate != null ? String(c.vatRate) : "20",
    topSellingAnimals: c.topSellingAnimals ?? "",
    slowSellerDesigns: c.slowSellerDesigns ?? "",
    substituteDesigns: c.substituteDesigns ?? false,
    standsInfo: c.standsInfo ?? "",
    upsellInfo: c.upsellInfo ?? "",
    cardsUsed: c.cardsUsed ?? "",
    boxesUsed: c.boxesUsed ?? "",
    specialInformation: c.specialInformation ?? "",
    categoryPrices,
    additionalContacts: c.additionalContacts ?? [],
    brandCardImage: c.brandCardImage ?? "",
    barcodeImage: c.barcodeImage ?? "",
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const store = useAppStore();
  const client = store.clients.find((c) => c.id === id);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<ClientForm>(() =>
    client ? clientToForm(client) : ({} as ClientForm),
  );
  const [formError, setFormError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState<{ brandCardImage?: boolean; barcodeImage?: boolean }>({});
  const [imgError, setImgError] = useState("");
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  // Re-derive form when switching to edit mode
  const startEdit = useCallback(() => {
    if (client) setForm(clientToForm(client));
    setFormError("");
    setMode("edit");
  }, [client]);

  const cancelEdit = useCallback(() => {
    setFormError("");
    setMode("view");
  }, []);

  const setField = useCallback(
    (key: keyof ClientForm, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );
  // Product categories (managed group list) — each gets a per-client price used for invoicing.
  const [productCategories, setProductCategories] = useState<string[]>([]);
  useEffect(() => {
    let on = true;
    fetch("/api/product-groups").then((r) => (r.ok ? r.json() : [])).then((d: { name: string }[]) => {
      if (on) setProductCategories(d.map((g) => g.name));
    }).catch(() => {});
    return () => { on = false; };
  }, []);

  // ── Additional contacts (repeatable list) ──
  const addAdditionalContact = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      additionalContacts: [
        ...prev.additionalContacts,
        { name: "", contactNumber: "", address: "" },
      ],
    }));
  }, []);
  const removeAdditionalContact = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((_, i) => i !== idx),
    }));
  }, []);
  const updateAdditionalContact = useCallback(
    (idx: number, key: keyof AdditionalContact, value: string) => {
      setForm((prev) => ({
        ...prev,
        additionalContacts: prev.additionalContacts.map((c, i) =>
          i === idx ? { ...c, [key]: value } : c,
        ),
      }));
    },
    [],
  );

  // ── Image uploads (Cloudinary) ──
  const handleImageUpload = useCallback(
    async (key: "brandCardImage" | "barcodeImage", file: File | null) => {
      if (!file) return;
      setUploading((u) => ({ ...u, [key]: true }));
      setImgError("");
      try {
        const url = await uploadImage(file);
        setForm((prev) => ({ ...prev, [key]: url }));
      } catch (e) {
        setImgError(e instanceof Error ? e.message : "Image upload failed.");
      } finally {
        setUploading((u) => ({ ...u, [key]: false }));
      }
    },
    [],
  );
  const clearImage = useCallback((key: "brandCardImage" | "barcodeImage") => {
    setForm((prev) => ({ ...prev, [key]: "" }));
  }, []);

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!form.name.trim() || !form.contactNumber.trim() || !form.email.trim()) {
      setFormError("Name, Mobile, and Email are required.");
      return;
    }
    setFormError("");

    // Per-category prices (product group → £) — drives category-level invoicing.
    const categoryPricesObj: Record<string, number> = {};
    for (const [cat, raw] of Object.entries(form.categoryPrices)) {
      if (raw && raw.trim()) {
        const n = parseFloat(raw);
        if (!isNaN(n) && n >= 0) categoryPricesObj[cat] = n;
      }
    }

    const cleanedAdditionalContacts = form.additionalContacts
      .map((c) => ({
        name: c.name?.trim() || "",
        contactNumber: c.contactNumber?.trim() || "",
        address: c.address?.trim() || "",
      }))
      .filter((c) => c.name || c.contactNumber || c.address);

    const data: Partial<Omit<Client, "id">> = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      history: (form.history as "good" | "bad") || "good",
      accountStatus: (form.accountStatus as AccountStatus) || "active",
      motherCompany: form.motherCompany.trim() || undefined,
      additionalContacts:
        cleanedAdditionalContacts.length > 0 ? cleanedAdditionalContacts : undefined,
      brandCardImage: form.brandCardImage || undefined,
      barcodeImage: form.barcodeImage || undefined,
      mainBuyerNames: form.mainBuyerNames.trim() || undefined,
      otherContactAndPosition: form.otherContactAndPosition.trim() || undefined,
      mobOther: form.mobOther.trim() || undefined,
      emailOther: form.emailOther.trim() || undefined,
      shopManagerName: form.shopManagerName.trim() || undefined,
      giftShopContactNo: form.giftShopContactNo.trim() || undefined,
      webAddress: form.webAddress.trim() || undefined,
      invoiceAddressFull: form.invoiceAddressFull.trim() || undefined,
      deliveryAddress: form.deliveryAddress.trim() || undefined,
      deliveryInstructions: form.deliveryInstructions.trim() || undefined,
      invoiceProcedure: form.invoiceProcedure.trim() || undefined,
      requirePO: form.requirePO,
      emailInvoiceTo: form.emailInvoiceTo.trim() || undefined,
      vatRate: Math.max(0, parseFloat(form.vatRate) || 0),
      topSellingAnimals: form.topSellingAnimals.trim() || undefined,
      slowSellerDesigns: form.slowSellerDesigns.trim() || undefined,
      substituteDesigns: form.substituteDesigns,
      standsInfo: form.standsInfo.trim() || undefined,
      upsellInfo: form.upsellInfo.trim() || undefined,
      cardsUsed: form.cardsUsed.trim() || undefined,
      boxesUsed: form.boxesUsed.trim() || undefined,
      categoryPrices: categoryPricesObj,
      specialInformation: form.specialInformation.trim() || undefined,
    };

    store.updateClient(id, data);
    setMode("view");
  }, [form, id, store]);

  // ── Delete ──
  const handleDelete = useCallback(() => {
    store.deleteClient(id);
    router.push("/clients");
  }, [id, store, router]);

  // ── Input class ──
  const inputCls = "rounded-xl bg-muted/30 border-border/40";

  // ── Not found ──
  if (!client && store.clientsLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading client…</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p className="text-lg font-semibold mb-2">Client not found</p>
        <p className="text-sm mb-6">No client exists with ID &ldquo;{id}&rdquo;</p>
        <Link
          href="/clients"
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
      </div>
    );
  }

  const st = statusConfig[client.accountStatus];

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW MODE
  // ═══════════════════════════════════════════════════════════════════════════
  if (mode === "view") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 pb-24"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Link
              href="/clients"
              className="mt-1.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
                {client.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-muted-foreground">{client.id}</span>
                <Badge variant="outline" className={cn("text-xs border", st.className)}>
                  {st.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs border",
                    client.history === "good"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                  )}
                >
                  {client.history === "good" ? "Good History" : "Bad History"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="space-y-6">
          {/* Contact Details */}
          <ViewSection title="Contact Details" icon={<Phone className="h-4 w-4" />}>
            <ViewGrid>
              <ViewField label="Client Name" value={client.name} />
              <ViewField label="Mother Company" value={client.motherCompany} />
              <ViewField label="Main Buyer" value={client.mainBuyerNames} />
              <ViewField label="Other Contact" value={client.otherContactAndPosition} />
              <ViewField label="Mob" value={client.contactNumber} />
              <ViewField label="Mob Other" value={client.mobOther} />
              <ViewField label="Email" value={client.email} />
              <ViewField label="Email Other" value={client.emailOther} />
              <ViewField label="Shop Manager" value={client.shopManagerName} />
              <ViewField label="Gift Shop Contact" value={client.giftShopContactNo} />
              <ViewField label="Web Address" value={client.webAddress} />
            </ViewGrid>
          </ViewSection>

          {/* Addresses */}
          {(client.address || client.city || client.invoiceAddressFull || client.deliveryAddress || client.deliveryInstructions) && (
            <ViewSection title="Addresses" icon={<MapPin className="h-4 w-4" />}>
              <ViewGrid>
                <ViewField
                  label="Invoice Address"
                  value={[client.address, client.city].filter(Boolean).join(", ") || undefined}
                />
                <ViewField label="Full Invoice Address" value={client.invoiceAddressFull} />
                <ViewField label="Delivery Address" value={client.deliveryAddress} />
                <ViewField label="Delivery Instructions" value={client.deliveryInstructions} />
              </ViewGrid>
            </ViewSection>
          )}

          {/* Invoicing */}
          {(client.invoiceProcedure || client.requirePO !== undefined || client.emailInvoiceTo || client.vatRate != null) && (
            <ViewSection title="Invoicing" icon={<FileText className="h-4 w-4" />}>
              <ViewGrid>
                <ViewField label="VAT Rate" value={client.vatRate != null ? `${client.vatRate}%` : undefined} />
                <ViewField label="Invoice Procedure" value={client.invoiceProcedure} />
                <ViewField label="Require PO" value={client.requirePO ? "Yes" : "No"} />
                <ViewField label="Email Invoice To" value={client.emailInvoiceTo} />
              </ViewGrid>
            </ViewSection>
          )}

          {/* Product Preferences */}
          {(client.topSellingAnimals || client.slowSellerDesigns || client.substituteDesigns !== undefined || client.standsInfo || client.upsellInfo || client.cardsUsed || client.boxesUsed) && (
            <ViewSection title="Product Preferences" icon={<PackageCheck className="h-4 w-4" />}>
              <ViewGrid>
                <ViewField label="Top Selling Animals" value={client.topSellingAnimals} />
                <ViewField label="Slow Seller Designs" value={client.slowSellerDesigns} />
                <ViewField
                  label="Substitute Designs"
                  value={client.substituteDesigns !== undefined ? (client.substituteDesigns ? "Yes" : "No") : undefined}
                />
                <ViewField label="Stands Info" value={client.standsInfo} />
                <ViewField label="Upsell Info" value={client.upsellInfo} />
                <ViewField label="Cards Used" value={client.cardsUsed} />
                <ViewField label="Boxes Used" value={client.boxesUsed} />
              </ViewGrid>
            </ViewSection>
          )}

          {/* Pricing — per product group (drives invoices) */}
          {client.categoryPrices && Object.keys(client.categoryPrices).length > 0 && (
            <ViewSection title="Pricing" icon={<PoundSterling className="h-4 w-4" />}>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                {Object.entries(client.categoryPrices).map(([cat, v]) => (
                  <div key={cat} className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="font-medium">{"£"}{Number(v).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Invoices bill each planogram product at its group&rsquo;s price above.</p>
            </ViewSection>
          )}

          {/* Additional Information */}
          {client.additionalContacts && client.additionalContacts.length > 0 && (
            <ViewSection
              title="Additional Information"
              icon={<UsersIcon className="h-4 w-4" />}
            >
              <div className="space-y-3">
                {client.additionalContacts.map((c, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/30 bg-muted/10 p-3 text-sm"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                      Entry {idx + 1}
                    </div>
                    <ViewGrid>
                      <ViewField label="Other Name" value={c.name} />
                      <ViewField label="Other Contact Number" value={c.contactNumber} />
                    </ViewGrid>
                    {c.address && (
                      <div className="mt-1">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Other Address
                        </span>
                        <p className="text-sm font-medium mt-0.5 whitespace-pre-wrap">
                          {c.address}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ViewSection>
          )}

          {/* Brand Card / Barcode */}
          {(client.brandCardImage || client.barcodeImage) && (
            <ViewSection
              title="Media"
              icon={<ImageIcon className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {client.brandCardImage && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Brand Card
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLightbox({ src: client.brandCardImage!, alt: "Brand Card" })}
                      title="View full screen"
                      className="relative h-40 w-full overflow-hidden rounded-lg border border-border/30 bg-background flex items-center justify-center cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={client.brandCardImage}
                        alt="Brand Card"
                        className="max-h-full max-w-full object-contain"
                      />
                    </button>
                  </div>
                )}
                {client.barcodeImage && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ScanLine className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Barcode
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLightbox({ src: client.barcodeImage!, alt: "Barcode" })}
                      title="View full screen"
                      className="relative h-40 w-full overflow-hidden rounded-lg border border-border/30 bg-background flex items-center justify-center cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={client.barcodeImage}
                        alt="Barcode"
                        className="max-h-full max-w-full object-contain"
                      />
                    </button>
                  </div>
                )}
              </div>
            </ViewSection>
          )}

          {/* Special Information */}
          {client.specialInformation && (
            <ViewSection title="Special Information" icon={<Store className="h-4 w-4" />}>
              <p className="text-sm whitespace-pre-wrap">{client.specialInformation}</p>
            </ViewSection>
          )}

          {/* Account */}
          <ViewSection title="Account" icon={<UserCheck className="h-4 w-4" />}>
            <ViewGrid>
              <ViewField label="Last Order" value={client.lastOrder} />
              <ViewField label="Total Orders" value={String(client.totalOrders)} />
            </ViewGrid>
          </ViewSection>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={startEdit}
              className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </motion.div>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2"
              >
                <p className="text-sm text-destructive font-medium">
                  Are you sure? This cannot be undone.
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-lg text-xs"
                  onClick={handleDelete}
                >
                  Confirm Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-xs"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        {lightbox && (
          <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
        )}
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-24"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={cancelEdit}
          className="mt-1.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/40 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Edit Client
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{client.name} &mdash; {client.id}</p>
        </div>
      </div>

      {formError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5 border border-destructive/20 font-medium"
        >
          {formError}
        </motion.p>
      )}

      {/* ── Section 1: Contact Info ── */}
      <EditSection title="Contact Info" icon={<Phone className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input className={inputCls} value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mother Company</Label>
              <Input
                className={inputCls}
                placeholder="Parent / holding company"
                value={form.motherCompany}
                onChange={(e) => setField("motherCompany", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Main Buyer Names</Label>
            <Input className={inputCls} value={form.mainBuyerNames} onChange={(e) => setField("mainBuyerNames", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Other Contact & Position</Label>
            <Input className={inputCls} value={form.otherContactAndPosition} onChange={(e) => setField("otherContactAndPosition", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mobile *</Label>
              <Input className={inputCls} value={form.contactNumber} onChange={(e) => setField("contactNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Other Mobile</Label>
              <Input className={inputCls} value={form.mobOther} onChange={(e) => setField("mobOther", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input className={inputCls} value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Other Email</Label>
              <Input className={inputCls} value={form.emailOther} onChange={(e) => setField("emailOther", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Shop Manager Name</Label>
              <Input className={inputCls} value={form.shopManagerName} onChange={(e) => setField("shopManagerName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gift Shop Contact No</Label>
              <Input className={inputCls} value={form.giftShopContactNo} onChange={(e) => setField("giftShopContactNo", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Web Address</Label>
            <Input className={inputCls} value={form.webAddress} onChange={(e) => setField("webAddress", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>History</Label>
              <Select value={form.history} onValueChange={(v) => v && setField("history", v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="bad">Bad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Account Status</Label>
              <Select value={form.accountStatus} onValueChange={(v) => v && setField("accountStatus", v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="proforma">Proforma</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="bad_credit">Bad Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information (repeatable) — end of Contact section */}
          <div className="space-y-3 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-semibold">Additional Information</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Other names, contact numbers and addresses — add as many as needed.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 border-border/40"
                onClick={addAdditionalContact}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {form.additionalContacts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No additional contacts yet. Click &ldquo;Add&rdquo; to create one.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.additionalContacts.map((c, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Entry {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAdditionalContact(idx)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Remove this entry"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Other Name</Label>
                        <Input
                          className={inputCls}
                          value={c.name ?? ""}
                          onChange={(e) =>
                            updateAdditionalContact(idx, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Other Contact Number</Label>
                        <Input
                          className={inputCls}
                          value={c.contactNumber ?? ""}
                          onChange={(e) =>
                            updateAdditionalContact(idx, "contactNumber", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Other Address</Label>
                      <Textarea
                        className={inputCls}
                        rows={2}
                        value={c.address ?? ""}
                        onChange={(e) =>
                          updateAdditionalContact(idx, "address", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </EditSection>

      {/* ── Section 2: Addresses ── */}
      <EditSection title="Addresses" icon={<MapPin className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Invoice Address Line 1</Label>
              <Input className={inputCls} value={form.address} onChange={(e) => setField("address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input className={inputCls} value={form.city} onChange={(e) => setField("city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Full Invoice Address</Label>
            <Textarea className={inputCls} rows={3} value={form.invoiceAddressFull} onChange={(e) => setField("invoiceAddressFull", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Delivery Address</Label>
            <Textarea className={inputCls} rows={3} value={form.deliveryAddress} onChange={(e) => setField("deliveryAddress", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Delivery Instructions</Label>
            <Textarea className={inputCls} rows={3} value={form.deliveryInstructions} onChange={(e) => setField("deliveryInstructions", e.target.value)} />
          </div>
        </div>
      </EditSection>

      {/* ── Section 3: Invoicing ── */}
      <EditSection title="Invoicing" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Invoice Procedure</Label>
            <Input className={inputCls} value={form.invoiceProcedure} onChange={(e) => setField("invoiceProcedure", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="edit-requirePO"
              type="checkbox"
              checked={form.requirePO}
              onChange={(e) => setField("requirePO", e.target.checked)}
              className="h-4 w-4 rounded border-border/40"
            />
            <Label htmlFor="edit-requirePO">Require PO</Label>
          </div>
          <div className="space-y-1.5">
            <Label>Email Invoice To</Label>
            <Input className={inputCls} value={form.emailInvoiceTo} onChange={(e) => setField("emailInvoiceTo", e.target.value)} />
          </div>
          <div className="space-y-1.5 max-w-[200px]">
            <Label>VAT rate (%)</Label>
            <Input type="text" inputMode="decimal" className={inputCls} value={form.vatRate}
              onChange={(e) => setField("vatRate", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="20" />
          </div>
        </div>
      </EditSection>

      {/* ── Section 4: Product Intelligence ── */}
      <EditSection title="Product Intelligence" icon={<PackageCheck className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Top Selling Animals</Label>
            <Textarea className={inputCls} rows={3} value={form.topSellingAnimals} onChange={(e) => setField("topSellingAnimals", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Slow Seller Designs</Label>
            <Textarea className={inputCls} rows={3} value={form.slowSellerDesigns} onChange={(e) => setField("slowSellerDesigns", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="edit-substituteDesigns"
              type="checkbox"
              checked={form.substituteDesigns}
              onChange={(e) => setField("substituteDesigns", e.target.checked)}
              className="h-4 w-4 rounded border-border/40"
            />
            <Label htmlFor="edit-substituteDesigns">Substitute Designs</Label>
          </div>
          <div className="space-y-1.5">
            <Label>Stands Info</Label>
            <Textarea className={inputCls} rows={2} value={form.standsInfo} onChange={(e) => setField("standsInfo", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Upsell Info</Label>
            <Input className={inputCls} value={form.upsellInfo} onChange={(e) => setField("upsellInfo", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cards Used</Label>
              <Input className={inputCls} value={form.cardsUsed} onChange={(e) => setField("cardsUsed", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Boxes Used</Label>
              <Input className={inputCls} value={form.boxesUsed} onChange={(e) => setField("boxesUsed", e.target.value)} />
            </div>
          </div>
        </div>
      </EditSection>

      {/* ── Section 5: Pricing ── */}
      <EditSection title="Pricing" icon={<PoundSterling className="h-4 w-4" />}>
        <p className="text-[11px] text-muted-foreground -mt-1 mb-3">
          Price per <span className="font-semibold">product group</span> for this client. Groups are created on the
          Products page (Add Group) — here you search an existing group, set this client&rsquo;s price, and add it.
          Invoices bill each planogram product at its group&rsquo;s price.
        </p>
        <CategoryPriceEditor
          categories={productCategories}
          value={form.categoryPrices}
          onChange={(next) => setForm((prev) => ({ ...prev, categoryPrices: next }))}
          inputCls={inputCls}
        />
      </EditSection>

      {/* ── Section 7: Media (Brand Card + Barcode) ── */}
      <EditSection title="Brand Card &amp; Barcode" icon={<ImageIcon className="h-4 w-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadCard
            label="Brand Card"
            icon={<ImageIcon className="h-4 w-4" />}
            value={form.brandCardImage}
            uploading={!!uploading.brandCardImage}
            onUpload={(file) => handleImageUpload("brandCardImage", file)}
            onClear={() => clearImage("brandCardImage")}
            onView={() => setLightbox({ src: form.brandCardImage, alt: "Brand Card" })}
          />
          <ImageUploadCard
            label="Barcode"
            icon={<ScanLine className="h-4 w-4" />}
            value={form.barcodeImage}
            uploading={!!uploading.barcodeImage}
            onUpload={(file) => handleImageUpload("barcodeImage", file)}
            onClear={() => clearImage("barcodeImage")}
            onView={() => setLightbox({ src: form.barcodeImage, alt: "Barcode" })}
          />
        </div>
        {imgError && (
          <p className="mt-3 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">{imgError}</p>
        )}
      </EditSection>

      {/* ── Section 8: Special Information ── */}
      <EditSection title="Special Information" icon={<Store className="h-4 w-4" />}>
        <div className="space-y-1.5">
          <Textarea
            className={inputCls}
            rows={4}
            value={form.specialInformation}
            onChange={(e) => setField("specialInformation", e.target.value)}
          />
        </div>
      </EditSection>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleSave}
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </motion.div>
        <Button variant="outline" className="gap-2 rounded-xl border-border/40" onClick={cancelEdit}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </motion.div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function ViewSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border/40 bg-card/70 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function EditSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border/40 bg-card/70 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function ViewGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</div>;
}

function ViewField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </span>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

// ─── Image upload card ──────────────────────────────────────────────────────
function ImageUploadCard({
  label,
  icon,
  value,
  onUpload,
  onClear,
  uploading = false,
  onView,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onUpload: (file: File | null) => void;
  onClear: () => void;
  uploading?: boolean;
  onView?: () => void;
}) {
  const inputId = `edit-upload-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <Label className="text-sm font-semibold">{label}</Label>
        </div>
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {uploading ? (
        <div className="flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border/40 bg-background/30">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Uploading…</span>
        </div>
      ) : value ? (
        <button
          type="button"
          onClick={onView}
          title="View full screen"
          className="relative h-36 w-full overflow-hidden rounded-lg border border-border/30 bg-background flex items-center justify-center cursor-zoom-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="max-h-full max-w-full object-contain"
          />
        </button>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border/40 bg-background/30 hover:bg-accent/20 hover:border-primary/40 transition-colors"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">
            Click to upload
          </span>
          <span className="text-[10px] text-muted-foreground/60">PNG, JPG, SVG</span>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
