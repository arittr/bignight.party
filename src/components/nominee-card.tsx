"use client";

interface NomineeCardProps {
  nomination: {
    id: string;
    nominationText: string;
    work?: {
      title: string;
      posterUrl: string | null;
      year: number | null;
    } | null;
    person?: {
      name: string;
      imageUrl: string | null;
    } | null;
  };
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export function NomineeCard({ nomination, isSelected, isLocked, onClick }: NomineeCardProps) {
  const imageUrl = nomination.work?.posterUrl || nomination.person?.imageUrl || null;
  const title = nomination.work?.title || nomination.person?.name || "Unknown";
  const year = nomination.work?.year;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={`
        group relative w-full overflow-hidden rounded-lg border-2 p-4 text-left transition-all
        ${
          isSelected
            ? "border-indigo-600 bg-indigo-50 shadow-md"
            : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
        }
        ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Image or placeholder */}
        <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-200">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
              <svg
                className="h-8 w-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {title}
            {year && <span className="ml-1 text-gray-500">({year})</span>}
          </div>
          {nomination.nominationText && (
            <div className="mt-1 text-sm text-gray-600 whitespace-normal break-words">
              {nomination.nominationText}
            </div>
          )}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
