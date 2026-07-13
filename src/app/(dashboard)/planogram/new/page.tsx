"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LayoutGrid, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PlanogramEditor,
  emptyCell,
  type SideState,
} from "@/components/planogram/planogram-editor";

export default function NewPlanogramPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"setup" | "edit">("setup");
  const [name, setName] = useState("");
  const [numSides, setNumSides] = useState(4);
  const [rowsPerSide, setRowsPerSide] = useState(8);
  const [colsPerSide, setColsPerSide] = useState(4);
  const [sides, setSides] = useState<SideState[]>([]);
  const [error, setError] = useState("");

  const inputCls = "rounded-xl bg-muted/30 border-border/40";

  const generate = () => {
    if (!name.trim()) { setError("Please enter a planogram name."); return; }
    setError("");
    const s = Math.min(12, Math.max(1, numSides));
    const r = Math.min(40, Math.max(1, rowsPerSide));
    const c = Math.min(12, Math.max(1, colsPerSide));
    setSides(Array.from({ length: s }, (_, i) => ({
      label: `Side ${i + 1}`,
      columns: c,
      rows: Array.from({ length: r }, () => ({ description: "", cells: Array.from({ length: c }, emptyCell) })),
      charms: "",
    })));
    setMode("edit");
  };

  const save = async (newName: string, newSides: SideState[]): Promise<string | null> => {
    try {
      const res = await fetch("/api/planograms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, sides: newSides }),
      });
      if (!res.ok) throw new Error("save failed");
      const created = await res.json();
      router.push(`/planogram/custom/${created.id}`);
      return null;
    } catch {
      return "Could not save the planogram. Please try again.";
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/planogram" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Planograms
        </Link>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
          <LayoutGrid className="h-7 w-7 text-primary" />
          {mode === "setup" ? "New Planogram" : name || "New Planogram"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "setup"
            ? "Name it and choose the grid size to generate the layout."
            : "Fill in the grid — each cell is its own product slot."}
        </p>
      </motion.div>

      {mode === "setup" ? (
        <>
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5 border border-destructive/20 font-medium">{error}</p>}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="rounded-2xl border border-border/40 bg-card/70 glass p-6 space-y-5 max-w-2xl">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Planogram Name *</Label>
              <Input className={inputCls} placeholder="e.g. Summer Seaside Stand" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sides</Label>
                <Input type="number" min={1} max={12} className={inputCls} value={numSides} onChange={(e) => setNumSides(parseInt(e.target.value, 10) || 1)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rows / side</Label>
                <Input type="number" min={1} max={40} className={inputCls} value={rowsPerSide} onChange={(e) => setRowsPerSide(parseInt(e.target.value, 10) || 1)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Columns / side</Label>
                <Input type="number" min={1} max={12} className={inputCls} value={colsPerSide} onChange={(e) => setColsPerSide(parseInt(e.target.value, 10) || 1)} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Each cell is its own product slot — you can add or remove rows and columns on any side afterwards.</p>
            <Button onClick={generate} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              <Wand2 className="h-4 w-4" /> Generate Grid
            </Button>
          </motion.div>
        </>
      ) : (
        <PlanogramEditor
          key={sides.length ? "editor" : "empty"}
          initialName={name}
          initialSides={sides}
          saveLabel="Save Planogram"
          leftAction={
            <Button variant="outline" className="gap-2 rounded-xl border-border/40" onClick={() => setMode("setup")}>
              <ArrowLeft className="h-4 w-4" /> Back to setup
            </Button>
          }
          onSave={save}
        />
      )}
    </div>
  );
}
