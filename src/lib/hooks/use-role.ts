"use client";

import { useSession } from "next-auth/react";

/** Current user's role ("admin" | "manager" | "viewer") and convenience flags. */
export function useRole() {
  const { data } = useSession();
  const role = (data?.user as { role?: string } | undefined)?.role ?? "manager";
  return {
    role,
    isAdmin: role === "admin",
    isViewer: role === "viewer",
    /** Admins and managers can create/edit/delete; viewers are read-only. */
    canWrite: role === "admin" || role === "manager",
    username: data?.user?.name ?? "",
    email: data?.user?.email ?? "",
  };
}
