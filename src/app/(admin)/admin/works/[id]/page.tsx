import { WorkType } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { serverClient } from "@/lib/api/server-client";
import { requireValidatedSession } from "@/lib/auth/config";
import * as workModel from "@/lib/models/work";

interface WorkDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkDetailPage(props: WorkDetailPageProps) {
  await requireValidatedSession();

  const params = await props.params;
  const work = await workModel.findById(params.id);

  if (!work) {
    notFound();
  }

  // Delete action with error handling
  async function handleDelete() {
    "use server";
    await serverClient.admin.works.delete({ id: params.id });
    redirect("/admin/works");
  }

  return (
    <div>
      <div className="mb-8">
        <Link className="text-blue-600 hover:text-blue-800 mb-4 inline-block" href="/admin/works">
          ← Back to Works
        </Link>
        <h1 className="text-3xl font-bold">{work.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Edit Work</h2>

          <form
            action={async (formData: FormData) => {
              "use server";

              const title = formData.get("title");
              const type = formData.get("type");
              const year = formData.get("year");
              const imageUrl = formData.get("imageUrl");
              const externalId = formData.get("externalId");

              await serverClient.admin.works.update({
                id: params.id,
                ...(title && { title: title as string }),
                ...(type && { type: type as WorkType }),
                ...(year && { year: Number(year) }),
                ...(imageUrl && { imageUrl: imageUrl as string }),
                ...(externalId && { externalId: externalId as string }),
              });
            }}
          >
            <input name="id" type="hidden" value={work.id} />

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="title">
                Title
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={work.title}
                id="title"
                name="title"
                type="text"
              />
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="type">
                Type
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={work.type}
                id="type"
                name="type"
              >
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
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={work.year ?? ""}
                id="year"
                max={new Date().getFullYear() + 10}
                min="1900"
                name="year"
                type="number"
              />
            </div>

            {/* Poster URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="imageUrl">
                Poster URL
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={work.imageUrl ?? ""}
                id="imageUrl"
                name="imageUrl"
                type="url"
              />
            </div>

            {/* External ID */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="externalId">
                External ID
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={work.externalId ?? ""}
                id="externalId"
                name="externalId"
                type="text"
              />
            </div>

            {/* Submit button */}
            <button
              className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              type="submit"
            >
              Update Work
            </button>
          </form>
        </div>

        {/* Work details and nominations */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Work Details</h2>

          <dl className="space-y-2 mb-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{work.type.replace("_", " ")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Year</dt>
              <dd className="mt-1 text-sm text-gray-900">{work.year || "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">External ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{work.externalId || "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(work.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          {/* Nominations */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Nominations ({work.nominations.length})</h3>
            {work.nominations.length === 0 ? (
              <p className="text-sm text-gray-500">No nominations yet.</p>
            ) : (
              <ul className="space-y-2">
                {work.nominations.map((nomination) => (
                  <li className="text-sm text-gray-700 p-2 bg-gray-50 rounded" key={nomination.id}>
                    {nomination.nominationText}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Delete button */}
          <div className="border-t pt-4 mt-6">
            {work.nominations.length > 0 ? (
              <div>
                <button
                  className="w-full px-6 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
                  disabled
                  type="button"
                >
                  Cannot Delete (Has Nominations)
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Remove all nominations before deleting this work.
                </p>
              </div>
            ) : (
              <form action={handleDelete}>
                <button
                  className="w-full px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  type="submit"
                >
                  Delete Work
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
