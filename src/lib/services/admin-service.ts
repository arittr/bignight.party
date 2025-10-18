import * as categoryModel from "@/lib/models/category";
import * as eventModel from "@/lib/models/event";
import * as gameModel from "@/lib/models/game";
import * as nominationModel from "@/lib/models/nomination";
import * as personModel from "@/lib/models/person";
import * as workModel from "@/lib/models/work";

/**
 * Validate that a user has admin access
 * This is a placeholder - actual auth validation happens in middleware
 */
export async function validateAdminAccess(_userId: string): Promise<boolean> {
  // In a real implementation, this would check the user's role
  // For now, we rely on the middleware in safe-action.ts
  return true;
}

/**
 * Get statistics for the admin dashboard
 */
export async function getAdminDashboardStats() {
  const [events, games, categories, works, people, nominations] = await Promise.all([
    eventModel.findAll(),
    gameModel.findAll(),
    categoryModel.findAll(),
    workModel.findAll(),
    personModel.findAll(),
    nominationModel.findAll(),
  ]);

  return {
    categoryCount: categories.length,
    eventCount: events.length,
    gameCount: games.length,
    nominationCount: nominations.length,
    personCount: people.length,
    recentEvents: events.slice(0, 5),
    recentGames: games.slice(0, 5),
    workCount: works.length,
  };
}
