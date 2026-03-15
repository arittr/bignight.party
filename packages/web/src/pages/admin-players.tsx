import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth";

interface PlayerInfo {
	id: string;
	name: string;
	pickCount: number;
	totalCategories: number;
	complete: boolean;
}

export function AdminPlayersPage() {
	const { token, isAdmin } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isAdmin) navigate("/admin");
	}, [isAdmin, navigate]);

	const { data: players = [], isLoading } = useQuery<PlayerInfo[]>({
		queryKey: ["admin-players"],
		queryFn: async () => {
			const res = await fetch("/api/admin/players", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			return data.players;
		},
		enabled: !!token && isAdmin,
		refetchInterval: 10000,
	});

	const completeCount = players.filter((p) => p.complete).length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[#e2b04a]">Players</h1>
				<Link
					to="/admin"
					className="text-sm text-gray-400 hover:text-white"
				>
					Back to Dashboard
				</Link>
			</div>

			<p className="text-sm text-gray-400">
				{players.length} registered — {completeCount} complete
			</p>

			{isLoading && <p className="text-gray-500">Loading...</p>}

			<div className="space-y-2">
				{players.map((player) => (
					<div
						key={player.id}
						className={`flex items-center justify-between p-3 rounded-lg ${
							player.complete
								? "bg-green-500/10 border border-green-500/30"
								: "bg-white/[0.04] border border-white/10"
						}`}
					>
						<div className="flex items-center gap-2">
							{player.complete ? (
								<span className="text-green-400">✓</span>
							) : (
								<span className="text-gray-600">○</span>
							)}
							<span className="text-white">{player.name}</span>
						</div>
						<span
							className={`text-sm ${player.complete ? "text-green-400" : "text-gray-500"}`}
						>
							{player.pickCount} / {player.totalCategories}
						</span>
					</div>
				))}
			</div>

			{players.length === 0 && !isLoading && (
				<p className="text-gray-500 text-center py-8">
					No players have joined yet.
				</p>
			)}
		</div>
	);
}
