"use client";

import { useCallback, useEffect, useState } from "react";

interface InventoryAccessState {
  role: string;
  inventoryWriteAccess: boolean;
  canDeleteInventory: boolean;
}

const initialState: InventoryAccessState = {
  role: "",
  inventoryWriteAccess: false,
  canDeleteInventory: false,
};

/** Live, DB-backed inventory permission rather than the potentially stale session role. */
export function useInventoryAccess() {
  const [access, setAccess] = useState<InventoryAccessState>(initialState);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/access/me", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load inventory access");
      setAccess(await response.json());
    } catch (error) {
      console.error(error);
      setAccess(initialState);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...access,
    loading,
    isAdmin: access.role === "admin",
    canWriteInventory: access.inventoryWriteAccess,
    refresh,
  };
}
