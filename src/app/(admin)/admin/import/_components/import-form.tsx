"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { PreviewTable } from "./preview-table";
import type { PreviewData } from "@/schemas/wikipedia-import-schema";

/**
 * Wikipedia Import Form Component
 *
 * Client Component that manages the Wikipedia import flow:
 * 1. URL input with validation
 * 2. Preview mutation to parse and show data (oRPC)
 * 3. Confirm mutation to commit to database (oRPC)
 *
 * State management:
 * - url: Wikipedia URL entered by user
 * - previewData: Result from preview mutation
 * - Uses TanStack Query for mutation management
 */
export function ImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Preview mutation: Parse Wikipedia page without saving
  const previewMutation = (orpc.admin.previewWikipediaImport as any).useMutation?.({
    onSuccess: (data: PreviewData) => {
      setPreviewData(data);
    },
    onError: (error: any) => {
      console.error("Preview failed:", error);
      setPreviewData(null);
    },
  });

  // Confirm mutation: Save to database and redirect
  const confirmMutation = (orpc.admin.importFromWikipedia as any).useMutation?.({
    onSuccess: (result: any) => {
      router.push(routes.admin.events.detail(result.eventId));
    },
    onError: (error: any) => {
      console.error("Import failed:", error);
    },
  });

  const handlePreview = () => {
    setPreviewData(null);
    previewMutation?.mutate({ url });
  };

  const handleConfirm = () => {
    confirmMutation?.mutate({ url });
  };

  // Client-side URL validation
  const isValidUrl = url.length > 0 && url.includes("wikipedia.org/wiki/");

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="wikipedia-url" className="block text-sm font-medium text-gray-700 mb-2">
              Wikipedia URL
            </label>
            <input
              id="wikipedia-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://en.wikipedia.org/wiki/97th_Academy_Awards"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={previewMutation?.isPending || confirmMutation?.isPending}
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the URL of a Wikipedia article for an awards ceremony (e.g., Academy Awards,
              Emmy Awards)
            </p>
          </div>

          <button
            type="button"
            onClick={handlePreview}
            disabled={previewMutation?.isPending || confirmMutation?.isPending || !isValidUrl}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {previewMutation?.isPending ? "Loading Preview..." : "Preview Import"}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {previewData && (
        <PreviewTable
          preview={previewData}
          onConfirm={handleConfirm}
          isConfirming={confirmMutation?.isPending || false}
        />
      )}

      {/* Error Messages */}
      {previewMutation?.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">Preview Error</p>
          <p className="text-sm mt-1">
            {previewMutation?.error instanceof Error
              ? previewMutation.error.message
              : "Failed to preview Wikipedia page"}
          </p>
        </div>
      )}

      {confirmMutation?.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">Import Error</p>
          <p className="text-sm mt-1">
            {confirmMutation?.error instanceof Error
              ? confirmMutation.error.message
              : "Failed to import Wikipedia data"}
          </p>
        </div>
      )}
    </div>
  );
}
