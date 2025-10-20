import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { JoinGameHandler } from "./join-game-handler";

interface CallbackPageProps {
  searchParams: {
    code?: string;
  };
}

export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  const session = await auth();

  // Must be authenticated to use this page
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // If no code provided, redirect to dashboard
  if (!searchParams.code) {
    redirect("/dashboard");
  }

  // Render client component to handle joining
  return <JoinGameHandler accessCode={searchParams.code} userId={session.user.id} />;
}
