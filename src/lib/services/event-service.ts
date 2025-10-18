import type { Prisma } from "@prisma/client";
import * as categoryModel from "@/lib/models/category";
import * as eventModel from "@/lib/models/event";
import * as gameModel from "@/lib/models/game";

/**
 * Create a new event
 */
export async function createEvent(data: Prisma.EventCreateInput) {
  return eventModel.create(data);
}

/**
 * Update an existing event
 */
export async function updateEvent(id: string, data: Prisma.EventUpdateInput) {
  return eventModel.update(id, data);
}

/**
 * Delete an event and cascade to related categories and games
 */
export async function deleteEvent(id: string) {
  // Fetch the event with related data
  const event = await eventModel.findById(id);

  if (!event) {
    throw new Error(`Event with id ${id} not found`);
  }

  // Delete all categories associated with this event
  // (This will also cascade to nominations via Prisma schema)
  for (const category of event.categories) {
    await categoryModel.deleteById(category.id);
  }

  // Delete all games associated with this event
  // (This will also cascade to picks via Prisma schema)
  for (const game of event.games) {
    await gameModel.deleteById(game.id);
  }

  // Finally, delete the event itself
  return eventModel.deleteById(id);
}
