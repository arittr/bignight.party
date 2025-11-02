import Link from "next/link";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/api/server-client";
import * as eventModel from "@/lib/models/event";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewCategoryPage(props: Props) {
  const params = await props.params;
  const event = await eventModel.findById(params.id);

  if (!event) {
    redirect("/admin/events");
  }

  async function handleCreate(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const order = Number.parseInt(formData.get("order") as string, 10);
    const points = Number.parseInt(formData.get("points") as string, 10);
    const isRevealed = formData.get("isRevealed") === "on";

    await serverClient.admin.categories.create({
      eventId: params.id,
      isRevealed,
      name,
      order,
      points,
    });

    redirect(`/admin/events/${params.id}`);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link className="text-blue-600 hover:underline text-sm" href={`/admin/events/${params.id}`}>
          ← Back to {event.name}
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Category</h1>

      <form action={handleCreate} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
            Category Name
          </label>
          {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="name"
            name="name"
            placeholder="e.g., Best Picture, Best Director"
            required
            type="text"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="order">
              Display Order
            </label>
            {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="0"
              id="order"
              min="0"
              name="order"
              required
              type="number"
            />
            <p className="mt-1 text-sm text-gray-500">Order in which this category appears</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="points">
              Points
            </label>
            {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="1"
              id="points"
              min="1"
              name="points"
              required
              type="number"
            />
            <p className="mt-1 text-sm text-gray-500">Points awarded for correct pick</p>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            {/* biome-ignore lint/correctness/useUniqueElementIds: Single-use admin form, static IDs are safe */}
            <input className="rounded" id="isRevealed" name="isRevealed" type="checkbox" />
            <span className="text-sm font-medium text-gray-700">Is Revealed</span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            Check if this category's winner has been revealed
          </p>
        </div>

        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            type="submit"
          >
            Create Category
          </button>
          <Link
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            href={`/admin/events/${params.id}`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
