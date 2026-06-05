"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepNav({
  backHref,
  nextHref,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  busy = false,
  isLast = false,
}: {
  backHref?: string;
  nextHref?: string;
  /** Custom handler; if it returns false, navigation is skipped. */
  onNext?: () => boolean | void | Promise<boolean | void>;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  isLast?: boolean;
}) {
  const router = useRouter();

  const handleNext = async () => {
    if (onNext) {
      const ok = await onNext();
      if (ok === false) return;
    }
    if (nextHref) router.push(nextHref);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="outline"
        className="gap-2 rounded-xl border-border/40"
        disabled={!backHref}
        onClick={() => backHref && router.push(backHref)}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <Button
        className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 text-white font-semibold disabled:opacity-50"
        disabled={nextDisabled || busy}
        onClick={handleNext}
      >
        {isLast ? (
          <>
            <Check className="h-4 w-4" /> {busy ? "Working…" : nextLabel}
          </>
        ) : (
          <>
            {busy ? "Working…" : nextLabel} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
