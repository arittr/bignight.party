import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteEventAction, updateEventAction } from "@/lib/actions/admin-actions";
import * as eventModel from "@/lib/models/event";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await eventModel.findById(params.id);

  if (!event) {
    notFound();
  }

  async function handleUpdateEvent(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const eventDate = formData.get("eventDate") as string;

    await updateEventAction({
      id: params.id,
      name,
      slug,
      description: description || undefined,
      eventDate: new Date(eventDate),
    });
  }

  async function handleDeleteEvent() {
    "use server";

    await deleteEventAction({ id: params.id });
    redirect("/admin/events");
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/events" className="text-blue-600 hover:text-blue-900">
          &larr; Back to Events
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Event</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <form action={handleUpdateEvent}>
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
                    defaultValue={event.name}
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
                    defaultValue={event.slug}
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
                    defaultValue={new Date(event.eventDate).toISOString().split("T")[0]}
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
                    defaultValue={event.description || ""}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <form action={handleDeleteEvent}>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete Event
                    </button>
                  </form>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Categories Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
              <Link
                href={`/admin/events/${event.id}/categories/new`}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add Category
              </Link>
            </div>

            {event.categories.length === 0 ? (
              <p className="text-sm text-gray-500">No categories yet</p>
            ) : (
              <ul className="space-y-2">
                {event.categories
                  .sort((a, b) => a.order - b.order)
                  .map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/admin/events/${event.id}/categories/${category.id}`}
                        className="block p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          {category.points} points • Order: {category.order}
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Games Sidebar */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Games</h2>

            {event.games.length === 0 ? (
              <p className="text-sm text-gray-500">No games yet</p>
            ) : (
              <ul className="space-y-2">
                {event.games.map((game) => (
                  <li key={game.id}>
                    <Link
                      href={`/admin/games/${game.id}`}
                      className="block p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{game.name}</div>
                      <div className="text-sm text-gray-500">
                        Status: {game.status} • Code: {game.accessCode}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
