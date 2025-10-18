import { WorkType } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
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
        <Link className="text-blue-600 hover:text-blue-800 mb-4 inline-block" href="/admin/works">
          ← Back to Works
        </Link>
        <h1 className="text-3xl font-bold">Create New Work</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <form action={handleCreate}>
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="title">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              id="title"
              name="title"
              placeholder="Enter work title"
              required
              type="text"
            />
          </div>

          {/* Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="type">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              id="type"
              name="type"
              required
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
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="year">
              Year
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              id="year"
              max={new Date().getFullYear() + 10}
              min="1900"
              name="year"
              placeholder="Enter year"
              type="number"
            />
          </div>

          {/* Poster URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="posterUrl">
              Poster URL
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              id="posterUrl"
              name="posterUrl"
              placeholder="https://example.com/poster.jpg"
              type="url"
            />
          </div>

          {/* External ID */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="externalId">
              External ID
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              id="externalId"
              name="externalId"
              placeholder="e.g., IMDB ID, ISBN, etc."
              type="text"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex gap-4">
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              type="submit"
            >
              Create Work
            </button>
            <Link
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors inline-block"
              href="/admin/works"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
