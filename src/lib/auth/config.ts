import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import prisma from "@/lib/db/prisma";
import * as userModel from "@/lib/models/user";
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

/**
 * Get validated session with database user existence check.
 *
 * Use this in Server Components (layouts, pages) to ensure the user
 * still exists in the database. This runs in Node.js runtime and can
 * safely query the database via Prisma.
 *
 * Returns null if:
 * - No session exists
 * - Session exists but user was deleted from database
 *
 * @example
 * ```tsx
 * // In a layout or page
 * const session = await getValidatedSession();
 * if (!session) {
 *   redirect("/sign-in");
 * }
 * ```
 */
export async function getValidatedSession() {
  const session = await auth();

  // No session at all
  if (!session?.user?.id) {
    return null;
  }

  // Validate user still exists in database
  const userExists = await userModel.exists(session.user.id);

  if (!userExists) {
    return null;
  }

  return session;
}

/**
 * Require a validated session or redirect to sign-in.
 *
 * This is a convenience wrapper around getValidatedSession that:
 * 1. Checks session exists
 * 2. Validates user exists in database
 * 3. If user deleted, redirects to signout (clears JWT) then to sign-in
 * 4. If no session, redirects to sign-in
 *
 * Use this in Server Components when you need authentication.
 *
 * @example
 * ```tsx
 * const session = await requireValidatedSession();
 * // If we get here, session is guaranteed valid
 * ```
 */
export async function requireValidatedSession() {
  const session = await auth();

  // No session - redirect to sign in
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Validate user still exists in database
  const userExists = await userModel.exists(session.user.id);

  if (!userExists) {
    // User was deleted - redirect to signout route handler to clear JWT
    // This prevents redirect loop (middleware won't see them as authenticated after signout)
    redirect("/api/auth/signout?callbackUrl=/sign-in");
  }

  return session;
}

/**
 * Require a validated session or throw an error.
 *
 * Similar to requireValidatedSession but throws instead of redirecting.
 * Use in API routes, server actions, and oRPC procedures where throwing
 * is more appropriate than redirecting.
 *
 * Validates:
 * 1. Session exists
 * 2. User exists in database (protects against stale JWTs)
 *
 * @throws {Error} If session is invalid or user doesn't exist
 *
 * @example
 * ```tsx
 * // In an oRPC procedure middleware
 * const session = await requireValidatedSessionOrThrow();
 * // If we get here, session is guaranteed valid
 * ```
 */
export async function requireValidatedSessionOrThrow() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }

  // Validate user still exists in database (protect against stale JWTs)
  const userExists = await userModel.exists(session.user.id);

  if (!userExists) {
    throw new Error("Unauthorized: User account no longer exists");
  }

  return session;
}
