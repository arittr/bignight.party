import Link from "next/link";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/api/server-client";
import * as categoryModel from "@/lib/models/category";
import * as personModel from "@/lib/models/person";
import * as workModel from "@/lib/models/work";

type PageProps = {
  params: Promise<{
    id: string;
    categoryId: string;
  }>;
};

export default async function NewNominationPage({ params }: PageProps) {
  const { id: eventId, categoryId } = await params;

  // Fetch category to verify it exists and belongs to this event
  const category = await categoryModel.findById(categoryId);

  if (!category || category.eventId !== eventId) {
    redirect(`/admin/events/${eventId}`);
  }

  // Fetch all works and people for dropdowns
  const works = await workModel.findAll();
  const people = await personModel.findAll();

  async function handleCreateNomination(formData: FormData) {
    "use server";

    const nominationText = formData.get("nominationText") as string;
    const workId = formData.get("workId") as string;
    const personId = formData.get("personId") as string;

    await serverClient.admin.createNomination({
      categoryId,
      nominationText,
      personId: personId || undefined,
      workId: workId || undefined,
    });

    redirect(`/admin/events/${eventId}/categories/${categoryId}`);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          className="text-blue-600 hover:text-blue-800 text-sm"
          href={`/admin/events/${eventId}/categories/${categoryId}`}
        >
          ← Back to Category
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">New Nomination</h1>
      <p className="text-gray-600 mb-8">
        Create a nomination for: <strong>{category.name}</strong>
      </p>

      <form action={handleCreateNomination} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="nominationText">
            Nomination Text *
          </label>
          {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id="nominationText"
            name="nominationText"
            placeholder="e.g., Christopher Nolan for Oppenheimer"
            required
            type="text"
          />
          <p className="text-sm text-gray-500 mt-1">Enter the display text for this nomination</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="workId">
            Work (Optional)
          </label>
          {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id="workId"
            name="workId"
          >
            <option value="">-- Select Work --</option>
            {works.map((work) => (
              <option key={work.id} value={work.id}>
                {work.title} ({work.type}, {work.year})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Optional: Select a work (film, TV show, etc.) for this nomination
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="personId">
            Person (Optional)
          </label>
          {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id="personId"
            name="personId"
          >
            <option value="">-- Select Person --</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Optional: Select a person for this nomination
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> At least one of Work or Person must be selected. You can select
            both if the nomination involves both a work and a person.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            type="submit"
          >
            Create Nomination
          </button>
          <Link
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            href={`/admin/events/${eventId}/categories/${categoryId}`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
