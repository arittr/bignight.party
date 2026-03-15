import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth";
import { usePicks } from "../hooks/use-picks";
import { useGameState } from "../hooks/use-game-state";
import { CategoryPills } from "../components/category-pills";
import { NominationCard } from "../components/nomination-card";
import { SaveIndicator } from "../components/save-indicator";

interface Nomination {
	id: string;
	title: string;
	subtitle: string;
	imageUrl?: string | null;
}

interface Category {
	id: string;
	name: string;
	winnerId?: string | null;
	isRevealed?: boolean;
	nominations?: Nomination[];
}

export function PicksPage() {
	const { token } = useAuth();
	const navigate = useNavigate();
	const { phase } = useGameState();
	const {
		picks,
		selectedNominationId,
		setSelectedNominationId,
		handleSelect,
		saveStatus,
		completedCategoryIds,
	} = usePicks();
	const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

	// Auth guard
	useEffect(() => {
		if (!token) navigate("/");
	}, [token, navigate]);

	const { data: categories = [] } = useQuery<Category[]>({
		queryKey: ["categories"],
		queryFn: async () => {
			const res = await fetch("/api/categories", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			return data.categories;
		},
		enabled: !!token,
	});

	const isLocked = phase === "locked" || phase === "completed";

	// Build name → total nomination count across all categories.
	// Count both titles and subtitles since the film name can appear in either
	// position depending on category (title in Best Picture, subtitle in Best Actor).
	const nominationCounts = new Map<string, number>();
	for (const cat of categories) {
		for (const nom of cat.nominations ?? []) {
			nominationCounts.set(nom.title, (nominationCounts.get(nom.title) ?? 0) + 1);
			if (nom.subtitle) {
				nominationCounts.set(nom.subtitle, (nominationCounts.get(nom.subtitle) ?? 0) + 1);
			}
		}
	}

	const currentCategory = categories[selectedCategoryIndex];

	// Restore existing pick selection when switching categories
	useEffect(() => {
		if (!currentCategory) return;
		const existingPick = picks.find(
			(p: { categoryId: string; nominationId: string }) =>
				p.categoryId === currentCategory.id,
		);
		setSelectedNominationId(existingPick?.nominationId ?? null);
	}, [currentCategory?.id, picks]);

	if (categories.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<div className="text-center space-y-3">
					<div className="w-8 h-8 border-2 border-[#e2b04a] border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="text-gray-400 text-sm">Loading categories...</p>
				</div>
			</div>
		);
	}

	// Locked/completed: show review mode
	if (isLocked) {
		return <PicksReview categories={categories} picks={picks} nominationCounts={nominationCounts} />;
	}

	// Open: show pick wizard
	if (!currentCategory) return null;

	return (
		<div className="space-y-4">
			<SaveIndicator status={saveStatus} />

			<p className="text-sm text-gray-400">
				{completedCategoryIds.size} of {categories.length} picked
			</p>

			<CategoryPills
				categories={categories}
				selectedId={currentCategory.id}
				onSelect={(id) => {
					const idx = categories.findIndex((c) => c.id === id);
					if (idx >= 0) setSelectedCategoryIndex(idx);
				}}
				completedIds={completedCategoryIds}
			/>

			<h2 className="text-xl font-bold text-white">{currentCategory.name}</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
				{currentCategory.nominations?.map((nom) => (
					<NominationCard
						key={nom.id}
						title={nom.title}
						subtitle={nom.subtitle}
						imageUrl={nom.imageUrl}
						titleNomCount={nominationCounts.get(nom.title)}
						subtitleNomCount={nominationCounts.get(nom.subtitle)}
						isSelected={selectedNominationId === nom.id}
						onSelect={() => handleSelect(currentCategory.id, nom.id)}
					/>
				))}
			</div>

			<div className="flex justify-between pt-4">
				<button
					onClick={() =>
						setSelectedCategoryIndex((i) => Math.max(0, i - 1))
					}
					disabled={selectedCategoryIndex === 0}
					className="px-4 py-2 text-sm text-[#e2b04a] disabled:text-gray-600"
				>
					← Previous
				</button>
				<button
					onClick={() =>
						setSelectedCategoryIndex((i) =>
							Math.min(categories.length - 1, i + 1),
						)
					}
					disabled={selectedCategoryIndex === categories.length - 1}
					className="px-4 py-2 text-sm text-[#e2b04a] disabled:text-gray-600"
				>
					Next →
				</button>
			</div>
		</div>
	);
}

/** Read-only review of picks — shown when game is locked or completed */
function PicksReview({
	categories,
	picks,
	nominationCounts,
}: {
	categories: Category[];
	picks: Array<{ categoryId: string; nominationId: string }>;
	nominationCounts: Map<string, number>;
}) {
	const picksByCategory = new Map(
		picks.map((p) => [p.categoryId, p]),
	);

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold text-[#e2b04a]">My Picks</h1>
			<p className="text-sm text-gray-500">Picks are locked. Here's how you're doing.</p>

			{categories.map((category) => {
				const pick = picksByCategory.get(category.id);
				const pickedNomination = pick
					? category.nominations?.find((n) => n.id === pick.nominationId)
					: null;
				const winnerNomination = category.winnerId
					? category.nominations?.find((n) => n.id === category.winnerId)
					: null;
				const isRevealed = category.isRevealed;
				const isCorrect =
					isRevealed && pick?.nominationId === category.winnerId;
				const isIncorrect =
					isRevealed &&
					pick?.nominationId !== category.winnerId &&
					pick !== undefined;

				return (
					<div
						key={category.id}
						className="p-4 rounded-lg bg-white/[0.04] border border-white/10 space-y-2"
					>
						<div className="flex items-center justify-between">
							<h3 className="font-medium text-white text-sm">
								{category.name}
							</h3>
							{isRevealed && (
								<span
									className={
										isCorrect
											? "text-green-400 text-sm"
											: "text-red-400 text-sm"
									}
								>
									{isCorrect ? "✓ Correct" : "✗ Wrong"}
								</span>
							)}
						</div>

						{pickedNomination ? (
							<div
								className={`p-3 rounded border ${
									isCorrect
										? "border-green-500/50 bg-green-500/5"
										: isIncorrect
											? "border-red-500/50 bg-red-500/5"
											: "border-white/10 bg-white/[0.02]"
								}`}
							>
								<p className="text-white text-sm">
									{pickedNomination.title}
								</p>
								<p className="text-gray-400 text-xs">
									{pickedNomination.subtitle}
								</p>
							</div>
						) : (
							<p className="text-gray-500 text-sm italic">No pick</p>
						)}

						{isRevealed && winnerNomination && !isCorrect && (
							<div className="text-xs text-gray-400">
								Winner:{" "}
								<span className="text-[#e2b04a]">
									{winnerNomination.title}
								</span>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
