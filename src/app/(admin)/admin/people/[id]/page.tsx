import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deletePersonAction, updatePersonAction } from "@/lib/actions/admin-actions";
import * as personModel from "@/lib/models/person";

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { id } = await params;
  const person = await personModel.findById(id);

  if (!person) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    await updatePersonAction({
      id: formData.get("id") as string,
      name: formData.get("name") as string | undefined,
      imageUrl: formData.get("imageUrl") as string | undefined,
      externalId: formData.get("externalId") as string | undefined,
    });
  }

  async function handleDelete() {
    "use server";
    try {
      const result = await deletePersonAction({ id });
      if (result?.serverError) {
        // Foreign key constraint error - person has nominations
        return;
      }
      redirect("/admin/people");
    } catch (error) {
      // Handle error - person likely has nominations
      console.error("Error deleting person:", error);
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

      <div className="max-w-4xl">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {person.imageUrl ? (
              <img
                src={person.imageUrl}
                alt={person.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{person.name}</h1>
              {person.externalId && (
                <p className="text-sm text-gray-500 mt-1">External ID: {person.externalId}</p>
              )}
            </div>
          </div>

          <form action={handleDelete}>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this person?")) {
                  e.preventDefault();
                }
              }}
            >
              Delete Person
            </button>
          </form>
        </div>

        {person.nominations.length > 0 && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This person has {person.nominations.length} nomination
              {person.nominations.length !== 1 ? "s" : ""}. You must remove all nominations before
              deleting this person.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Person Details</h2>

          <form action={handleUpdate} className="space-y-6">
            <input type="hidden" name="id" value={person.id} />

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={person.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                defaultValue={person.imageUrl ?? ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="externalId" className="block text-sm font-medium text-gray-700 mb-2">
                External ID
              </label>
              <input
                type="text"
                id="externalId"
                name="externalId"
                defaultValue={person.externalId ?? ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Update Person
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Nominations ({person.nominations.length})
          </h2>

          {person.nominations.length === 0 ? (
            <p className="text-gray-500">This person has no nominations yet.</p>
          ) : (
            <div className="space-y-4">
              {person.nominations.map((nomination) => (
                <div key={nomination.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900 font-medium">{nomination.nominationText}</p>
                  <p className="text-xs text-gray-500 mt-1">Category ID: {nomination.categoryId}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
