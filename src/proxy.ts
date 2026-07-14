import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const VIEWER_BLOCK_MESSAGE =
  "You have view-only access. Creating, editing or deleting data is restricted to Admin or Manager — please contact your Admin.";

/** Require a session for every page and API route (except /login and /api/auth). */
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    return;
  }

  if (!isLoggedIn) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Viewer role is read-only: block every mutating API request (create/edit/delete).
  // This is the authoritative backend guard; the UI shows a friendly message on the 403.
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  if (role === "viewer" && pathname.startsWith("/api") && !READ_METHODS.has(req.method)) {
    return NextResponse.json(
      { error: VIEWER_BLOCK_MESSAGE },
      { status: 403, headers: { "x-role-blocked": "viewer" } },
    );
  }
});

export const config = {
  // Everything except NextAuth's own endpoints, Next internals, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\..*).*)"],
};
