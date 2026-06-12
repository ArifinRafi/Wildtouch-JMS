import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

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
});

export const config = {
  // Everything except NextAuth's own endpoints, Next internals, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\..*).*)"],
};
