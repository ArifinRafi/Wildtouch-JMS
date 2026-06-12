"use client";

import { useSession } from "next-auth/react";

/** Current user's role ("admin" | "manager") and convenience flags. */
export function useRole() {
  const { data } = useSession();
  const role = (data?.user as { role?: string } | undefined)?.role ?? "manager";
  return {
    role,
    isAdmin: role === "admin",
    username: data?.user?.name ?? "",
    email: data?.user?.email ?? "",
  };
}
