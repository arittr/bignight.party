"use client";

import type { PreviewData } from "@/schemas/wikipedia-import-schema";

type PreviewTableProps = {
  preview: PreviewData;
  onConfirm: () => void;
  isConfirming: boolean;
};

/**
 * Preview Table Component
 *
 * Client Component that displays parsed Wikipedia data for admin validation.
 * Shows:
 * - Event metadata (name, date, description)
 * - Summary statistics (category count, nomination count)
 * - Sample categories with their nomination counts
 * - Confirm button to trigger import
 *
 * This allows admins to verify the data before committing to database.
 */
export function PreviewTable({ preview, onConfirm, isConfirming }: PreviewTableProps) {
  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 border-b px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900">{preview.event.name}</h2>
        {preview.event.description && (
          <p className="text-sm text-gray-600 mt-1">{preview.event.description}</p>
        )}
      </div>

      {/* Event Metadata */}
      <div className="px-6 py-4 border-b">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Event Details
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(preview.event.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Categories</p>
            <p className="text-lg font-semibold text-gray-900">{preview.categoryCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Nominations</p>
            <p className="text-lg font-semibold text-gray-900">{preview.nominationCount}</p>
          </div>
        </div>
      </div>

      {/* Sample Categories */}
      {preview.categories && preview.categories.length > 0 && (
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Sample Categories (First 5)
          </h3>
          <div className="space-y-3">
            {preview.categories.slice(0, 5).map((category, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-600">
                    {category.nominationCount} nomination{category.nominationCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Point Value</p>
                  <p className="text-lg font-semibold text-blue-600">{category.pointValue}</p>
                </div>
              </div>
            ))}
          </div>
          {preview.categories.length > 5 && (
            <p className="text-sm text-gray-500 mt-3">
              ...and {preview.categories.length - 5} more categor
              {preview.categories.length - 5 !== 1 ? "ies" : "y"}
            </p>
          )}
        </div>
      )}

      {/* Confirm Button */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Review the data above. Click confirm to import this event into the database.
          </p>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isConfirming ? "Importing..." : "Confirm Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
