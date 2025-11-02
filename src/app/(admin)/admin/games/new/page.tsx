import Link from "next/link";
import { CreateGameForm } from "@/components/admin/games/create-game-form";
import * as eventModel from "@/lib/models/event";
import { routes } from "@/lib/routes";

export default async function NewGamePage() {
  const events = await eventModel.findAll();

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link className="text-blue-600 hover:text-blue-800" href={routes.admin.games.index()}>
          &larr; Back to Games
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Game</h1>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <CreateGameForm events={events} />
      </div>
    </div>
  );
}
