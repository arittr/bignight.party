"use client";

interface CategoryProgressStepperProps {
  categories: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  currentCategoryId: string;
  completedCategoryIds: Set<string>;
  onCategoryClick: (categoryId: string) => void;
}

export function CategoryProgressStepper({
  categories,
  currentCategoryId,
  completedCategoryIds,
  onCategoryClick,
}: CategoryProgressStepperProps) {
  const currentIndex = categories.findIndex((c) => c.id === currentCategoryId);
  const totalCategories = categories.length;
  const completedCount = completedCategoryIds.size;

  return (
    <div className="mb-8">
      {/* Progress text */}
      <div className="mb-4 text-center text-sm text-gray-600">
        Category {currentIndex + 1} of {totalCategories} • {completedCount} completed
      </div>

      {/* Category indicators */}
      <div className="relative">
        <div className="overflow-x-auto">
          <div className="flex items-center justify-center gap-3 px-4 pb-2">
            {categories.map((category, index) => {
              const isCurrent = category.id === currentCategoryId;
              const isCompleted = completedCategoryIds.has(category.id);

              return (
                <button
                  aria-label={`Category ${index + 1}: ${category.name}`}
                  className={`
                    group relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all
                    ${
                      isCurrent
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                        : isCompleted
                          ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                          : "border-gray-300 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                    }
                  `}
                  key={category.id}
                  onClick={() => onCategoryClick(category.id)}
                  title={category.name}
                  type="button"
                >
                  {isCompleted && !isCurrent ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        clipRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category name below stepper */}
        <div className="mt-2 text-center">
          <div className="text-lg font-semibold text-gray-900">
            {categories[currentIndex]?.name}
          </div>
        </div>
      </div>
    </div>
  );
}
