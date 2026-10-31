import { withAuth } from "next-auth/middleware";

export const proxy = withAuth;

export const config = {
  // Protect everything except the login page, NextAuth's own API routes,
  // and static/Next internals.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
