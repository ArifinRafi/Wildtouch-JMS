"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LayoutGrid, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PlanogramEditor,
  emptyCell,
  type SideState,
} from "@/components/planogram/planogram-editor";
import type { CustomPlanogram } from "@/lib/hooks/use-planograms";

/** Map a serialized planogram's sides into the editor's state shape. */
function toSideStates(pg: CustomPlanogram): SideState[] {
  return pg.sides.map((s, i) => ({
    label: s.label || `Side ${i + 1}`,
    columns: Math.max(1, s.columns || 1),
    rows: s.rows.map((r) => ({
      description: r.description ?? "",
      cells: r.cells.map((c) => ({ product: c.product ?? "", image: c.image ?? "", qty: c.qty ?? 0 })),
    })),
    charms: s.charms ?? "",
  }));
}

export default function EditPlanogramPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pg, setPg] = useState<CustomPlanogram | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch(`/api/planograms/${id}`);
        if (!res.ok) { if (on) setNotFound(true); return; }
        const data = await res.json();
        if (on) setPg(data);
      } catch { if (on) setNotFound(true); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  const save = async (name: string, sides: SideState[]): Promise<string | null> => {
    try {
      const res = await fetch(`/api/planograms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sides }),
      });
      if (!res.ok) throw new Error("save failed");
      router.push(`/planogram/custom/${id}`);
      return null;
    } catch {
      return "Could not save the changes. Please try again.";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading planogram…</span></div>;
  }
  if (notFound || !pg) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold">Planogram not found</p>
        <Link href="/planogram" className="text-sm text-primary mt-2">Back to Planograms</Link>
      </div>
    );
  }

  // Guard against a planogram with no sides at all (shouldn't happen, but keeps the editor sane).
  const initialSides = pg.sides.length
    ? toSideStates(pg)
    : [{ label: "Side 1", columns: 1, rows: [{ description: "", cells: [emptyCell()] }], charms: "" }];

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href={`/planogram/custom/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {pg.name}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
          <LayoutGrid className="h-7 w-7 text-primary" /> Edit Planogram
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Change the layout, products, quantities and charms, then save.</p>
      </motion.div>

      <PlanogramEditor
        initialName={pg.name}
        initialSides={initialSides}
        saveLabel="Save Changes"
        leftAction={
          <Link href={`/planogram/custom/${id}`}>
            <Button variant="outline" className="gap-2 rounded-xl border-border/40">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
          </Link>
        }
        onSave={save}
      />
    </div>
  );
}
