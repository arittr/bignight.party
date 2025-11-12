import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { NominationWithPickCount } from "@/components/admin/games/live-category-card";
import { LiveCategoryCard } from "@/components/admin/games/live-category-card";
import { requireValidatedSession } from "@/lib/auth/config";
import * as categoryModel from "@/lib/models/category";
import * as gameModel from "@/lib/models/game";
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

  // Fetch categories with nominations included (single query)
  const categories = await categoryModel.findByEventId(game.eventId);

  // Fetch all pick counts for the game in ONE query
  const pickCounts = await pickModel.getPickCountsForGame(id);

  // Build pick count map for O(1) lookup
  const pickCountMap = new Map(
    pickCounts.map((pc) => [`${pc.categoryId}:${pc.nominationId}`, pc.count])
  );

  // Transform data without additional queries
  const categoriesWithData = categories.map((category) => {
    // Use nominations already included in category
    const nominationsWithPickCounts: NominationWithPickCount[] = category.nominations.map(
      (nom) => ({
        id: nom.id,
        nominationText: nom.nominationText,
        pickCount: pickCountMap.get(`${category.id}:${nom.id}`) ?? 0,
      })
    );

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
  });

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
            <LiveCategoryCard
              category={category}
              gameId={id}
              key={category.id}
              nominations={nominations}
            />
          ))}
        </div>
      )}
    </div>
  );
}
