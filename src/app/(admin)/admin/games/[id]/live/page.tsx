import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { NominationWithPickCount } from "@/components/admin/games/category-card";
import { CategoryCard } from "@/components/admin/games/category-card";
import { requireValidatedSession } from "@/lib/auth/config";
import * as categoryModel from "@/lib/models/category";
import * as gameModel from "@/lib/models/game";
import * as nominationModel from "@/lib/models/nomination";
import * as pickModel from "@/lib/models/pick";
import { routes } from "@/lib/routes";

interface LivePageProps {
  params: Promise<{ id: string }>;
}

export default async function LivePage({ params }: LivePageProps) {
  // Authenticate and validate ADMIN role
  const session = await requireValidatedSession();

  if (session.user.role !== "ADMIN") {
    redirect(routes.dashboard());
  }

  // Await params (Next.js 15 requirement)
  const { id } = await params;

  // Fetch game with event
  const game = await gameModel.findById(id);

  if (!game) {
    notFound();
  }

  // Fetch categories for this game's event (ordered by order field)
  const categories = await categoryModel.findByEventId(game.eventId);

  // For each category, fetch nominations and pick counts
  const categoriesWithData = await Promise.all(
    categories.map(async (category) => {
      // Fetch nominations for this category
      const nominations = await nominationModel.findByCategoryId(category.id);

      // Fetch pick counts for this category in this game
      const pickCounts = await pickModel.getPickCountsByCategory(id, category.id);

      // Create a map of nominationId -> pickCount
      const pickCountMap = new Map(pickCounts.map((pc) => [pc.nominationId, pc.count]));

      // Merge nominations with pick counts
      const nominationsWithPickCounts: NominationWithPickCount[] = nominations.map((nom) => ({
        id: nom.id,
        nominationText: nom.nominationText,
        pickCount: pickCountMap.get(nom.id) ?? 0,
      }));

      return {
        category: {
          id: category.id,
          isRevealed: category.isRevealed,
          name: category.name,
          points: category.points,
          winnerNominationId: category.winnerNominationId,
        },
        nominations: nominationsWithPickCounts,
      };
    })
  );

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link className="text-blue-600 hover:text-blue-800" href={routes.admin.games.detail(id)}>
          &larr; Back to Game
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Live Winner Marking</h1>
        <p className="text-gray-600 mt-2">
          {game.name} - {game.event.name}
        </p>
      </div>

      {/* Categories List */}
      {categoriesWithData.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            No categories found for this event. Please add categories to the event first.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoriesWithData.map(({ category, nominations }) => (
            <CategoryCard category={category} key={category.id} nominations={nominations} />
          ))}
        </div>
      )}
    </div>
  );
}
