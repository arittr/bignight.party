interface NominationCardProps {
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  isSelected: boolean;
  onSelect: () => void;
  pickCount?: number; // Admin: "6 picks"
  titleNomCount?: number; // Nomination count for the title text
  subtitleNomCount?: number; // Nomination count for the subtitle text
  isCorrect?: boolean; // My Picks: green for correct
  isIncorrect?: boolean; // My Picks: red for incorrect
  isWinner?: boolean; // Show winner badge
}

export function NominationCard({
  title,
  subtitle,
  imageUrl,
  isSelected,
  onSelect,
  pickCount,
  titleNomCount,
  subtitleNomCount,
  isCorrect,
  isIncorrect,
  isWinner,
}: NominationCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-lg border text-left transition-all ${
        isSelected
          ? "border-[#e2b04a] bg-[#e2b04a]/10"
          : isCorrect
            ? "border-green-500/50 bg-green-500/5"
            : isIncorrect
              ? "border-red-500/50 bg-red-500/5"
              : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
      }`}
    >
      <div className="flex items-start gap-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="w-12 h-12 rounded object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white truncate">{title}</p>
            {(titleNomCount ?? 0) >= (subtitleNomCount ?? 0) && (titleNomCount ?? 0) > 1 && (
              <span className="text-xs text-gray-500 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                {titleNomCount} noms
              </span>
            )}
            {isWinner && <span className="text-[#e2b04a] text-xs">👑</span>}
            {isCorrect && <span className="text-green-400">✓</span>}
            {isIncorrect && <span className="text-red-400">✗</span>}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-400 truncate">{subtitle}</p>
            {(subtitleNomCount ?? 0) > (titleNomCount ?? 0) && (subtitleNomCount ?? 0) > 1 && (
              <span className="text-xs text-gray-500 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                {subtitleNomCount} noms
              </span>
            )}
          </div>
        </div>
        {pickCount !== undefined && (
          <span className="text-xs text-gray-500 shrink-0">
            {pickCount} picks
          </span>
        )}
      </div>
    </button>
  );
}
