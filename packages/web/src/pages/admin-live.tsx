import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth";
import { CategoryPills } from "../components/category-pills";
import { NominationCard } from "../components/nomination-card";
import type { CategoryWithNominations } from "@bignight/shared";

export function AdminLivePage() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [confirming, setConfirming] = useState<{
    categoryId: string;
    nominationId: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!isAdmin) navigate("/admin");
  }, [isAdmin, navigate]);

  const { data: categories = [] } = useQuery<CategoryWithNominations[]>({
    queryKey: ["admin-categories"],
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
  const revealedIds = new Set(
    categories.filter((c) => c.isRevealed).map((c) => c.id)
  );
  const revealedCount = revealedIds.size;

  const markWinner = useMutation({
    mutationFn: async ({
      categoryId,
      nominationId,
    }: {
      categoryId: string;
      nominationId: string;
    }) => {
      const res = await fetch("/api/admin/mark-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId }),
      });
      if (!res.ok) throw new Error("Failed to mark winner");
    },
    onSuccess: () => {
      setConfirming(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const clearWinner = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await fetch("/api/admin/clear-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId }),
      });
      if (!res.ok) throw new Error("Failed to clear winner");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  if (!currentCategory) return <div className="p-4 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e2b04a]">Live</h1>
        <span className="text-sm text-gray-400">
          {revealedCount} / {categories.length} revealed
        </span>
      </div>

      <CategoryPills
        categories={categories}
        selectedId={currentCategory.id}
        onSelect={(id) => {
          const idx = categories.findIndex((c) => c.id === id);
          if (idx >= 0) setSelectedCategoryIndex(idx);
        }}
        revealedIds={revealedIds}
      />

      <h2 className="text-xl font-bold text-white">{currentCategory.name}</h2>

      {currentCategory.isRevealed && (
        <button
          onClick={() => clearWinner.mutate(currentCategory.id)}
          className="text-sm text-red-400 hover:text-red-300"
        >
          ↩ Undo winner
        </button>
      )}

      {confirming && (
        <div className="bg-[#e2b04a]/20 border border-[#e2b04a]/50 p-4 rounded-lg space-y-3">
          <p className="text-white text-sm">
            Mark{" "}
            <span className="font-bold text-[#e2b04a]">{confirming.title}</span>{" "}
            as winner of{" "}
            <span className="font-bold">{currentCategory.name}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                markWinner.mutate({
                  categoryId: confirming.categoryId,
                  nominationId: confirming.nominationId,
                })
              }
              className="px-4 py-2 bg-[#e2b04a] text-[#1a1a2e] font-bold rounded-lg text-sm"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {currentCategory.nominations?.map((nom) => (
          <NominationCard
            key={nom.id}
            title={nom.title}
            subtitle={nom.subtitle}
            imageUrl={nom.imageUrl}
            isSelected={nom.id === currentCategory.winnerId}
            isWinner={nom.id === currentCategory.winnerId}
            onSelect={() => {
              if (!currentCategory.isRevealed) {
                setConfirming({
                  categoryId: currentCategory.id,
                  nominationId: nom.id,
                  title: nom.title,
                });
              }
            }}
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
          onClick={() =>
            setSelectedCategoryIndex((i) =>
              Math.min(categories.length - 1, i + 1)
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
