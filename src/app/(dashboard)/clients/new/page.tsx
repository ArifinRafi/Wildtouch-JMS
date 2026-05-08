"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  PackageCheck,
  PoundSterling,
  Store,
  Save,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  ScanLine,
  Users as UsersIcon,
  UserPlus,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, ClientPricing, AdditionalContact } from "@/lib/store/app-store";
import {
  PRODUCT_PRICE_FIELDS,
  type AccountStatus,
} from "@/lib/mock-data/clients";

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
  topSellingAnimals: string;
  slowSellerDesigns: string;
  substituteDesigns: boolean;
  standsInfo: string;
  upsellInfo: string;
  cardsUsed: string;
  boxesUsed: string;
  specialInformation: string;
  pricing: Record<string, string>;
  additionalContacts: AdditionalContact[];
  brandCardImage: string;
  barcodeImage: string;
}

function emptyForm(): ClientForm {
  return {
    name: "",
    motherCompany: "",
    mainBuyerNames: "",
    otherContactAndPosition: "",
    contactNumber: "",
    mobOther: "",
    email: "",
    emailOther: "",
    shopManagerName: "",
    giftShopContactNo: "",
    webAddress: "",
    history: "good",
    accountStatus: "active",
    address: "",
    city: "",
    invoiceAddressFull: "",
    deliveryAddress: "",
    deliveryInstructions: "",
    invoiceProcedure: "",
    requirePO: false,
    emailInvoiceTo: "",
    topSellingAnimals: "",
    slowSellerDesigns: "",
    substituteDesigns: false,
    standsInfo: "",
    upsellInfo: "",
    cardsUsed: "",
    boxesUsed: "",
    specialInformation: "",
    pricing: {},
    additionalContacts: [],
    brandCardImage: "",
    barcodeImage: "",
  };
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function NewClientPage() {
  const router = useRouter();
  const store = useAppStore();

  const [form, setForm] = useState<ClientForm>(emptyForm());
  const [formError, setFormError] = useState("");

  const setField = useCallback(
    (key: keyof ClientForm, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );
  const setPricingField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, pricing: { ...prev.pricing, [key]: value } }));
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

  // ── Image uploads ──
  const handleImageUpload = useCallback(
    async (key: "brandCardImage" | "barcodeImage", file: File | null) => {
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataURL(file);
        setForm((prev) => ({ ...prev, [key]: dataUrl }));
      } catch {
        /* ignore */
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

    const pricingObj: ClientPricing = {};
    for (const f of PRODUCT_PRICE_FIELDS) {
      const raw = form.pricing[f.key];
      if (raw && raw.trim()) {
        const n = parseFloat(raw);
        if (!isNaN(n)) (pricingObj as Record<string, number>)[f.key] = n;
      }
    }
    const hasPricing = Object.keys(pricingObj).length > 0;

    const cleanedAdditionalContacts = form.additionalContacts
      .map((c) => ({
        name: c.name?.trim() || "",
        contactNumber: c.contactNumber?.trim() || "",
        address: c.address?.trim() || "",
      }))
      .filter((c) => c.name || c.contactNumber || c.address);

    const data: Omit<Client, "id"> = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      history: (form.history as "good" | "bad") || "good",
      accountStatus: (form.accountStatus as AccountStatus) || "active",
      lastOrder: "0 days ago",
      totalOrders: 0,
      ...(form.motherCompany.trim() && { motherCompany: form.motherCompany.trim() }),
      ...(cleanedAdditionalContacts.length > 0 && {
        additionalContacts: cleanedAdditionalContacts,
      }),
      ...(form.brandCardImage && { brandCardImage: form.brandCardImage }),
      ...(form.barcodeImage && { barcodeImage: form.barcodeImage }),
      ...(form.mainBuyerNames.trim() && { mainBuyerNames: form.mainBuyerNames.trim() }),
      ...(form.otherContactAndPosition.trim() && {
        otherContactAndPosition: form.otherContactAndPosition.trim(),
      }),
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
      ...(form.emailInvoiceTo.trim() && { emailInvoiceTo: form.emailInvoiceTo.trim() }),
      ...(form.topSellingAnimals.trim() && { topSellingAnimals: form.topSellingAnimals.trim() }),
      ...(form.slowSellerDesigns.trim() && { slowSellerDesigns: form.slowSellerDesigns.trim() }),
      substituteDesigns: form.substituteDesigns,
      ...(form.standsInfo.trim() && { standsInfo: form.standsInfo.trim() }),
      ...(form.upsellInfo.trim() && { upsellInfo: form.upsellInfo.trim() }),
      ...(form.cardsUsed.trim() && { cardsUsed: form.cardsUsed.trim() }),
      ...(form.boxesUsed.trim() && { boxesUsed: form.boxesUsed.trim() }),
      ...(hasPricing && { pricing: pricingObj }),
      ...(form.specialInformation.trim() && {
        specialInformation: form.specialInformation.trim(),
      }),
    };

    store.addClient(data);
    router.push("/clients");
  }, [form, store, router]);

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
        </div>
      </Section>

      {/* ── Section 4: Product Intelligence ── */}
      <Section title="Product Intelligence" icon={<PackageCheck className="h-4 w-4" />}>
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
              id="new-substituteDesigns"
              type="checkbox"
              checked={form.substituteDesigns}
              onChange={(e) => setField("substituteDesigns", e.target.checked)}
              className="h-4 w-4 rounded border-border/40"
            />
            <Label htmlFor="new-substituteDesigns">Substitute Designs</Label>
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
      </Section>

      {/* ── Section 5: Pricing ── */}
      <Section title="Pricing" icon={<PoundSterling className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4">
          {PRODUCT_PRICE_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  <PoundSterling className="h-3.5 w-3.5" />
                </span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={cn("pl-8", inputCls)}
                  value={form.pricing[f.key] ?? ""}
                  onChange={(e) => setPricingField(f.key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 6: Brand Card + Barcode ── */}
      <Section title="Brand Card &amp; Barcode" icon={<ImageIcon className="h-4 w-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadCard
            label="Brand Card"
            icon={<ImageIcon className="h-4 w-4" />}
            value={form.brandCardImage}
            onUpload={(file) => handleImageUpload("brandCardImage", file)}
            onClear={() => clearImage("brandCardImage")}
          />
          <ImageUploadCard
            label="Barcode"
            icon={<ScanLine className="h-4 w-4" />}
            value={form.barcodeImage}
            onUpload={(file) => handleImageUpload("barcodeImage", file)}
            onClear={() => clearImage("barcodeImage")}
          />
        </div>
      </Section>

      {/* ── Section 7: Special Information ── */}
      <Section title="Special Information" icon={<Store className="h-4 w-4" />}>
        <div className="space-y-1.5">
          <Textarea
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
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
          >
            <Save className="h-4 w-4" />
            Create Client
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
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onUpload: (file: File | null) => void;
  onClear: () => void;
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

      {value ? (
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
