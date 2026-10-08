"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  FileText,
  PackageCheck,
  Coins,
  Store,
  UserCheck,
  Save,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  ScanLine,
  Users as UsersIcon,
  Loader2,
  Download,
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
import { BarcodeImagesUpload } from "@/components/clients/barcode-images-upload";
import { uploadImage } from "@/lib/cloudinary";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, AdditionalContact, ClientIssue, ClientNote } from "@/lib/store/app-store";
import {
  ACCOUNT_STATUS_OPTIONS,
  normalizeAccountStatus,
  type AccountStatus,
} from "@/lib/client-status";
import { useRole } from "@/lib/hooks/use-role";
import { useAgents } from "@/lib/hooks/use-agents";
import { currencySymbol, normalizeCurrency, type SupportedCurrency } from "@/lib/currency";
import { normalizeClientBarcodeImages } from "@/lib/client-profile-validation";

// ─── Status config ──────────────────────────────────────────────────────────
const statusConfig: Record<AccountStatus, { label: string; className: string }> = {
  new_client: {
    label: "New Client",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  potential_client: {
    label: "Potential Client",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  previous_client: {
    label: "Previous Client",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  existing_client: {
    label: "Existing Client",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
};

function formatClientIssueDate(date: string): string {
  if (!date) return "No date";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Form types ─────────────────────────────────────────────────────────────
interface ClientForm {
  name: string;
  motherCompany: string;
  companyNumber: string;
  clientSource: string;
  theme: string;
  agentId: string;
  mainBuyerNames: string;
  primaryContactName: string;
  primaryContactPosition: string;
  furtherContactName: string;
  furtherContactPosition: string;
  furtherContactNumber: string;
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
  postcode: string;
  region: string;
  invoiceAddressFull: string;
  deliveryAddress: string;
  deliveryInstructions: string;
  invoiceProcedure: string;
  requirePO: boolean;
  emailInvoiceTo: string;
  vatRate: string;
  substituteDesigns: boolean;
  substituteDesignNotes: string;
  sample: boolean;
  sampleNotes: string;
  slatBoard: boolean;
  offStand: boolean;
  complaintsIssues: ClientIssue[];
  clientNotes: ClientNote[];
  standsInfo: string;
  upsellInfo: string;
  cardsUsed: string;
  boxesUsed: string;
  specialInformation: string;
  specialInformationDate: string;
  pricingCurrency: SupportedCurrency;
  categoryPrices: Record<string, string>;
  additionalContacts: AdditionalContact[];
  brandCardImage: string;
  barcodeImages: string[];
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
    companyNumber: c.companyNumber ?? "",
    clientSource: c.clientSource ?? "",
    theme: c.theme ?? "",
    agentId: c.agentId ?? "",
    mainBuyerNames: c.mainBuyerNames ?? "",
    primaryContactName: c.primaryContactName || c.otherContactAndPosition || "",
    primaryContactPosition: c.primaryContactPosition ?? "",
    furtherContactName: c.furtherContactName ?? "",
    furtherContactPosition: c.furtherContactPosition ?? "",
    furtherContactNumber: c.furtherContactNumber ?? "",
    contactNumber: c.contactNumber,
    mobOther: c.mobOther ?? "",
    email: c.email,
    emailOther: c.emailOther ?? "",
    shopManagerName: c.shopManagerName ?? "",
    giftShopContactNo: c.giftShopContactNo ?? "",
    webAddress: c.webAddress ?? "",
    history: c.history,
    accountStatus: normalizeAccountStatus(c.accountStatus),
    address: c.address,
    city: c.city,
    postcode: c.postcode ?? "",
    region: c.region ?? "",
    invoiceAddressFull: c.invoiceAddressFull ?? "",
    deliveryAddress: c.deliveryAddress ?? "",
    deliveryInstructions: c.deliveryInstructions ?? "",
    invoiceProcedure: c.invoiceProcedure ?? "",
    requirePO: c.requirePO ?? false,
    emailInvoiceTo: c.emailInvoiceTo ?? "",
    vatRate: c.vatRate != null ? String(c.vatRate) : "20",
    substituteDesigns: c.substituteDesigns ?? false,
    substituteDesignNotes: c.substituteDesignNotes ?? "",
    sample: c.sample ?? false,
    sampleNotes: c.sampleNotes ?? "",
    slatBoard: c.slatBoard ?? false,
    offStand: c.offStand ?? false,
    complaintsIssues: c.complaintsIssues ?? [],
    clientNotes: c.clientNotes ?? [],
    standsInfo: c.standsInfo ?? "",
    upsellInfo: c.upsellInfo ?? "",
    cardsUsed: c.cardsUsed ?? "",
    boxesUsed: c.boxesUsed ?? "",
    specialInformation: c.specialInformation ?? "",
    specialInformationDate: c.specialInformationDate ?? "",
    pricingCurrency: normalizeCurrency(c.pricingCurrency),
    categoryPrices,
    additionalContacts: c.additionalContacts ?? [],
    brandCardImage: c.brandCardImage ?? "",
    barcodeImages: normalizeClientBarcodeImages(c.barcodeImages, c.barcodeImage),
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const store = useAppStore();
  const client = store.clients.find((c) => c.id === id);
  const { isAdmin } = useRole();
  const { agents } = useAgents();

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<ClientForm>(() =>
    client ? clientToForm(client) : ({} as ClientForm),
  );
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState<{ brandCardImage?: boolean; barcodeImages?: boolean }>({});
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

  // ── Dated complaints and issues ──
  const addComplaintIssue = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      complaintsIssues: [
        ...prev.complaintsIssues,
        { date: new Date().toISOString().slice(0, 10), type: "complaint", note: "" },
      ],
    }));
  }, []);
  const removeComplaintIssue = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      complaintsIssues: prev.complaintsIssues.filter((_, i) => i !== idx),
    }));
  }, []);
  const updateComplaintIssue = useCallback(
    (idx: number, key: keyof ClientIssue, value: string) => {
      setForm((prev) => ({
        ...prev,
        complaintsIssues: prev.complaintsIssues.map((item, i) =>
          i === idx ? { ...item, [key]: value } as ClientIssue : item,
        ),
      }));
    },
    [],
  );

  // ── General client notes with an automatic date stamp ──
  const addClientNote = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      clientNotes: [
        ...prev.clientNotes,
        { date: new Date().toISOString().slice(0, 10), note: "" },
      ],
    }));
  }, []);
  const removeClientNote = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      clientNotes: prev.clientNotes.filter((_, i) => i !== idx),
    }));
  }, []);
  const updateClientNote = useCallback((idx: number, note: string) => {
    setForm((prev) => ({
      ...prev,
      clientNotes: prev.clientNotes.map((item, i) => (i === idx ? { ...item, note } : item)),
    }));
  }, []);

  // ── Image uploads (Cloudinary) ──
  const handleImageUpload = useCallback(
    async (key: "brandCardImage", file: File | null) => {
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
  const clearImage = useCallback((key: "brandCardImage") => {
    setForm((prev) => ({ ...prev, [key]: "" }));
  }, []);

  const appendBarcodeImages = useCallback((urls: string[]) => {
    setForm((prev) => ({ ...prev, barcodeImages: [...new Set([...prev.barcodeImages, ...urls])] }));
  }, []);
  const removeBarcodeImage = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, barcodeImages: prev.barcodeImages.filter((_, i) => i !== index) }));
  }, []);
  const setPrimaryBarcodeImage = useCallback((index: number) => {
    setForm((prev) => {
      const images = [...prev.barcodeImages];
      const [selected] = images.splice(index, 1);
      return selected ? { ...prev, barcodeImages: [selected, ...images] } : prev;
    });
  }, []);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (saving) return;
    if (uploading.brandCardImage || uploading.barcodeImages) {
      setFormError("Wait for image uploads to finish before saving.");
      return;
    }
    if (!form.name.trim() || !form.contactNumber.trim() || !form.email.trim()) {
      setFormError("Name, Mobile, and Email are required.");
      return;
    }
    setFormError("");

    // Per-category prices (product group → selected client currency) drive invoicing.
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
    const cleanedComplaintsIssues = form.complaintsIssues
      .map((item) => ({
        date: item.date.trim(),
        type: item.type,
        note: item.note.trim(),
      }))
      .filter((item) => item.date || item.note);
    const cleanedClientNotes = form.clientNotes
      .map((item) => ({ date: item.date.trim(), note: item.note.trim() }))
      .filter((item) => item.note);
    const selectedAgent = agents.find((agent) => agent.id === form.agentId);

    const data: Partial<Omit<Client, "id">> = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      postcode: form.postcode.trim(),
      region: form.region.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      history: (form.history as "good" | "bad") || "good",
      accountStatus: (form.accountStatus as AccountStatus) || "new_client",
      motherCompany: form.motherCompany.trim(),
      companyNumber: form.companyNumber.trim(),
      clientSource: form.clientSource.trim(),
      theme: form.theme.trim(),
      agentId: selectedAgent?.id ?? "",
      agentName: selectedAgent?.name ?? "",
      additionalContacts:
        cleanedAdditionalContacts.length > 0 ? cleanedAdditionalContacts : undefined,
      brandCardImage: form.brandCardImage || undefined,
      barcodeImages: form.barcodeImages,
      barcodeImage: form.barcodeImages[0] ?? "",
      mainBuyerNames: form.mainBuyerNames.trim() || undefined,
      primaryContactName: form.primaryContactName.trim() || undefined,
      primaryContactPosition: form.primaryContactPosition.trim() || undefined,
      furtherContactName: form.furtherContactName.trim() || undefined,
      furtherContactPosition: form.furtherContactPosition.trim() || undefined,
      furtherContactNumber: form.furtherContactNumber.trim() || undefined,
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
      substituteDesigns: form.substituteDesigns,
      substituteDesignNotes: form.substituteDesignNotes.trim(),
      sample: form.sample,
      sampleNotes: form.sampleNotes.trim(),
      slatBoard: form.slatBoard,
      offStand: form.offStand,
      complaintsIssues: cleanedComplaintsIssues,
      clientNotes: cleanedClientNotes,
      standsInfo: form.standsInfo.trim() || undefined,
      upsellInfo: form.upsellInfo.trim() || undefined,
      cardsUsed: form.cardsUsed.trim() || undefined,
      boxesUsed: form.boxesUsed.trim() || undefined,
      ...(isAdmin
        ? {
            pricingCurrency: form.pricingCurrency,
            categoryPrices: categoryPricesObj,
          }
        : {}),
      specialInformation: form.specialInformation.trim(),
      specialInformationDate: form.specialInformationDate,
    };

    setSaving(true);
    try {
      await store.updateClient(id, data);
      setMode("view");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save client.");
    } finally {
      setSaving(false);
    }
  }, [agents, form, id, isAdmin, store, uploading, saving]);

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

  const st = statusConfig[normalizeAccountStatus(client.accountStatus)];
  const assignedAgentName =
    agents.find((agent) => agent.id === client.agentId)?.name || client.agentName;
  const pricingCurrency = normalizeCurrency(client.pricingCurrency);
  const pricingSymbol = currencySymbol(pricingCurrency);
  const barcodeImages = normalizeClientBarcodeImages(client.barcodeImages, client.barcodeImage);

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
          {isAdmin && (
            <Link href={`/api/clients/export?id=${encodeURIComponent(client.id)}`}>
              <Button variant="outline" className="gap-2 rounded-xl border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15">
                <Download className="h-4 w-4" />
                Download Excel
              </Button>
            </Link>
          )}
        </div>

        {/* ── Sections ── */}
        <div className="space-y-6">
          {/* Contact Details */}
          <ViewSection title="Contact Details" icon={<Phone className="h-4 w-4" />}>
            <ViewGrid>
              <ViewField label="Client Name" value={client.name} />
              <ViewField label="Mother Company" value={client.motherCompany} />
              <ViewField label="Company Number" value={client.companyNumber} />
              <ViewField label="Client Source" value={client.clientSource} />
              <ViewField label="Agent Name" value={assignedAgentName} />
              <ViewField label="Main Buyer" value={client.mainBuyerNames} />
              <ViewField label="Primary Contact" value={client.primaryContactName || client.otherContactAndPosition} />
              <ViewField label="Primary Contact Position" value={client.primaryContactPosition} />
              <ViewField label="Further Contact Name" value={client.furtherContactName} />
              <ViewField label="Further Contact Position" value={client.furtherContactPosition} />
              <ViewField label="Further Contact Number" value={client.furtherContactNumber} />
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
          {(client.address || client.city || client.postcode || client.region || client.invoiceAddressFull || client.deliveryAddress || client.deliveryInstructions) && (
            <ViewSection title="Addresses" icon={<MapPin className="h-4 w-4" />}>
              <ViewGrid>
                <ViewField
                  label="Invoice Address"
                  value={[client.address, client.city].filter(Boolean).join(", ") || undefined}
                />
                <ViewField label="Postcode" value={client.postcode} />
                <ViewField label="Region" value={client.region} />
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
          {(client.theme || client.substituteDesigns !== undefined || client.substituteDesignNotes || client.sample !== undefined || client.sampleNotes || client.slatBoard !== undefined || client.offStand !== undefined || client.standsInfo || client.upsellInfo || client.cardsUsed || client.boxesUsed) && (
            <ViewSection title="Product Preferences" icon={<PackageCheck className="h-4 w-4" />}>
              <ViewGrid>
                <ViewField label="Theme" value={client.theme} />
                <ViewField
                  label="Substitute Designs"
                  value={client.substituteDesigns !== undefined ? (client.substituteDesigns ? "Yes" : "No") : undefined}
                />
                <ViewField label="Substitute Design Notes" value={client.substituteDesignNotes} />
                <ViewField label="Sample" value={client.sample ? "Yes" : "No"} />
                <ViewField label="Sample Notes" value={client.sampleNotes} />
                <ViewField label="Slat Board" value={client.slatBoard ? "Yes" : "No"} />
                <ViewField label="Off Stand" value={client.offStand ? "Yes" : "No"} />
                <ViewField label="Stands Info" value={client.standsInfo} />
                <ViewField label="Upsell Info" value={client.upsellInfo} />
                <ViewField label="Cards Used" value={client.cardsUsed} />
                <ViewField label="Boxes Used" value={client.boxesUsed} />
              </ViewGrid>
            </ViewSection>
          )}

          {/* Dated complaints and issues — styled like Design Tracker history cards. */}
          {client.complaintsIssues && client.complaintsIssues.length > 0 && (
            <ViewSection title="Complaints &amp; Issues" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-2">
                {[...client.complaintsIssues]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((item, idx) => (
                    <div key={`${item.date}-${idx}`} className="rounded-md border border-border/30 bg-muted/20 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {formatClientIssueDate(item.date)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[9px] font-bold uppercase",
                            item.type === "complaint"
                              ? "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400"
                              : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {item.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{item.note || "—"}</p>
                    </div>
                  ))}
              </div>
            </ViewSection>
          )}

          {/* Pricing — per product group (drives invoices) */}
          {client.categoryPrices && Object.keys(client.categoryPrices).length > 0 && (
            <ViewSection title="Pricing" icon={<Coins className="h-4 w-4" />}>
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  {pricingSymbol} {pricingCurrency}
                </Badge>
                <span className="text-[11px] text-muted-foreground">Transaction currency</span>
              </div>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                {Object.entries(client.categoryPrices).map(([cat, v]) => (
                  <div key={cat} className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="font-medium">{pricingSymbol}{Number(v).toFixed(2)}</span>
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
          {(client.brandCardImage || barcodeImages.length > 0) && (
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
                {barcodeImages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ScanLine className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Barcode Images
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {barcodeImages.map((url, index) => (
                        <button key={`${url}-${index}`} type="button" onClick={() => setLightbox({ src: url, alt: `Barcode ${index + 1}` })} title="View full screen" className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-border/30 bg-background cursor-zoom-in">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Barcode ${index + 1}`} className="max-h-full max-w-full object-contain" />
                          {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Primary</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ViewSection>
          )}

          {/* General dated notes — same visual treatment as Design Tracker history. */}
          {client.clientNotes && client.clientNotes.length > 0 && (
            <ViewSection title="Client Notes" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-2">
                {[...client.clientNotes]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((item, idx) => (
                    <div key={`${item.date}-${idx}`} className="rounded-md border border-border/30 bg-muted/20 px-3 py-2">
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {formatClientIssueDate(item.date)}
                      </span>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{item.note}</p>
                    </div>
                  ))}
              </div>
            </ViewSection>
          )}

          {/* Special Information */}
          {(client.specialInformation || client.specialInformationDate) && (
            <ViewSection title="Special Information" icon={<Store className="h-4 w-4" />}>
              {client.specialInformationDate && <p className="mb-1 text-xs text-muted-foreground">{formatClientIssueDate(client.specialInformationDate)}</p>}
              <p className="text-sm whitespace-pre-wrap">{client.specialInformation || "—"}</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Company Number</Label>
              <Input
                className={inputCls}
                placeholder="Registered company number"
                value={form.companyNumber}
                onChange={(e) => setField("companyNumber", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Agent Name</Label>
              <Select
                value={form.agentId || "unassigned"}
                onValueChange={(value) => value && setField("agentId", value === "unassigned" ? "" : value)}
              >
                <SelectTrigger className={inputCls} aria-label="Agent Name">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-clientSource">Client Source</Label>
            <Input id="edit-clientSource" className={inputCls} maxLength={500} placeholder="How this client came to us" value={form.clientSource} onChange={(e) => setField("clientSource", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Main Buyer Names</Label>
            <Input className={inputCls} value={form.mainBuyerNames} onChange={(e) => setField("mainBuyerNames", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Primary Contact</Label>
              <Input className={inputCls} value={form.primaryContactName} onChange={(e) => setField("primaryContactName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input className={inputCls} value={form.primaryContactPosition} onChange={(e) => setField("primaryContactPosition", e.target.value)} />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-border/40 bg-muted/10 p-4">
            <div>
              <Label className="text-sm font-semibold">Further Contact</Label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Add another contact person for this client.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input className={inputCls} value={form.furtherContactName} onChange={(e) => setField("furtherContactName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input className={inputCls} value={form.furtherContactPosition} onChange={(e) => setField("furtherContactPosition", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Number</Label>
                <Input className={inputCls} value={form.furtherContactNumber} onChange={(e) => setField("furtherContactNumber", e.target.value)} />
              </div>
            </div>
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
                  {ACCOUNT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Postcode</Label>
              <Input className={inputCls} value={form.postcode} onChange={(e) => setField("postcode", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Input className={inputCls} value={form.region} onChange={(e) => setField("region", e.target.value)} />
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
            <Label htmlFor="edit-theme">Theme</Label>
            <Input id="edit-theme" className={inputCls} maxLength={500} value={form.theme} onChange={(e) => setField("theme", e.target.value)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-border/40 bg-muted/10 p-3">
            <div className="flex h-10 items-center gap-2">
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
              <Label>Substitute Design Notes</Label>
              <Input
                className={inputCls}
                placeholder="Add substitute design details"
                value={form.substituteDesignNotes}
                onChange={(e) => setField("substituteDesignNotes", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-border/40 bg-muted/10 p-3">
            <div className="flex h-10 items-center gap-2">
              <input id="edit-sample" type="checkbox" checked={form.sample} onChange={(e) => setField("sample", e.target.checked)} className="h-4 w-4 rounded border-border/40" />
              <Label htmlFor="edit-sample">Sample</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sampleNotes">Sample Notes</Label>
              <Input id="edit-sampleNotes" className={inputCls} maxLength={2000} placeholder="Add sample details" value={form.sampleNotes} onChange={(e) => setField("sampleNotes", e.target.value)} />
            </div>
          </div>
          </div>
          <div className="space-y-1.5">
            <Label>Stands Info</Label>
            <Textarea className={inputCls} rows={2} value={form.standsInfo} onChange={(e) => setField("standsInfo", e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-2">
              <input id="edit-slatBoard" type="checkbox" checked={form.slatBoard} onChange={(e) => setField("slatBoard", e.target.checked)} className="h-4 w-4 rounded border-border/40" />
              <Label htmlFor="edit-slatBoard">Slat Board</Label>
            </div>
            <div className="flex items-center gap-2">
              <input id="edit-offStand" type="checkbox" checked={form.offStand} onChange={(e) => setField("offStand", e.target.checked)} className="h-4 w-4 rounded border-border/40" />
              <Label htmlFor="edit-offStand">Off Stand</Label>
            </div>
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

      {/* ── Complaints & Issues: dated note cards ── */}
      <EditSection title="Complaints &amp; Issues" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Keep a dated history of complaints and issues for this client.
            </p>
            <Button type="button" size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={addComplaintIssue}>
              <Plus className="h-3.5 w-3.5" /> Add Entry
            </Button>
          </div>
          {form.complaintsIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
              No complaints or issues recorded.
            </div>
          ) : (
            <div className="space-y-2">
              {form.complaintsIssues.map((item, idx) => (
                <div key={idx} className="rounded-md border border-border/30 bg-muted/20 p-3">
                  <div className="grid gap-3 md:grid-cols-[170px_160px_auto] md:items-end">
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Date</Label>
                      <Input type="date" className={inputCls} value={item.date} onChange={(e) => updateComplaintIssue(idx, "date", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Type</Label>
                      <Select value={item.type} onValueChange={(value) => value && updateComplaintIssue(idx, "type", value)}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complaint">Complaint</SelectItem>
                          <SelectItem value="issue">Issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="justify-self-start text-destructive md:justify-self-end" onClick={() => removeComplaintIssue(idx)}>
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-[11px]">Complaint or issue notes</Label>
                    <Textarea className={inputCls} rows={3} value={item.note} onChange={(e) => updateComplaintIssue(idx, "note", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </EditSection>

      {/* ── Section 5: Pricing (admin only) ── */}
      {isAdmin && (
        <EditSection title="Pricing" icon={<Coins className="h-4 w-4" />}>
          <p className="text-[11px] text-muted-foreground -mt-1 mb-3">
            Choose pounds or euros, then add this client&rsquo;s price for each product group. Invoices use the selected currency.
          </p>
          <CategoryPriceEditor
            categories={productCategories}
            value={form.categoryPrices}
            onChange={(next) => setForm((prev) => ({ ...prev, categoryPrices: next }))}
            currency={form.pricingCurrency}
            onCurrencyChange={(pricingCurrency) => setForm((prev) => ({ ...prev, pricingCurrency }))}
            inputCls={inputCls}
          />
        </EditSection>
      )}

      {/* ── Section 7: Media (Brand Card + Barcodes) ── */}
      <EditSection title="Brand Card &amp; Barcodes" icon={<ImageIcon className="h-4 w-4" />}>
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
          <BarcodeImagesUpload inputId="edit-barcode-images" images={form.barcodeImages} onAppend={appendBarcodeImages} onRemove={removeBarcodeImage} onSetPrimary={setPrimaryBarcodeImage} onUploadingChange={(value) => setUploading((current) => ({ ...current, barcodeImages: value }))} onView={(url) => setLightbox({ src: url, alt: "Barcode" })} />
        </div>
        {imgError && (
          <p className="mt-3 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">{imgError}</p>
        )}
      </EditSection>

      {/* ── Client Notes: automatic date-stamped history ── */}
      <EditSection title="Client Notes" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Notes are automatically stamped with the date they are added.
            </p>
            <Button type="button" size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={addClientNote}>
              <Plus className="h-3.5 w-3.5" /> Add Note
            </Button>
          </div>
          {form.clientNotes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
              No client notes recorded.
            </div>
          ) : (
            <div className="space-y-2">
              {form.clientNotes.map((item, idx) => (
                <div key={idx} className="rounded-md border border-border/30 bg-muted/20 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {formatClientIssueDate(item.date)}
                    </span>
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => removeClientNote(idx)}>
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                  <Textarea
                    className={cn(inputCls, "mt-2")}
                    rows={3}
                    placeholder="Add a client note"
                    value={item.note}
                    onChange={(e) => updateClientNote(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </EditSection>

      {/* ── Section 9: Special Information ── */}
      <EditSection title="Special Information" icon={<Store className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="space-y-1.5 max-w-[220px]">
            <Label htmlFor="edit-specialInformationDate">Date</Label>
            <Input id="edit-specialInformationDate" type="date" className={inputCls} value={form.specialInformationDate} onChange={(e) => setField("specialInformationDate", e.target.value)} />
          </div>
          <Label htmlFor="edit-specialInformation">Information</Label>
          <Textarea
            id="edit-specialInformation"
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
            disabled={saving || !!uploading.brandCardImage || !!uploading.barcodeImages}
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
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
