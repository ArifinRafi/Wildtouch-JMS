import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface SessionUser {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
}

/** Current session user, or null. */
export async function sessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** 403 response unless the caller is an admin; returns the user otherwise. */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "admin access required" }, { status: 403 });
  }
  return user;
}

export function isResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}
