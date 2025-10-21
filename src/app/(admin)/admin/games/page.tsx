import { GameManager } from "@/components/admin/games/game-manager";
import { deleteGameAction } from "@/lib/actions/admin-actions";
import { requireValidatedSession } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import * as gameModel from "@/lib/models/game";

export default async function GamesPage() {
  await requireValidatedSession();

  const games = await gameModel.findAll();

  // Get participants count for each game
  const gamesWithCounts = await Promise.all(
    games.map(async (game) => {
      const participantsCount = await prisma.gameParticipant.count({
        where: { gameId: game.id },
      });
      return {
        ...game,
        _count: {
          participants: participantsCount,
        },
      };
    })
  );

  // Server action wrapper for delete
  async function handleDelete(gameId: string) {
    "use server";
    const result = await deleteGameAction({ id: gameId });
    if (!result?.data?.success) {
      throw new Error("Failed to delete game");
    }
  }

  return <GameManager games={gamesWithCounts} onDelete={handleDelete} />;
}
