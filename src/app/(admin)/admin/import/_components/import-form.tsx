"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { confirmImportAction, previewImportAction } from "@/lib/actions/wikipedia-import-actions";
import { PreviewTable } from "./preview-table";

/**
 * Wikipedia Import Form Component
 *
 * Client Component that manages the Wikipedia import flow:
 * 1. URL input with validation
 * 2. Preview action to parse and show data
 * 3. Confirm action to commit to database
 *
 * State management:
 * - url: Wikipedia URL entered by user
 * - previewResult: Result from preview action (includes data or errors)
 * - isConfirming: Loading state during confirm action
 */
export function ImportForm() {
  const [url, setUrl] = useState("");

  // Preview action: Parse Wikipedia page without saving
  const {
    execute: preview,
    result: previewResult,
    isExecuting: isPreviewing,
  } = useAction(previewImportAction);

  // Confirm action: Save to database and redirect
  const { execute: confirm, isExecuting: isConfirming } = useAction(confirmImportAction);

  const handlePreview = () => {
    preview({ url });
  };

  const handleConfirm = () => {
    confirm({ url });
  };

  // Client-side URL validation
  const isValidUrl = url.length > 0 && url.includes("wikipedia.org/wiki/");

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="wikipedia-url">
              Wikipedia URL
            </label>
            {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use import form, static IDs are safe */}
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isPreviewing || isConfirming}
              id="wikipedia-url"
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://en.wikipedia.org/wiki/97th_Academy_Awards"
              type="url"
              value={url}
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the URL of a Wikipedia article for an awards ceremony (e.g., Academy Awards,
              Emmy Awards)
            </p>
          </div>

          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isPreviewing || isConfirming || !isValidUrl}
            onClick={handlePreview}
            type="button"
          >
            {isPreviewing ? "Loading Preview..." : "Preview Import"}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {previewResult?.data?.success && previewResult.data.data && (
        <PreviewTable
          isConfirming={isConfirming}
          onConfirm={handleConfirm}
          preview={previewResult.data.data}
        />
      )}

      {/* Error Messages */}
      {previewResult?.serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{previewResult.serverError}</p>
        </div>
      )}

      {previewResult?.data && !previewResult.data.success && previewResult.data.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">Import Error</p>
          <p className="text-sm mt-1">{previewResult.data.error}</p>
        </div>
      )}
    </div>
  );
}
