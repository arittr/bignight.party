import Link from "next/link";
import { redirect } from "next/navigation";
import { createPersonAction } from "@/lib/actions/admin-actions";

export default function NewPersonPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createPersonAction({
      name: formData.get("name") as string,
      imageUrl: formData.get("imageUrl") as string | undefined,
      externalId: formData.get("externalId") as string | undefined,
    });

    if (!result?.serverError) {
      redirect("/admin/people");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/people"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to People
        </Link>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Person</h1>

        <form action={handleCreate} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Christopher Nolan"
            />
            <p className="mt-1 text-sm text-gray-500">The person's full name</p>
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional URL to the person's photo or headshot
            </p>
          </div>

          <div>
            <label htmlFor="externalId" className="block text-sm font-medium text-gray-700 mb-2">
              External ID
            </label>
            <input
              type="text"
              id="externalId"
              name="externalId"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., tmdb:138"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional external database ID (e.g., from TMDB or IMDB)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Person
            </button>
            <Link
              href="/admin/people"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
