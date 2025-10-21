import { notFound, redirect } from "next/navigation";
import { requireValidatedSession } from "@/lib/auth/config";
import * as gameModel from "@/lib/models/game";
import * as gameService from "@/lib/services/game-service";
import { JoinGameButton } from "./join-game-button";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function GameAccessPage({ params }: PageProps) {
  const session = await requireValidatedSession();

  const { code } = await params;

  try {
    // Resolve access code to gameId and check membership
    const { gameId, isMember } = await gameService.resolveAccessCode(code, session.user.id);

    // If already member, go straight to pick wizard
    if (isMember) {
      redirect(`/game/${gameId}/pick`);
    }

    // Fetch full game details for display
    const game = await gameModel.findById(gameId);

    if (!game) {
      notFound();
    }

    // Show game info and join button
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-4">{game.name}</h1>

          <div className="space-y-3 mb-6">
            <div>
              <span className="text-gray-600">Event:</span>
              <span className="ml-2 font-semibold">{game.event.name}</span>
            </div>

            <div>
              <span className="text-gray-600">Date:</span>
              <span className="ml-2">
                {new Date(game.event.eventDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 capitalize">{game.status.toLowerCase()}</span>
            </div>
          </div>

          <JoinGameButton gameId={gameId} gameName={game.name} />
        </div>
      </div>
    );
  } catch (_error) {
    // Invalid code or game not found
    notFound();
  }
}
