"use client";

import { useEffect, useState, useCallback } from "react";

export interface ProductComponent {
  code: string;
  label: string;
  qtyPerUnit: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  planogramId: string;
  planogramName: string;
  segment: string;
  image: string | null;
  defaultQty: number;
  code: string;
  components: ProductComponent[];
}

export type NewProductInput = Partial<Omit<CatalogProduct, "id">> & { name: string };

export function useProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to load products");
    setProducts(await res.json());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data: CatalogProduct[] = await res.json();
        if (active) setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const createProduct = useCallback(async (data: NewProductInput) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create product");
    const created: CatalogProduct = await res.json();
    setProducts((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateProduct = useCallback(
    async (id: string, patch: Partial<CatalogProduct>) => {
      const prev = products;
      setProducts((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("Failed to update product");
        const updated: CatalogProduct = await res.json();
        setProducts((cur) => cur.map((p) => (p.id === id ? updated : p)));
      } catch (err) {
        console.error(err);
        setProducts(prev);
      }
    },
    [products],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const prev = products;
      setProducts((cur) => cur.filter((p) => p.id !== id));
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete product");
      } catch (err) {
        console.error(err);
        setProducts(prev);
      }
    },
    [products],
  );

  return { products, loading, refresh, createProduct, updateProduct, deleteProduct };
}
