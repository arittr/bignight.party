"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { GameStatus } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { GameUpdateInput } from "@/schemas/game-schema";
import { gameUpdateSchema } from "@/schemas/game-schema";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";

interface EditGameFormProps {
	game: {
		id: string;
		name: string;
		eventId: string;
		accessCode: string;
		status: GameStatus;
		picksLockAt: Date | null;
	};
	events: Array<{
		id: string;
		name: string;
		eventDate: Date;
	}>;
}

export function EditGameForm({ game, events }: EditGameFormProps) {
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<GameUpdateInput>({
		resolver: zodResolver(gameUpdateSchema),
		defaultValues: {
			id: game.id,
			name: game.name,
			eventId: game.eventId,
			accessCode: game.accessCode,
			status: game.status,
			picksLockAt: game.picksLockAt
				? new Date(game.picksLockAt).toISOString().slice(0, 16)
				: undefined,
		},
	});

	const updateGame = useMutation(
		orpc.admin.games.update.mutationOptions({
			onSuccess: () => {
				router.refresh();
			},
		})
	);

	const onSubmit = async (data: GameUpdateInput) => {
		await updateGame.mutateAsync(data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			{/* Name */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
					Name *
				</label>
				<input
					{...register("name")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					id="name"
					type="text"
				/>
				{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
			</div>

			{/* Event */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="eventId">
					Event *
				</label>
				<select
					{...register("eventId")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					id="eventId"
				>
					{events.map((event) => (
						<option key={event.id} value={event.id}>
							{event.name} ({new Date(event.eventDate).toLocaleDateString()})
						</option>
					))}
				</select>
				{errors.eventId && <p className="mt-1 text-sm text-red-600">{errors.eventId.message}</p>}
			</div>

			{/* Access Code */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="accessCode">
					Access Code *
				</label>
				<input
					{...register("accessCode")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
					id="accessCode"
					type="text"
				/>
				{errors.accessCode && (
					<p className="mt-1 text-sm text-red-600">{errors.accessCode.message}</p>
				)}
				<p className="mt-1 text-sm text-gray-500">At least 4 characters, uppercase letters and numbers only</p>
			</div>

			{/* Status */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
					Status *
				</label>
				<select
					{...register("status")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					id="status"
				>
					<option value="SETUP">Setup</option>
					<option value="OPEN">Open</option>
					<option value="LIVE">Live</option>
					<option value="COMPLETED">Completed</option>
				</select>
				{errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
				<p className="mt-1 text-sm text-gray-500">SETUP → OPEN → LIVE → COMPLETED</p>
			</div>

			{/* Picks Lock At */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="picksLockAt">
					Picks Lock At
				</label>
				<input
					{...register("picksLockAt")}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					id="picksLockAt"
					type="datetime-local"
				/>
				{errors.picksLockAt && (
					<p className="mt-1 text-sm text-red-600">{errors.picksLockAt.message}</p>
				)}
				<p className="mt-1 text-sm text-gray-500">
					When should users no longer be able to make picks? Leave empty for no deadline.
				</p>
			</div>

			{/* Error Message */}
			{updateGame.error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-md">
					<p className="text-sm text-red-600">
						{updateGame.error instanceof Error ? updateGame.error.message : "Failed to update game"}
					</p>
				</div>
			)}

			{/* Actions */}
			<div className="pt-4">
				<button
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isSubmitting || updateGame.isPending}
					type="submit"
				>
					{isSubmitting || updateGame.isPending ? "Updating..." : "Update Game"}
				</button>
			</div>
		</form>
	);
}
