import type { GameStatus } from "@prisma/client";
import Link from "next/link";
import { match } from "ts-pattern";
import * as gameModel from "@/lib/models/game";

export default async function GamesPage() {
  const games = await gameModel.findAll();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Games</h1>
        <Link
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          href="/admin/games/new"
        >
          New Game
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Access Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Picks Lock At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {games.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-center text-gray-500" colSpan={6}>
                  No games found. Create your first game to get started.
                </td>
              </tr>
            ) : (
              games.map((game) => (
                <tr key={game.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {game.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game.event.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {game.accessCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <GameStatusBadge status={game.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game.picksLockAt ? new Date(game.picksLockAt).toLocaleString() : "Not set"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      className="text-blue-600 hover:text-blue-900"
                      href={`/admin/games/${game.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GameStatusBadge({ status }: { status: GameStatus }) {
  const { bgColor, textColor, label } = match(status)
    .with("SETUP", () => ({
      bgColor: "bg-gray-100",
      label: "Setup",
      textColor: "text-gray-800",
    }))
    .with("OPEN", () => ({
      bgColor: "bg-blue-100",
      label: "Open",
      textColor: "text-blue-800",
    }))
    .with("LIVE", () => ({
      bgColor: "bg-green-100",
      label: "Live",
      textColor: "text-green-800",
    }))
    .with("COMPLETED", () => ({
      bgColor: "bg-purple-100",
      label: "Completed",
      textColor: "text-purple-800",
    }))
    .exhaustive();

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}
    >
      {label}
    </span>
  );
}
