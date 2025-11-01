import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { serverClient } from "@/lib/api/server-client";
import { requireValidatedSession } from "@/lib/auth/config";
import * as personModel from "@/lib/models/person";

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  await requireValidatedSession();

  const { id } = await params;
  const person = await personModel.findById(id);

  if (!person) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    await serverClient.admin.updatePerson({
      externalId: formData.get("externalId") as string | undefined,
      id: formData.get("id") as string,
      imageUrl: formData.get("imageUrl") as string | undefined,
      name: formData.get("name") as string | undefined,
    });
  }

  async function handleDelete() {
    "use server";
    try {
      await serverClient.admin.deletePerson({ id });
      redirect("/admin/people");
    } catch (_error) {
      // Foreign key constraint error - person has nominations
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

      <div className="max-w-4xl">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {person.imageUrl ? (
              <Image
                alt={person.name}
                className="h-20 w-20 rounded-full object-cover"
                height={80}
                src={person.imageUrl}
                unoptimized
                width={80}
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              type="submit"
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
            <input name="id" type="hidden" value={person.id} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                Name <span className="text-red-500">*</span>
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={person.name}
                id="name"
                name="name"
                required
                type="text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="imageUrl">
                Image URL
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={person.imageUrl ?? ""}
                id="imageUrl"
                name="imageUrl"
                type="url"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="externalId">
                External ID
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={person.externalId ?? ""}
                id="externalId"
                name="externalId"
                type="text"
              />
            </div>

            <div className="pt-4">
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                type="submit"
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
                <div className="border border-gray-200 rounded-lg p-4" key={nomination.id}>
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
