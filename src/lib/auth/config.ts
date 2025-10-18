import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import prisma from "@/lib/db/prisma";
import MailpitProvider from "./mailpit-provider";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;

        // Assign role based on ADMIN_EMAILS env var
        const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim()) ?? [];
        const isAdmin = user.email && adminEmails.includes(user.email);
        token.role = isAdmin ? "ADMIN" : "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  providers: [
    ...(process.env.NODE_ENV === "development"
      ? [MailpitProvider()]
      : [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM ?? "dev@bignight.party",
          }),
        ]),
  ],
  session: {
    strategy: "jwt",
  },
});
