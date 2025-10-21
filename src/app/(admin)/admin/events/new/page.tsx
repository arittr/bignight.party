import Link from "next/link";
import { redirect } from "next/navigation";
import { createEventAction } from "@/lib/actions/admin-actions";

export default function NewEventPage() {
  async function handleCreateEvent(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const eventDate = formData.get("eventDate") as string;

    const result = await createEventAction({
      description: description || undefined,
      eventDate: new Date(eventDate),
      name,
      slug,
    });

    if (result?.data?.id) {
      redirect(`/admin/events/${result.data.id}`);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link className="text-blue-600 hover:text-blue-900" href="/admin/events">
          &larr; Back to Events
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Event</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={handleCreateEvent}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="name">
                Event Name
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                id="name"
                name="name"
                required
                type="text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="slug">
                Slug
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                id="slug"
                name="slug"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="oscars-2025"
                required
                type="text"
              />
              <p className="mt-1 text-sm text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="eventDate">
                Event Date
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <input
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                id="eventDate"
                name="eventDate"
                required
                type="date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="description">
                Description (Optional)
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                id="description"
                name="description"
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                type="submit"
              >
                Create Event
              </button>
              <Link
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                href="/admin/events"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
