import { redirect } from "next/navigation";
import { requireValidatedSession } from "@/lib/auth/config";
import { routes } from "@/lib/routes";
import * as gameModel from "@/lib/models/game";

interface CallbackPageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  await requireValidatedSession();
  const params = await searchParams;

  // If no code provided, redirect to dashboard
  if (!params.code) {
    redirect(routes.dashboard());
  }

  // Look up which game has this access code
  const game = await gameModel.findByAccessCode(params.code);

  if (!game) {
    // Code doesn't match any game, redirect to dashboard
    redirect(routes.dashboard());
  }

  // Redirect to the canonical join route with gameId and code
  redirect(routes.join(game.id, params.code));
}
