import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteEventAction, updateEventAction } from "@/lib/actions/admin-actions";
import { requireValidatedSession } from "@/lib/auth/config";
import * as eventModel from "@/lib/models/event";
import { routes } from "@/lib/routes";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  await requireValidatedSession();

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
      description: description || undefined,
      eventDate: new Date(eventDate),
      id: params.id,
      name,
      slug,
    });
  }

  async function handleDeleteEvent() {
    "use server";

    await deleteEventAction({ id: params.id });
    redirect(routes.admin.events.index());
  }

  return (
    <div>
      <div className="mb-6">
        <Link className="text-blue-600 hover:text-blue-900" href={routes.admin.events.index()}>
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
                  <label className="block text-sm font-medium text-gray-700" htmlFor="name">
                    Event Name
                  </label>
                  {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    defaultValue={event.name}
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
                    defaultValue={event.slug}
                    id="slug"
                    name="slug"
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
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
                    defaultValue={new Date(event.eventDate).toISOString().split("T")[0]}
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
                    defaultValue={event.description || ""}
                    id="description"
                    name="description"
                    rows={4}
                  />
                </div>

                <div className="pt-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    type="submit"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>

            <form action={handleDeleteEvent} className="mt-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                type="submit"
              >
                Delete Event
              </button>
            </form>
          </div>
        </div>

        {/* Categories Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
              <Link
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                href={routes.admin.events.categories.new(event.id)}
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
                        className="block p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                        href={routes.admin.events.categories.detail(event.id, category.id)}
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
                      className="block p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                      href={routes.admin.games.detail(game.id)}
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
