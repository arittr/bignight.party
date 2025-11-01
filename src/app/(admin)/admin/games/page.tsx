import { GameManager } from "@/components/admin/games/game-manager";
import { serverClient } from "@/lib/api/server-client";
import { requireValidatedSession } from "@/lib/auth/config";

export default async function GamesPage() {
  await requireValidatedSession();

  // Fetch games via oRPC server client (no HTTP overhead)
  const games = await serverClient.admin.listGames();

  // Server action wrapper for delete using oRPC
  async function handleDelete(gameId: string) {
    "use server";
    const result = await serverClient.admin.deleteGame({ id: gameId });
    if (!result?.success) {
      throw new Error("Failed to delete game");
    }
  }

  return <GameManager games={games} onDelete={handleDelete} />;
}
