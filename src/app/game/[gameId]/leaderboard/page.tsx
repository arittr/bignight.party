import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeaderboardClient } from "@/components/game/leaderboard/leaderboard-client";
import { requireValidatedSession } from "@/lib/auth/config";
import * as gameModel from "@/lib/models/game";
import * as gameParticipantModel from "@/lib/models/game-participant";
import { routes } from "@/lib/routes";
import * as leaderboardService from "@/lib/services/leaderboard-service";

interface LeaderboardPageProps {
  params: Promise<{ gameId: string }>;
}

/**
 * Generate metadata for the leaderboard page
 *
 * @param props - Page props with params
 * @returns Metadata for SEO
 */
export async function generateMetadata({ params }: LeaderboardPageProps): Promise<Metadata> {
  const { gameId } = await params;

  try {
    const game = await gameModel.findById(gameId);
    if (!game) {
      return {
        description: "Game not found",
        title: "Leaderboard | BigNight.Party",
      };
    }

    return {
      description: `Live leaderboard for ${game.name} - ${game.event.name}`,
      title: `${game.name} Leaderboard | BigNight.Party`,
    };
  } catch (_error) {
    return {
      description: "Live leaderboard for awards show predictions",
      title: "Leaderboard | BigNight.Party",
    };
  }
}

/**
 * Leaderboard page - Server Component with access control
 *
 * Access Requirements:
 * 1. User must be authenticated (requireValidatedSession)
 * 2. User must be a game participant
 * 3. Picks must be locked (game status is LIVE or COMPLETED)
 *
 * Fetches initial leaderboard data server-side for SSR, then hands off to
 * LeaderboardClient for real-time WebSocket updates.
 *
 * @param props - Page props with gameId
 * @returns Rendered leaderboard page
 */
export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  // Await params (Next.js 15 requirement)
  const { gameId } = await params;

  // 1. Validate session - redirects to sign-in if not authenticated
  const session = await requireValidatedSession();

  // 2. Access control: Verify user is game participant
  const isParticipant = await gameParticipantModel.exists(session.user.id, gameId);
  if (!isParticipant) {
    redirect(routes.dashboard());
  }

  // 3. Fetch game data
  const game = await gameModel.findById(gameId);
  if (!game) {
    redirect(routes.dashboard());
  }

  // 4. Access control: Verify picks are locked (game status is LIVE or COMPLETED)
  // If game is in SETUP or OPEN status, redirect to picks page
  if (game.status === "SETUP" || game.status === "OPEN") {
    redirect(routes.game.pick(gameId));
  }

  // 5. Fetch initial leaderboard data server-side (SSR)
  const leaderboard = await leaderboardService.calculateLeaderboard(gameId);

  // 6. Mark current user for UI highlighting
  const players = leaderboardService.markCurrentUser(leaderboard.players, session.user.id);

  // 7. Render LeaderboardClient with SSR data
  // Client component will handle WebSocket connection and live updates
  return (
    <LeaderboardClient
      eventName={game.event.name}
      gameId={gameId}
      gameName={game.name}
      initialPlayers={players}
      currentUserId={session.user.id}
    />
  );
}
