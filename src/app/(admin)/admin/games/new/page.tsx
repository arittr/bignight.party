import Link from "next/link";
import { redirect } from "next/navigation";
import { createGameAction } from "@/lib/actions/admin-actions";
import * as eventModel from "@/lib/models/event";

export default async function NewGamePage() {
  const events = await eventModel.findAll();

  async function handleCreateGame(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const eventId = formData.get("eventId") as string;
    const accessCode = formData.get("accessCode") as string;
    const picksLockAt = formData.get("picksLockAt") as string;

    const result = await createGameAction({
      name,
      eventId,
      accessCode,
      picksLockAt: picksLockAt ? new Date(picksLockAt) : undefined,
    });

    if (result?.data) {
      redirect("/admin/games");
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/games" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Games
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Game</h1>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <form action={handleCreateGame} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Friends & Family Game"
            />
          </div>

          <div>
            <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-1">
              Event *
            </label>
            <select
              id="eventId"
              name="eventId"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
              Access Code *
            </label>
            <input
              type="text"
              id="accessCode"
              name="accessCode"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="OSCARS2025"
              pattern="[A-Z0-9]+"
              title="Access code must be uppercase letters and numbers only"
            />
            <p className="mt-1 text-sm text-gray-500">Uppercase letters and numbers only</p>
          </div>

          <div>
            <label htmlFor="picksLockAt" className="block text-sm font-medium text-gray-700 mb-1">
              Picks Lock At
            </label>
            <input
              type="datetime-local"
              id="picksLockAt"
              name="picksLockAt"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              When should users no longer be able to make picks? Leave empty for no deadline.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Game
            </button>
            <Link
              href="/admin/games"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
