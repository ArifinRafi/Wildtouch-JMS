"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";

/**
 * Read-only guard for the Viewer role. The backend (proxy) blocks every
 * mutating API request for viewers with a 403 carrying `x-role-blocked: viewer`.
 * This patches window.fetch once so ANY blocked action — from any button in the
 * app — surfaces a friendly toast, without having to wire each button by hand.
 */
export function ViewerGuard() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const orig = window.fetch;
    // Guard against double-patching (e.g. fast refresh / remounts).
    if ((window as unknown as { __viewerGuard?: boolean }).__viewerGuard) return;
    (window as unknown as { __viewerGuard?: boolean }).__viewerGuard = true;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await orig(...args);
      try {
        if (res.status === 403 && res.headers.get("x-role-blocked") === "viewer") {
          let text = "You have view-only access. This action is restricted to Admin or Manager — please contact your Admin.";
          try {
            const data = await res.clone().json();
            if (data?.error) text = String(data.error);
          } catch { /* body not JSON — keep default */ }
          window.dispatchEvent(new CustomEvent("viewer-blocked", { detail: text }));
        }
      } catch { /* never let the guard break the request */ }
      return res;
    };

    return () => {
      window.fetch = orig;
      (window as unknown as { __viewerGuard?: boolean }).__viewerGuard = false;
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setMessage((e as CustomEvent).detail as string);
    window.addEventListener("viewer-blocked", handler);
    return () => window.removeEventListener("viewer-blocked", handler);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border border-amber-500/30 bg-card/95 glass-strong px-4 py-3 shadow-xl"
          role="alert"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">View-only access</p>
            <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
          </div>
          <button onClick={() => setMessage(null)} className="shrink-0 text-muted-foreground/60 hover:text-foreground" title="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
