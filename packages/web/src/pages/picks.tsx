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
  nominations?: Nomination[];
}

export function PicksPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { phase } = useGameState();
  const { picks, selectedNominationId, setSelectedNominationId, handleSelect, saveStatus, completedCategoryIds } = usePicks();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Auth guard
  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  // Lock guard
  useEffect(() => {
    if (phase === "locked" || phase === "completed") navigate("/leaderboard");
  }, [phase, navigate]);

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

  const currentCategory = categories[selectedCategoryIndex];

  // Restore existing pick selection when switching categories
  useEffect(() => {
    if (!currentCategory) return;
    const existingPick = picks.find((p: { categoryId: string; nominationId: string }) => p.categoryId === currentCategory.id);
    setSelectedNominationId(existingPick?.nominationId ?? null);
  }, [currentCategory?.id, picks]);

  if (!currentCategory) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#e2b04a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Loading categories...</p>
        </div>
      </div>
    );
  }

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
            isSelected={selectedNominationId === nom.id}
            onSelect={() => handleSelect(currentCategory.id, nom.id)}
          />
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setSelectedCategoryIndex((i) => Math.max(0, i - 1))}
          disabled={selectedCategoryIndex === 0}
          className="px-4 py-2 text-sm text-[#e2b04a] disabled:text-gray-600"
        >
          ← Previous
        </button>
        <button
          onClick={() => setSelectedCategoryIndex((i) => Math.min(categories.length - 1, i + 1))}
          disabled={selectedCategoryIndex === categories.length - 1}
          className="px-4 py-2 text-sm text-[#e2b04a] disabled:text-gray-600"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
