import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteGameAction, updateGameAction } from "@/lib/actions/admin-actions";
import * as gameModel from "@/lib/models/game";
import * as eventModel from "@/lib/models/event";
import { match } from "ts-pattern";
import type { GameStatus } from "@prisma/client";

interface GameDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { id } = await params;
  const game = await gameModel.findById(id);

  if (!game) {
    notFound();
  }

  const events = await eventModel.findAll();

  async function handleUpdateGame(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const eventId = formData.get("eventId") as string;
    const accessCode = formData.get("accessCode") as string;
    const status = formData.get("status") as GameStatus;
    const picksLockAt = formData.get("picksLockAt") as string;

    await updateGameAction({
      id,
      name,
      eventId,
      accessCode,
      status,
      picksLockAt: picksLockAt ? new Date(picksLockAt) : undefined,
    });
  }

  async function handleDeleteGame() {
    "use server";

    await deleteGameAction({ id });
    redirect("/admin/games");
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/games" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Games
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Game Details</h1>
        <form action={handleDeleteGame}>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            onClick={(e) => {
              if (
                !confirm(
                  "Are you sure you want to delete this game? This will also delete all associated picks."
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            Delete Game
          </button>
        </form>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Picks</h3>
          <p className="text-3xl font-bold text-gray-900">{game.picks.length}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Unique Participants</h3>
          <p className="text-3xl font-bold text-gray-900">
            {new Set(game.picks.map((pick) => pick.userId)).size}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
          <div className="mt-2">
            <GameStatusBadge status={game.status} />
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Game</h2>
        <form action={handleUpdateGame} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={game.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-1">
              Event *
            </label>
            <select
              id="eventId"
              name="eventId"
              required
              defaultValue={game.eventId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({new Date(event.eventDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
              Access Code *
            </label>
            <input
              type="text"
              id="accessCode"
              name="accessCode"
              required
              defaultValue={game.accessCode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              pattern="[A-Z0-9]+"
              title="Access code must be uppercase letters and numbers only"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              required
              defaultValue={game.status}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SETUP">Setup</option>
              <option value="OPEN">Open</option>
              <option value="LIVE">Live</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">SETUP → OPEN → LIVE → COMPLETED</p>
          </div>

          <div>
            <label htmlFor="picksLockAt" className="block text-sm font-medium text-gray-700 mb-1">
              Picks Lock At
            </label>
            <input
              type="datetime-local"
              id="picksLockAt"
              name="picksLockAt"
              defaultValue={
                game.picksLockAt ? new Date(game.picksLockAt).toISOString().slice(0, 16) : ""
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Update Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GameStatusBadge({ status }: { status: GameStatus }) {
  const { bgColor, textColor, label } = match(status)
    .with("SETUP", () => ({
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
      label: "Setup",
    }))
    .with("OPEN", () => ({
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      label: "Open",
    }))
    .with("LIVE", () => ({
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      label: "Live",
    }))
    .with("COMPLETED", () => ({
      bgColor: "bg-purple-100",
      textColor: "text-purple-800",
      label: "Completed",
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
