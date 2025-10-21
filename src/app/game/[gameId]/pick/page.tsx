import { requireValidatedSession } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import * as gameParticipantModel from "@/lib/models/game-participant";
import * as gameModel from "@/lib/models/game";
import * as categoryModel from "@/lib/models/category";
import * as nominationModel from "@/lib/models/nomination";
import * as pickModel from "@/lib/models/pick";
import { PickWizard } from "@/components/pick-wizard";

interface PickWizardPageProps {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function PickWizardPage({ params, searchParams }: PickWizardPageProps) {
  const { gameId } = await params;
  const { category } = await searchParams;

  // Require authenticated user with validated database record
  const session = await requireValidatedSession();

  // Verify user is participant
  const isMember = await gameParticipantModel.exists(session.user.id, gameId);
  if (!isMember) {
    redirect("/dashboard");
  }

  // Fetch game data
  const game = await gameModel.findById(gameId);
  if (!game) {
    redirect("/dashboard");
  }

  // Fetch categories for this event (ordered by category.order)
  const categories = await categoryModel.getCategoriesByEventId(game.eventId);

  // Get current category (from query param or first category)
  const currentCategoryId = category || categories[0]?.id;

  // Fetch nominations for current category
  const nominations = currentCategoryId
    ? await nominationModel.getNominationsByCategoryId(currentCategoryId)
    : [];

  // Fetch existing picks for this user in this game
  const existingPicks = await pickModel.getPicksByGameAndUser(gameId, session.user.id);

  // Check if game is locked (status is not OPEN)
  const isLocked = game.status !== "OPEN";

  // Calculate time until picks lock (for warning banner)
  const picksLockAt = game.picksLockAt;
  const now = new Date();
  const minutesUntilLock = picksLockAt
    ? Math.floor((picksLockAt.getTime() - now.getTime()) / (1000 * 60))
    : null;
  const showLockWarning =
    minutesUntilLock !== null && minutesUntilLock > 0 && minutesUntilLock <= 30;

  return (
    <PickWizard
      gameId={gameId}
      gameName={game.name}
      categories={categories}
      currentCategoryId={currentCategoryId}
      nominations={nominations}
      existingPicks={existingPicks}
      isLocked={isLocked}
      showLockWarning={showLockWarning}
      minutesUntilLock={minutesUntilLock}
    />
  );
}
