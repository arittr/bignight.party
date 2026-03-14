interface CategoryPillsProps {
  categories: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  completedIds?: Set<string>; // Checkmark for completed picks
  revealedIds?: Set<string>; // Green checkmark for revealed (admin)
}

export function CategoryPills({
  categories,
  selectedId,
  onSelect,
  completedIds,
  revealedIds,
}: CategoryPillsProps) {
  return (
    <div className="relative">
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const isSelected = cat.id === selectedId;
        const isCompleted = completedIds?.has(cat.id);
        const isRevealed = revealedIds?.has(cat.id);

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? "bg-[#e2b04a] text-[#1a1a2e]"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {isRevealed && <span className="text-green-400 mr-1">✓</span>}
            {isCompleted && !isRevealed && (
              <span className="text-[#e2b04a] mr-1">✓</span>
            )}
            {cat.name.replace("Best ", "")}
          </button>
        );
      })}
    </div>
    <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#1a1a2e] to-transparent pointer-events-none" />
    </div>
  );
}
