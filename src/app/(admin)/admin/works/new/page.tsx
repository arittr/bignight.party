import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkType } from "@prisma/client";
import { createWorkAction } from "@/lib/actions/admin-actions";

export default function NewWorkPage() {
  async function handleCreate(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const type = formData.get("type") as WorkType;
    const year = formData.get("year");
    const posterUrl = formData.get("posterUrl");
    const externalId = formData.get("externalId");

    await createWorkAction({
      title,
      type,
      ...(year && { year: Number(year) }),
      ...(posterUrl && { posterUrl: posterUrl as string }),
      ...(externalId && { externalId: externalId as string }),
    });

    redirect("/admin/works");
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/works" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Works
        </Link>
        <h1 className="text-3xl font-bold">Create New Work</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <form action={handleCreate}>
          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter work title"
            />
          </div>

          {/* Type */}
          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a type</option>
              <option value={WorkType.FILM}>Film</option>
              <option value={WorkType.TV_SHOW}>TV Show</option>
              <option value={WorkType.ALBUM}>Album</option>
              <option value={WorkType.SONG}>Song</option>
              <option value={WorkType.PLAY}>Play</option>
              <option value={WorkType.BOOK}>Book</option>
            </select>
          </div>

          {/* Year */}
          <div className="mb-4">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              min="1900"
              max={new Date().getFullYear() + 10}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter year"
            />
          </div>

          {/* Poster URL */}
          <div className="mb-4">
            <label htmlFor="posterUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Poster URL
            </label>
            <input
              type="url"
              id="posterUrl"
              name="posterUrl"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/poster.jpg"
            />
          </div>

          {/* External ID */}
          <div className="mb-6">
            <label htmlFor="externalId" className="block text-sm font-medium text-gray-700 mb-2">
              External ID
            </label>
            <input
              type="text"
              id="externalId"
              name="externalId"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., IMDB ID, ISBN, etc."
            />
          </div>

          {/* Submit buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create Work
            </button>
            <Link
              href="/admin/works"
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors inline-block"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
