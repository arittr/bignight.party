import { GameListItem } from "@/components/game-list-item";
import { requireValidatedSession } from "@/lib/auth/config";
import * as gameService from "@/lib/services/game-service";
import * as categoryModel from "@/lib/models/category";

export default async function DashboardPage() {
  const session = await requireValidatedSession();

  const games = await gameService.getUserGames(session.user.id);

  // Transform to match component expectations and add totalCategories
  const gamesWithCompletion = await Promise.all(
    games.map(async (game) => {
      const categories = await categoryModel.getCategoriesByEventId(game.eventId);
      return {
        game: {
          id: game.id,
          name: game.name,
          status: game.status,
          event: {
            name: game.event.name,
          },
        },
        picksCount: game._count.picks,
        totalCategories: categories.length,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Games</h1>
          <p className="mt-2 text-sm text-gray-600">
            {gamesWithCompletion.length === 0
              ? "You haven't joined any games yet. Use an invite code to get started!"
              : `You're participating in ${gamesWithCompletion.length} ${gamesWithCompletion.length === 1 ? "game" : "games"}`}
          </p>
        </div>

        {gamesWithCompletion.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {gamesWithCompletion.map(({ game, picksCount, totalCategories }) => (
              <GameListItem
                game={game}
                key={game.id}
                picksCount={picksCount}
                totalCategories={totalCategories}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No games yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get an invite code from a friend to join your first game
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
