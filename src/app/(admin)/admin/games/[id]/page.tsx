import type { GameStatus } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { match } from "ts-pattern";
import { EditGameForm } from "@/components/admin/games/edit-game-form";
import { serverClient } from "@/lib/api/server-client";
import { requireValidatedSession } from "@/lib/auth/config";
import * as eventModel from "@/lib/models/event";
import * as gameModel from "@/lib/models/game";
import { routes } from "@/lib/routes";

interface GameDetailPageProps {
	params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
	await requireValidatedSession();

	const { id } = await params;
	const game = await gameModel.findById(id);

	if (!game) {
		notFound();
	}

	const events = await eventModel.findAll();

	async function handleDeleteGame() {
		"use server";

		await serverClient.admin.games.delete({ id });
		redirect(routes.admin.games.index());
	}

	return (
		<div className="p-8">
			<div className="mb-6">
				<Link className="text-blue-600 hover:text-blue-800" href={routes.admin.games.index()}>
					&larr; Back to Games
				</Link>
			</div>

			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">Game Details</h1>
				<form action={handleDeleteGame}>
					<button
						className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
						type="submit"
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

			{/* Admin Actions */}
			<div className="mb-6">
				<Link
					className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
					href={routes.admin.games.live(id)}
				>
					Live Winner Marking
				</Link>
			</div>

			{/* Edit Form */}
			<div className="bg-white shadow-md rounded-lg p-6">
				<h2 className="text-xl font-semibold mb-4">Edit Game</h2>
				<EditGameForm game={game} events={events} />
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
