import { redirect } from "next/navigation";
import Link from "next/link";
import * as categoryModel from "@/lib/models/category";
import * as nominationModel from "@/lib/models/nomination";
import {
  updateCategoryAction,
  deleteCategoryAction,
  deleteNominationAction,
} from "@/lib/actions/admin-actions";

type Props = {
  params: Promise<{ id: string; categoryId: string }>;
};

export default async function CategoryDetailPage(props: Props) {
  const params = await props.params;
  const category = await categoryModel.findById(params.categoryId);
  const nominations = await nominationModel.findByCategoryId(params.categoryId);

  if (!category) {
    redirect(`/admin/events/${params.id}`);
  }

  // Find the winner nomination if set
  const winner = category.winnerNominationId
    ? nominations.find((n) => n.id === category.winnerNominationId)
    : null;

  async function handleUpdate(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const order = Number.parseInt(formData.get("order") as string, 10);
    const points = Number.parseInt(formData.get("points") as string, 10);
    const isRevealed = formData.get("isRevealed") === "on";

    await updateCategoryAction({
      id: params.categoryId,
      name,
      order,
      points,
      isRevealed,
    });
  }

  async function handleDelete() {
    "use server";

    await deleteCategoryAction({ id: params.categoryId });
    redirect(`/admin/events/${params.id}`);
  }

  async function handleDeleteNomination(nominationId: string) {
    "use server";

    await deleteNominationAction({ id: nominationId });
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href={`/admin/events/${params.id}`} className="text-blue-600 hover:underline text-sm">
          ← Back to {category.event.name}
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">Edit Category</h1>
        <form action={handleDelete}>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Category
          </button>
        </form>
      </div>

      {/* Edit Form */}
      <form action={handleUpdate} className="space-y-6 bg-white p-6 rounded-lg shadow mb-8">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Category Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={category.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              defaultValue={category.order}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              defaultValue={category.points}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRevealed"
              name="isRevealed"
              defaultChecked={category.isRevealed}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Is Revealed</span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            Check if this category's winner has been revealed
          </p>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Update Category
        </button>
      </form>

      {/* Winner Display */}
      {winner && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-green-900 mb-2">Winner</h2>
          <p className="text-green-800">{winner.nominationText}</p>
          {winner.work && <p className="text-sm text-green-600 mt-1">Work: {winner.work.title}</p>}
          {winner.person && (
            <p className="text-sm text-green-600 mt-1">Person: {winner.person.name}</p>
          )}
        </div>
      )}

      {/* Nominations List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Nominations ({nominations.length})</h2>
          <Link
            href={`/admin/events/${params.id}/categories/${params.categoryId}/nominations/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Nomination
          </Link>
        </div>

        {nominations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No nominations yet. Add one to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {nominations.map((nomination) => (
              <div key={nomination.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{nomination.nominationText}</p>
                    <div className="mt-2 space-y-1">
                      {nomination.work && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Work:</span> {nomination.work.title} (
                          {nomination.work.type})
                        </p>
                      )}
                      {nomination.person && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Person:</span> {nomination.person.name}
                        </p>
                      )}
                    </div>
                    {nomination.id === category.winnerNominationId && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        WINNER
                      </span>
                    )}
                  </div>
                  <form action={handleDeleteNomination.bind(null, nomination.id)}>
                    <button
                      type="submit"
                      className="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
