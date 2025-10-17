"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/config";
import { authenticatedAction } from "./safe-action";

export const signOutAction = authenticatedAction.action(async () => {
  await signOut();
  redirect("/sign-in");
});
