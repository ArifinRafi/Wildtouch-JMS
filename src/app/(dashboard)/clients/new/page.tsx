"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  PackageCheck,
  Coins,
  Store,
  Save,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Users as UsersIcon,
  UserPlus,
  Loader2,
} from "lucide-react";
import { uploadImage } from "@/lib/cloudinary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryPriceEditor } from "@/components/clients/category-price-editor";
import { BarcodeImagesUpload } from "@/components/clients/barcode-images-upload";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, AdditionalContact, ClientIssue, ClientNote } from "@/lib/store/app-store";
import { ACCOUNT_STATUS_OPTIONS, type AccountStatus } from "@/lib/client-status";
import { useRole } from "@/lib/hooks/use-role";
import { useAgents } from "@/lib/hooks/use-agents";
import type { SupportedCurrency } from "@/lib/currency";

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

function emptyForm(): ClientForm {
  return {
    name: "",
    motherCompany: "",
    companyNumber: "",
    clientSource: "",
    theme: "",
    agentId: "",
    mainBuyerNames: "",
    primaryContactName: "",
    primaryContactPosition: "",
    furtherContactName: "",
    furtherContactPosition: "",
    furtherContactNumber: "",
    contactNumber: "",
    mobOther: "",
    email: "",
    emailOther: "",
    shopManagerName: "",
    giftShopContactNo: "",
    webAddress: "",
    history: "good",
    accountStatus: "new_client",
    address: "",
    city: "",
    postcode: "",
    region: "",
    invoiceAddressFull: "",
    deliveryAddress: "",
    deliveryInstructions: "",
    invoiceProcedure: "",
    requirePO: false,
    emailInvoiceTo: "",
    vatRate: "20",
    substituteDesigns: false,
    substituteDesignNotes: "",
    sample: false,
    sampleNotes: "",
    slatBoard: false,
    offStand: false,
    complaintsIssues: [],
    clientNotes: [],
    standsInfo: "",
    upsellInfo: "",
    cardsUsed: "",
    boxesUsed: "",
    specialInformation: "",
    specialInformationDate: "",
    pricingCurrency: "GBP",
    categoryPrices: {},
    additionalContacts: [],
    brandCardImage: "",
    barcodeImages: [],
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function NewClientPage() {
  const router = useRouter();
  const store = useAppStore();
  const { isAdmin } = useRole();
  const { agents } = useAgents();

  const [form, setForm] = useState<ClientForm>(emptyForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<{ brandCardImage?: boolean; barcodeImages?: boolean }>({});
  const [imgError, setImgError] = useState("");

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
    const hasCategoryPrices = Object.keys(categoryPricesObj).length > 0;
    const selectedAgent = agents.find((agent) => agent.id === form.agentId);

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

    const data: Omit<Client, "id"> = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      postcode: form.postcode.trim(),
      region: form.region.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      history: (form.history as "good" | "bad") || "good",
      accountStatus: (form.accountStatus as AccountStatus) || "new_client",
      lastOrder: "0 days ago",
      totalOrders: 0,
      ...(form.motherCompany.trim() && { motherCompany: form.motherCompany.trim() }),
      ...(form.companyNumber.trim() && { companyNumber: form.companyNumber.trim() }),
      ...(selectedAgent && { agentId: selectedAgent.id, agentName: selectedAgent.name }),
      ...(cleanedAdditionalContacts.length > 0 && {
        additionalContacts: cleanedAdditionalContacts,
      }),
      ...(form.brandCardImage && { brandCardImage: form.brandCardImage }),
      barcodeImages: form.barcodeImages,
      barcodeImage: form.barcodeImages[0] ?? "",
      clientSource: form.clientSource.trim(),
      theme: form.theme.trim(),
      ...(form.mainBuyerNames.trim() && { mainBuyerNames: form.mainBuyerNames.trim() }),
      ...(form.primaryContactName.trim() && { primaryContactName: form.primaryContactName.trim() }),
      ...(form.primaryContactPosition.trim() && { primaryContactPosition: form.primaryContactPosition.trim() }),
      ...(form.furtherContactName.trim() && { furtherContactName: form.furtherContactName.trim() }),
      ...(form.furtherContactPosition.trim() && { furtherContactPosition: form.furtherContactPosition.trim() }),
      ...(form.furtherContactNumber.trim() && { furtherContactNumber: form.furtherContactNumber.trim() }),
      ...(form.mobOther.trim() && { mobOther: form.mobOther.trim() }),
      ...(form.emailOther.trim() && { emailOther: form.emailOther.trim() }),
      ...(form.shopManagerName.trim() && { shopManagerName: form.shopManagerName.trim() }),
      ...(form.giftShopContactNo.trim() && { giftShopContactNo: form.giftShopContactNo.trim() }),
      ...(form.webAddress.trim() && { webAddress: form.webAddress.trim() }),
      ...(form.invoiceAddressFull.trim() && {
        invoiceAddressFull: form.invoiceAddressFull.trim(),
      }),
      ...(form.deliveryAddress.trim() && { deliveryAddress: form.deliveryAddress.trim() }),
      ...(form.deliveryInstructions.trim() && {
        deliveryInstructions: form.deliveryInstructions.trim(),
      }),
      ...(form.invoiceProcedure.trim() && { invoiceProcedure: form.invoiceProcedure.trim() }),
      requirePO: form.requirePO,
      vatRate: Math.max(0, parseFloat(form.vatRate) || 0),
      ...(form.emailInvoiceTo.trim() && { emailInvoiceTo: form.emailInvoiceTo.trim() }),
      substituteDesigns: form.substituteDesigns,
      sample: form.sample,
      sampleNotes: form.sampleNotes.trim(),
      slatBoard: form.slatBoard,
      offStand: form.offStand,
      ...(form.substituteDesignNotes.trim() && {
        substituteDesignNotes: form.substituteDesignNotes.trim(),
      }),
      ...(cleanedComplaintsIssues.length > 0 && { complaintsIssues: cleanedComplaintsIssues }),
      ...(cleanedClientNotes.length > 0 && { clientNotes: cleanedClientNotes }),
      ...(form.standsInfo.trim() && { standsInfo: form.standsInfo.trim() }),
      ...(form.upsellInfo.trim() && { upsellInfo: form.upsellInfo.trim() }),
      ...(form.cardsUsed.trim() && { cardsUsed: form.cardsUsed.trim() }),
      ...(form.boxesUsed.trim() && { boxesUsed: form.boxesUsed.trim() }),
      ...(isAdmin
        ? {
            pricingCurrency: form.pricingCurrency,
            ...(hasCategoryPrices && { categoryPrices: categoryPricesObj }),
          }
        : {}),
      ...(form.specialInformation.trim() && {
        specialInformation: form.specialInformation.trim(),
      }),
      specialInformationDate: form.specialInformationDate,
    };

    setSaving(true);
    try {
      await store.addClient(data);
      router.push("/clients");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save client.");
    } finally {
      setSaving(false);
    }
  }, [agents, form, isAdmin, store, router, uploading, saving]);

  const inputCls = "rounded-xl bg-muted/30 border-border/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-24"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/clients"
          className="mt-1.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/40 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <UserPlus className="h-7 w-7 text-primary" />
            Add Client
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new client record. Only Name, Mobile, and Email are required.
          </p>
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
      <Section title="Contact Info" icon={<Phone className="h-4 w-4" />}>
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
            <Label htmlFor="new-clientSource">Client Source</Label>
            <Input id="new-clientSource" className={inputCls} maxLength={500} placeholder="How this client came to us" value={form.clientSource} onChange={(e) => setField("clientSource", e.target.value)} />
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
      </Section>

      {/* ── Section 2: Addresses ── */}
      <Section title="Addresses" icon={<MapPin className="h-4 w-4" />}>
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
      </Section>

      {/* ── Section 3: Invoicing ── */}
      <Section title="Invoicing" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Invoice Procedure</Label>
            <Input className={inputCls} value={form.invoiceProcedure} onChange={(e) => setField("invoiceProcedure", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="new-requirePO"
              type="checkbox"
              checked={form.requirePO}
              onChange={(e) => setField("requirePO", e.target.checked)}
              className="h-4 w-4 rounded border-border/40"
            />
            <Label htmlFor="new-requirePO">Require PO</Label>
          </div>
          <div className="space-y-1.5">
            <Label>Email Invoice To</Label>
            <Input className={inputCls} value={form.emailInvoiceTo} onChange={(e) => setField("emailInvoiceTo", e.target.value)} />
          </div>
          <div className="space-y-1.5 max-w-[200px]">
            <Label>VAT rate (%)</Label>
            <Input type="text" inputMode="decimal" className={inputCls} value={form.vatRate}
              onChange={(e) => setField("vatRate", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="20" />
            <p className="text-[11px] text-muted-foreground">Applied to this client&rsquo;s invoices.</p>
          </div>
        </div>
      </Section>

      {/* ── Section 4: Product Intelligence ── */}
      <Section title="Product Intelligence" icon={<PackageCheck className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-theme">Theme</Label>
            <Input id="new-theme" className={inputCls} maxLength={500} value={form.theme} onChange={(e) => setField("theme", e.target.value)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-border/40 bg-muted/10 p-3">
            <div className="flex h-10 items-center gap-2">
              <input
                id="new-substituteDesigns"
                type="checkbox"
                checked={form.substituteDesigns}
                onChange={(e) => setField("substituteDesigns", e.target.checked)}
                className="h-4 w-4 rounded border-border/40"
              />
              <Label htmlFor="new-substituteDesigns">Substitute Designs</Label>
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
              <input id="new-sample" type="checkbox" checked={form.sample} onChange={(e) => setField("sample", e.target.checked)} className="h-4 w-4 rounded border-border/40" />
              <Label htmlFor="new-sample">Sample</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-sampleNotes">Sample Notes</Label>
              <Input id="new-sampleNotes" className={inputCls} maxLength={2000} placeholder="Add sample details" value={form.sampleNotes} onChange={(e) => setField("sampleNotes", e.target.value)} />
            </div>
          </div>
          </div>
          <div className="space-y-1.5">
            <Label>Stands Info</Label>
            <Textarea className={inputCls} rows={2} value={form.standsInfo} onChange={(e) => setField("standsInfo", e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-2">
              <input id="new-slatBoard" type="checkbox" checked={form.slatBoard} onChange={(e) => setField("slatBoard", e.target.checked)} className="h-4 w-4 rounded border-border/40" />
              <Label htmlFor="new-slatBoard">Slat Board</Label>
            </div>
            <div className="flex items-center gap-2">
              <input id="new-offStand" type="checkbox" checked={form.offStand} onChange={(e) => setField("offStand", e.target.checked)} className="h-4 w-4 rounded border-border/40" />
              <Label htmlFor="new-offStand">Off Stand</Label>
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
      </Section>

      {/* ── Complaints & Issues: dated note cards ── */}
      <Section title="Complaints &amp; Issues" icon={<FileText className="h-4 w-4" />}>
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
      </Section>

      {/* ── Section 5: Pricing (admin only) ── */}
      {isAdmin && (
        <Section title="Pricing" icon={<Coins className="h-4 w-4" />}>
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
        </Section>
      )}

      {/* ── Section 6: Brand Card + Barcodes ── */}
      <Section title="Brand Card &amp; Barcodes" icon={<ImageIcon className="h-4 w-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadCard
            label="Brand Card"
            icon={<ImageIcon className="h-4 w-4" />}
            value={form.brandCardImage}
            uploading={!!uploading.brandCardImage}
            onUpload={(file) => handleImageUpload("brandCardImage", file)}
            onClear={() => clearImage("brandCardImage")}
          />
          <BarcodeImagesUpload inputId="new-barcode-images" images={form.barcodeImages} onAppend={appendBarcodeImages} onRemove={removeBarcodeImage} onSetPrimary={setPrimaryBarcodeImage} onUploadingChange={(value) => setUploading((current) => ({ ...current, barcodeImages: value }))} />
        </div>
        {imgError && (
          <p className="mt-3 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">{imgError}</p>
        )}
      </Section>

      {/* ── Client Notes: automatic date-stamped history ── */}
      <Section title="Client Notes" icon={<FileText className="h-4 w-4" />}>
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
                      {new Date(`${item.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => removeClientNote(idx)}>
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                  <Textarea
                    className={`${inputCls} mt-2`}
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
      </Section>

      {/* ── Section 8: Special Information ── */}
      <Section title="Special Information" icon={<Store className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="space-y-1.5 max-w-[220px]">
            <Label htmlFor="new-specialInformationDate">Date</Label>
            <Input id="new-specialInformationDate" type="date" className={inputCls} value={form.specialInformationDate} onChange={(e) => setField("specialInformationDate", e.target.value)} />
          </div>
          <Label htmlFor="new-specialInformation">Information</Label>
          <Textarea
            id="new-specialInformation"
            className={inputCls}
            rows={4}
            value={form.specialInformation}
            onChange={(e) => setField("specialInformation", e.target.value)}
          />
        </div>
      </Section>

      {/* Footer actions */}
      <div className="flex items-center gap-3 pt-2">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleSave}
            disabled={saving || !!uploading.brandCardImage || !!uploading.barcodeImages}
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Create Client"}
          </Button>
        </motion.div>
        <Link href="/clients">
          <Button variant="outline" className="gap-2 rounded-xl border-border/40">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function Section({
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

function ImageUploadCard({
  label,
  icon,
  value,
  onUpload,
  onClear,
  uploading = false,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onUpload: (file: File | null) => void;
  onClear: () => void;
  uploading?: boolean;
}) {
  const inputId = `new-upload-${label.replace(/\s+/g, "-").toLowerCase()}`;
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
        <div className="relative h-36 w-full overflow-hidden rounded-lg border border-border/30 bg-background flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="max-h-full max-w-full object-contain"
          />
        </div>
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
