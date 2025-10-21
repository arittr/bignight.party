"use client";

import { useState } from "react";
import { usePickNavigation } from "@/hooks/game/use-pick-navigation";
import { usePickSubmission } from "@/hooks/game/use-pick-submission";
import { useSaveIndicator } from "@/hooks/game/use-save-indicator";
import { routes } from "@/lib/routes";
import { CategorySidebar } from "./category-sidebar";
import { NominationList } from "./nomination-list";
import { PickProgressTracker } from "./pick-progress-tracker";
import { SaveIndicator } from "./save-indicator";
import { WizardNavigation } from "./wizard-navigation";

interface PickWizardProps {
  gameId: string;
  gameName: string;
  categories: Array<{
    id: string;
    name: string;
    points: number;
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
  // Note: These props match what page.tsx currently passes
  // PickStatusBanner needs additional props (status, locksAt) which we'll handle separately
}

/**
 * Main PickWizard orchestrator component
 *
 * Composes all feature-slice components and custom hooks to create
 * a complete pick wizard experience. This component is responsible for:
 * - Layout structure (sidebar, main content, navigation)
 * - Mobile sidebar toggle state
 * - Coordinating hooks and components
 *
 * Business logic is delegated to hooks:
 * - usePickNavigation: Category navigation
 * - usePickSubmission: Pick submission with optimistic updates
 * - useSaveIndicator: Save status tracking
 *
 * This is a Client Component (orchestrates client components and hooks).
 */
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
  // Mobile sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Custom hooks for business logic
  const navigation = usePickNavigation({
    categories,
    currentCategoryId,
    gameId,
  });

  const saveIndicator = useSaveIndicator();

  const submission = usePickSubmission({
    currentCategoryId,
    existingPicks,
    gameId,
    onError: saveIndicator.reset,
    onSaved: saveIndicator.setSaved,
    onSaving: saveIndicator.setSaving,
  });

  // Calculate incomplete categories for warning banner
  const isIncomplete = submission.completedCategoryIds.size < categories.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      )}

      {/* Sidebar - collapsible on mobile, always visible on desktop */}
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
              aria-label="Close sidebar"
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

          {/* CategorySidebar component */}
          <div className="flex-1 overflow-hidden">
            <CategorySidebar
              categories={categories}
              completedCategoryIds={submission.completedCategoryIds}
              currentCategoryId={navigation.currentCategoryId}
              onCategorySelect={(categoryId) => {
                navigation.navigateToCategory(categoryId);
                setIsSidebarOpen(false);
              }}
            />
          </div>
        </div>
      </aside>

      {/* Main content area */}
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

          {/* Lock time warning banner (only when not locked, incomplete, and close to deadline) */}
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
                    {categories.length - submission.completedCategoryIds.size} categor
                    {categories.length - submission.completedCategoryIds.size === 1 ? "y" : "ies"}{" "}
                    remaining.
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

          {/* PickProgressTracker (desktop only, horizontal stepper) */}
          <PickProgressTracker
            categories={categories}
            completedCategoryIds={submission.completedCategoryIds}
            currentCategoryId={navigation.currentCategoryId}
            onCategorySelect={navigation.navigateToCategory}
          />

          {/* SaveIndicator (floating) */}
          {saveIndicator.status !== "idle" && (
            <div className="mb-4 text-center">
              <SaveIndicator status={saveIndicator.status} />
            </div>
          )}

          {/* NominationList component */}
          <div className="mb-8">
            {nominations.length > 0 ? (
              <NominationList
                isLocked={isLocked}
                nominations={nominations}
                onSelect={(nominationId) => submission.handleSelect(nominationId, isLocked)}
                selectedNominationId={submission.selectedNominationId}
              />
            ) : (
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

          {/* WizardNavigation component */}
          <WizardNavigation
            hasNext={navigation.hasNext}
            hasPrevious={navigation.hasPrevious}
            onNext={navigation.handleNext}
            onPrevious={navigation.handlePrevious}
          />

          {/* Back to dashboard link */}
          <div className="mt-8 text-center">
            <a
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
              href={routes.dashboard()}
            >
              Back to My Games
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
