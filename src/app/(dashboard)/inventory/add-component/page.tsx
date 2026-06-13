"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  PackagePlus,
  X,
  Save,
  Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useInventory } from "@/lib/store/inventory-store";

interface AddForm {
  description: string;
  code: string;
  qtyAvailable: string;
}

const emptyForm = (): AddForm => ({
  description: "",
  code: "",
  qtyAvailable: "0",
});

export default function AddComponentPage() {
  const router = useRouter();
  const { addItem } = useInventory();

  const [form, setForm] = useState<AddForm>(emptyForm());
  const [error, setError] = useState("");

  const inputCls = "rounded-xl bg-muted/30 border-border/40";

  const setField = (key: keyof AddForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Save ──
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!form.description.trim()) {
      setError("Component name is required.");
      return;
    }
    setError("");
    const qty = Math.max(0, parseInt(form.qtyAvailable, 10) || 0);

    setSaving(true);
    try {
      await addItem({
        description: form.description.trim(),
        code: form.code.trim(),
        qtyAvailable: qty,
        components: [],
      });
      router.push("/inventory/all-components");
    } catch {
      setError("Could not save the component. Please try again.");
      setSaving(false);
    }
  }, [form, addItem, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-24 max-w-3xl"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/inventory/all-components"
          className="mt-1.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/40 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <PackagePlus className="h-7 w-7 text-primary" />
            Add Component
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new component and save it into the inventory.
          </p>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5 border border-destructive/20 font-medium"
        >
          {error}
        </motion.p>
      )}

      {/* Core details */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Component Details</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5 max-w-[280px]">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Code
            </Label>
            <Input
              className={`${inputCls} font-mono`}
              placeholder="e.g. BC01"
              value={form.code}
              onChange={(e) => setField("code", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Component Name *
            </Label>
            <Input
              className={inputCls}
              placeholder="e.g. Bag Charm Gold Bird"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="space-y-1.5 max-w-[220px]">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quantity Available
            </Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              className={inputCls}
              value={form.qtyAvailable}
              onChange={(e) => setField("qtyAvailable", e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      {/* Footer actions */}
      <div className="flex items-center gap-3 pt-2">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Add to Inventory"}
          </Button>
        </motion.div>
        <Link href="/inventory/all-components">
          <Button variant="outline" className="gap-2 rounded-xl border-border/40">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
