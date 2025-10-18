import { redirect } from "next/navigation";
import Link from "next/link";
import * as eventModel from "@/lib/models/event";
import { createCategoryAction } from "@/lib/actions/admin-actions";

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

    const result = await createCategoryAction({
      eventId: params.id,
      name,
      order,
      points,
      isRevealed,
    });

    if (result?.data) {
      redirect(`/admin/events/${params.id}`);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/events/${params.id}`} className="text-blue-600 hover:underline text-sm">
          ← Back to {event.name}
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Category</h1>

      <form action={handleCreate} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Category Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Best Picture, Best Director"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              id="order"
              name="order"
              required
              min="0"
              defaultValue="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Order in which this category appears</p>
          </div>

          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              id="points"
              name="points"
              required
              min="1"
              defaultValue="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Points awarded for correct pick</p>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" id="isRevealed" name="isRevealed" className="rounded" />
            <span className="text-sm font-medium text-gray-700">Is Revealed</span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            Check if this category's winner has been revealed
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Category
          </button>
          <Link
            href={`/admin/events/${params.id}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
