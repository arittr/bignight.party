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
      name,
      slug,
      description: description || undefined,
      eventDate: new Date(eventDate),
    });

    if (result?.data?.id) {
      redirect(`/admin/events/${result.data.id}`);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/events" className="text-blue-600 hover:text-blue-900">
          &larr; Back to Events
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Event</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={handleCreateEvent}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Event Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                id="slug"
                required
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="oscars-2025"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
                Event Date
              </label>
              <input
                type="date"
                name="eventDate"
                id="eventDate"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Event
              </button>
              <Link
                href="/admin/events"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
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
