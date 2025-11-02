import Link from "next/link";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/api/server-client";
import * as eventModel from "@/lib/models/event";

export default async function NewGamePage() {
  const events = await eventModel.findAll();

  async function handleCreateGame(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const eventId = formData.get("eventId") as string;
    const accessCode = formData.get("accessCode") as string;
    const picksLockAt = formData.get("picksLockAt") as string;

    await serverClient.admin.games.create({
      accessCode,
      eventId,
      name,
      picksLockAt: picksLockAt ? new Date(picksLockAt) : undefined,
    });

    redirect("/admin/games");
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link className="text-blue-600 hover:text-blue-800" href="/admin/games">
          &larr; Back to Games
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Game</h1>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <form action={handleCreateGame} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Name *
            </label>
            {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="name"
              name="name"
              placeholder="Friends & Family Game"
              required
              type="text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="eventId">
              Event *
            </label>
            {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="eventId"
              name="eventId"
              required
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({new Date(event.eventDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="accessCode">
              Access Code *
            </label>
            {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              id="accessCode"
              name="accessCode"
              pattern="[A-Z0-9]+"
              placeholder="OSCARS2025"
              required
              title="Access code must be uppercase letters and numbers only"
              type="text"
            />
            <p className="mt-1 text-sm text-gray-500">Uppercase letters and numbers only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="picksLockAt">
              Picks Lock At
            </label>
            {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="picksLockAt"
              name="picksLockAt"
              type="datetime-local"
            />
            <p className="mt-1 text-sm text-gray-500">
              When should users no longer be able to make picks? Leave empty for no deadline.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
            >
              Create Game
            </button>
            <Link
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              href="/admin/games"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
