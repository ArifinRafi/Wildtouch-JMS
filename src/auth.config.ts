import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config (no DB imports) — shared by the proxy and the
 * full server config in src/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role ?? "manager";
        token.username = user.name ?? "";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.role = (token.role as string) ?? "manager";
        session.user.name = (token.username as string) || session.user.name;
      }
      return session;
    },
  },
};
