"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { submitPickAction } from "@/lib/actions/pick-actions";
import { CategoryProgressStepper } from "./category-progress-stepper";
import { NomineeCard } from "./nominee-card";

interface PickWizardProps {
  gameId: string;
  gameName: string;
  categories: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  currentCategoryId: string;
  nominations: Array<{
    id: string;
    nominationText: string;
    work?: {
      title: string;
      imageUrl: string | null;
      year: number | null;
    } | null;
    person?: {
      name: string;
      imageUrl: string | null;
    } | null;
  }>;
  existingPicks: Array<{
    categoryId: string;
    nominationId: string;
  }>;
  isLocked: boolean;
  showLockWarning: boolean;
  minutesUntilLock: number | null;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex UI component with multiple states and interactions
export function PickWizard({
  gameId,
  gameName,
  categories,
  currentCategoryId,
  nominations,
  existingPicks,
  isLocked,
  showLockWarning,
  minutesUntilLock,
}: PickWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Find existing pick for current category
  const existingPick = existingPicks.find((p) => p.categoryId === currentCategoryId);
  const [selectedNominationId, setSelectedNominationId] = useState<string | null>(
    existingPick?.nominationId || null
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Update selected nomination when category changes
  useEffect(() => {
    const pick = existingPicks.find((p) => p.categoryId === currentCategoryId);
    setSelectedNominationId(pick?.nominationId || null);
    setSaveStatus("idle");
  }, [currentCategoryId, existingPicks]);

  // Submit pick action
  const { execute } = useAction(submitPickAction, {
    onError: (_error) => {
      setSaveStatus("idle");
    },
    onSuccess: () => {
      setSaveStatus("saved");
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    },
  });

  // Handle nomination selection
  const handleSelectNomination = (nominationId: string) => {
    if (isLocked) return;

    setSelectedNominationId(nominationId);
    setSaveStatus("saving");

    execute({
      categoryId: currentCategoryId,
      gameId,
      nominationId,
    });
  };

  // Navigate to category
  const navigateToCategory = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", categoryId);
    router.push(`?${params.toString()}`);
  };

  // Handle previous/next navigation
  const currentIndex = categories.findIndex((c) => c.id === currentCategoryId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < categories.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      navigateToCategory(categories[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      navigateToCategory(categories[currentIndex + 1].id);
    }
  };

  // Calculate completed categories
  const completedCategoryIds = new Set(existingPicks.map((p) => p.categoryId));
  const isIncomplete = completedCategoryIds.size < categories.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar overlay */}
      {isSidebarOpen && (
        // biome-ignore lint/a11y/useSemanticElements: Div is appropriate for full-screen overlay backdrop
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsSidebarOpen(false);
          }}
          role="button"
          tabIndex={0}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-80 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <button
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>

          {/* Category list */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              {categories.map((category, index) => {
                const isCompleted = completedCategoryIds.has(category.id);
                const isCurrent = category.id === currentCategoryId;

                return (
                  <button
                    className={`
                      w-full rounded-lg px-4 py-3 text-left transition-colors
                      ${
                        isCurrent
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                    key={category.id}
                    onClick={() => {
                      navigateToCategory(category.id);
                      setIsSidebarOpen(false);
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                          <span className="text-sm">{category.name}</span>
                        </div>
                      </div>
                      {isCompleted && (
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            clipRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            fillRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600">
              <div className="font-medium">Progress</div>
              <div className="mt-1">
                {completedCategoryIds.size} of {categories.length} completed
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-80">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* Mobile menu button */}
          <button
            className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Categories
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{gameName}</h1>
            <p className="mt-1 text-gray-600">Make your predictions for each category</p>
          </div>

          {/* Lock time warning banner */}
          {showLockWarning && isIncomplete && !isLocked && (
            <div className="mb-6 rounded-lg bg-yellow-50 border-2 border-yellow-400 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-yellow-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <div>
                  <div className="font-semibold text-yellow-900">Picks lock soon!</div>
                  <div className="mt-1 text-sm text-yellow-800">
                    You have {minutesUntilLock} minute
                    {minutesUntilLock !== 1 ? "s" : ""} to complete your picks. You have{" "}
                    {categories.length - completedCategoryIds.size} categor
                    {categories.length - completedCategoryIds.size === 1 ? "y" : "ies"} remaining.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Locked banner */}
          {isLocked && (
            <div className="mb-6 rounded-lg bg-red-50 border-2 border-red-400 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-red-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <div>
                  <div className="font-semibold text-red-900">Picks are locked</div>
                  <div className="mt-1 text-sm text-red-800">
                    This game is no longer accepting picks. You can view your selections but cannot
                    make changes.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress stepper */}
          <CategoryProgressStepper
            categories={categories}
            completedCategoryIds={completedCategoryIds}
            currentCategoryId={currentCategoryId}
            onCategoryClick={navigateToCategory}
          />

          {/* Save indicator */}
          {saveStatus !== "idle" && (
            <div className="mb-4 text-center">
              {saveStatus === "saving" && (
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    />
                  </svg>
                  Saving...
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm text-green-700">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      fillRule="evenodd"
                    />
                  </svg>
                  Saved
                </div>
              )}
            </div>
          )}

          {/* Nominee cards */}
          <div className="space-y-3 mb-8">
            {nominations.map((nomination) => (
              <NomineeCard
                isLocked={isLocked}
                isSelected={selectedNominationId === nomination.id}
                key={nomination.id}
                nomination={nomination}
                onClick={() => handleSelectNomination(nomination.id)}
              />
            ))}

            {nominations.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <p className="mt-4 text-gray-500">No nominations available for this category</p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              className={`
              inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
              ${
                hasPrevious
                  ? "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }
            `}
              disabled={!hasPrevious}
              onClick={handlePrevious}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M15 19l-7-7 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              Previous
            </button>

            <button
              className={`
              inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
              ${
                hasNext
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }
            `}
              disabled={!hasNext}
              onClick={handleNext}
              type="button"
            >
              Next
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>

          {/* Back to dashboard link */}
          <div className="mt-8 text-center">
            <a
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
              href="/dashboard"
            >
              Back to My Games
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
