import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth";

export function MyPicksPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!token) navigate("/"); }, [token, navigate]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!token,
  });

  const { data: picks = [] } = useQuery({
    queryKey: ["my-picks"],
    queryFn: async () => {
      const res = await fetch("/api/picks", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!token,
  });

  const picksByCategory = new Map(picks.map((p) => [p.categoryId, p]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#e2b04a]">My Picks</h1>

      {categories.length === 0 && (
        <p className="text-gray-400">No categories yet.</p>
      )}

      {categories.map((category) => {
        const pick = picksByCategory.get(category.id);
        const pickedNomination = pick
          ? category.nominations?.find((n) => n.id === pick.nominationId)
          : null;
        const winnerNomination = category.winnerId
          ? category.nominations?.find((n) => n.id === category.winnerId)
          : null;
        const isRevealed = category.isRevealed;
        const isCorrect = isRevealed && pick?.nominationId === category.winnerId;
        const isIncorrect = isRevealed && pick?.nominationId !== category.winnerId && pick !== undefined;

        return (
          <div key={category.id} className="p-4 rounded-lg bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white text-sm">{category.name}</h3>
              {isRevealed && (
                <span className={isCorrect ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
                  {isCorrect ? "✓ Correct" : "✗ Wrong"}
                </span>
              )}
            </div>

            {pickedNomination ? (
              <div className={`p-3 rounded border ${
                isCorrect ? "border-green-500/50 bg-green-500/5" :
                isIncorrect ? "border-red-500/50 bg-red-500/5" :
                "border-white/10 bg-white/[0.02]"
              }`}>
                <p className="text-white text-sm">{pickedNomination.title}</p>
                <p className="text-gray-400 text-xs">{pickedNomination.subtitle}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No pick</p>
            )}

            {isRevealed && winnerNomination && !isCorrect && (
              <div className="text-xs text-gray-400">
                Winner: <span className="text-[#e2b04a]">{winnerNomination.title}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
