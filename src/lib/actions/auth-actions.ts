"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth/config";
import { emailSchema } from "@/schemas/auth-schema";
import { action, authenticatedAction } from "./safe-action";

export const signInAction = action.schema(emailSchema).action(async ({ parsedInput }) => {
  // Use "email" provider in development (Mailpit), "resend" in production
  const providerId = process.env.NODE_ENV === "development" ? "email" : "resend";

  await signIn(providerId, {
    email: parsedInput.email,
    redirect: false,
  });

  return { message: "Magic link sent! Check your email.", success: true };
});

export const signOutAction = authenticatedAction.action(async () => {
  await signOut();
  redirect("/sign-in");
});
