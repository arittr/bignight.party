import { redirect } from "next/navigation";
import { requireValidatedSession } from "@/lib/auth/config";
import { JoinGameHandler } from "./join-game-handler";

interface CallbackPageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  const session = await requireValidatedSession();
  const params = await searchParams;

  // If no code provided, redirect to dashboard
  if (!params.code) {
    redirect("/dashboard");
  }

  // Render client component to handle joining
  return <JoinGameHandler accessCode={params.code} userId={session.user.id} />;
}
