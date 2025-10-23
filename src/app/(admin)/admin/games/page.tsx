import { GameManager } from "@/components/admin/games/game-manager";
import { deleteGameAction } from "@/lib/actions/admin-actions";
import { requireValidatedSession } from "@/lib/auth/config";
import * as gameModel from "@/lib/models/game";

export default async function GamesPage() {
  await requireValidatedSession();

  // Use optimized query with participant counts (no N+1 queries)
  const games = await gameModel.findAllWithCounts();

  // Server action wrapper for delete
  async function handleDelete(gameId: string) {
    "use server";
    const result = await deleteGameAction({ id: gameId });
    if (!result?.data?.success) {
      throw new Error("Failed to delete game");
    }
  }

  return <GameManager games={games} onDelete={handleDelete} />;
}
