import { ImportForm } from "./_components/import-form";

/**
 * Wikipedia Import Page
 *
 * Admin-only page that allows importing events from Wikipedia.
 * Uses a two-step flow:
 * 1. Enter Wikipedia URL and preview the parsed data
 * 2. Confirm and import to database
 *
 * This is a Server Component that renders the layout.
 * All interactivity is delegated to Client Components.
 */
export default async function ImportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Event from Wikipedia</h1>
        <p className="text-gray-600">
          Paste a Wikipedia URL to import event data including categories and nominations.
        </p>
      </div>

      <ImportForm />
    </div>
  );
}
