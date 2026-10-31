import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Single-user auth. Credentials disimpan di environment variables:
 *   AUTH_EMAIL    - email untuk login
 *   AUTH_PASSWORD - password plain text
 */
export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() ?? "";
        const password = credentials?.password ?? "";

        const allowedEmail = (process.env.AUTH_EMAIL ?? "").trim().toLowerCase();
        const allowedPassword = process.env.AUTH_PASSWORD ?? "";

        if (!allowedEmail || !allowedPassword) {
          throw new Error("AUTH_EMAIL / AUTH_PASSWORD belum diset di .env.local");
        }

        if (email !== allowedEmail || password !== allowedPassword) {
          return null;
        }

        return { id: "1", email: allowedEmail, name: "Alia" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.email = token.email as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
