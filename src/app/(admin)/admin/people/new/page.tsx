import Link from "next/link";
import { redirect } from "next/navigation";
import { createPersonAction } from "@/lib/actions/admin-actions";

export default function NewPersonPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createPersonAction({
      externalId: formData.get("externalId") as string | undefined,
      imageUrl: formData.get("imageUrl") as string | undefined,
      name: formData.get("name") as string,
    });

    if (!result?.serverError) {
      redirect("/admin/people");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          href="/admin/people"
        >
          ← Back to People
        </Link>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Person</h1>

        <form action={handleCreate} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="name"
              name="name"
              placeholder="e.g., Christopher Nolan"
              required
              type="text"
            />
            <p className="mt-1 text-sm text-gray-500">The person's full name</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="imageUrl">
              Image URL
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="imageUrl"
              name="imageUrl"
              placeholder="https://example.com/image.jpg"
              type="url"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional URL to the person's photo or headshot
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="externalId">
              External ID
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="externalId"
              name="externalId"
              placeholder="e.g., tmdb:138"
              type="text"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional external database ID (e.g., from TMDB or IMDB)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              type="submit"
            >
              Create Person
            </button>
            <Link
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              href="/admin/people"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
