import type { Category, Event, Game, Nomination, Person, Work } from "@prisma/client";
import { adminProcedure } from "@/lib/api/procedures";
import * as categoryModel from "@/lib/models/category";
import * as eventModel from "@/lib/models/event";
import * as gameModel from "@/lib/models/game";
import * as nominationModel from "@/lib/models/nomination";
import * as personModel from "@/lib/models/person";
import * as workModel from "@/lib/models/work";
import * as categoryService from "@/lib/services/category-service";
import * as eventService from "@/lib/services/event-service";
import * as gameService from "@/lib/services/game-service";
import * as wikipediaImportService from "@/lib/services/wikipedia-import-service";

/**
 * Admin Router - All operations require ADMIN role
 *
 * Layer boundaries:
 * - Router calls Services (preferred for business logic)
 * - Router calls Models (only for simple CRUD)
 * - NO direct Prisma imports
 *
 * All procedures use adminProcedure for role enforcement.
 */

// ============================================================================
// HELPER FUNCTIONS - Transformation and utilities
// ============================================================================

/**
 * Transform Event from Prisma to API response format
 * Extracts only the fields needed for the API response
 */
function transformEventToResponse(
  event: Event
): {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  eventDate: Date;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description,
    eventDate: event.eventDate,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

/**
 * Transform Category from Prisma to API response format
 */
function transformCategoryToResponse(
  category: Category
): {
  id: string;
  name: string;
  order: number;
  points: number;
  isRevealed: boolean;
  winnerNominationId: string | null;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: category.id,
    name: category.name,
    order: category.order,
    points: category.points,
    isRevealed: category.isRevealed,
    winnerNominationId: category.winnerNominationId,
    eventId: category.eventId,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

/**
 * Transform Nomination from Prisma to API response format
 */
function transformNominationToResponse(
  nomination: Nomination
): {
  id: string;
  nominationText: string;
  categoryId: string;
  workId: string | null;
  personId: string | null;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: nomination.id,
    nominationText: nomination.nominationText,
    categoryId: nomination.categoryId,
    workId: nomination.workId,
    personId: nomination.personId,
    createdAt: nomination.createdAt,
    updatedAt: nomination.updatedAt,
  };
}

/**
 * Transform Person from Prisma to API response format
 */
function transformPersonToResponse(
  person: Person
): {
  id: string;
  name: string;
  imageUrl: string | null;
  externalId: string | null;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: person.id,
    name: person.name,
    imageUrl: person.imageUrl,
    externalId: person.externalId,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };
}

/**
 * Transform Work from Prisma to API response format
 */
function transformWorkToResponse(
  work: Work
): {
  id: string;
  title: string;
  type: "FILM" | "TV_SHOW" | "SONG" | "ALBUM" | "BOOK" | "PLAY" | "OTHER";
  year: number | null;
  imageUrl: string | null;
  externalId: string | null;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: work.id,
    title: work.title,
    type: work.type,
    year: work.year,
    imageUrl: work.imageUrl,
    externalId: work.externalId,
    createdAt: work.createdAt,
    updatedAt: work.updatedAt,
  };
}

/**
 * Transform Game from Prisma to API response format
 */
function transformGameToResponse(
  game: Game
): {
  id: string;
  name: string;
  status: "SETUP" | "OPEN" | "LIVE" | "COMPLETED";
  accessCode: string;
  picksLockAt: Date | null;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: game.id,
    name: game.name,
    status: game.status,
    accessCode: game.accessCode,
    picksLockAt: game.picksLockAt,
    eventId: game.eventId,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

// ============================================================================
// ADMIN ROUTER IMPLEMENTATION
// ============================================================================

export const adminRouter = {
  // ============================================================================
  // EVENT PROCEDURES
  // ============================================================================

  listEvents: adminProcedure.handler(async () => {
    const events = await eventModel.findAllWithCategoryCounts();
    return events;
  }),

  createEvent: adminProcedure.handler(async ({ input }: { input: any }) => {
    const event = await eventService.createEvent(input);
    return transformEventToResponse(event);
  }),

  updateEvent: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { id, ...data } = input;
    const event = await eventService.updateEvent(id, data);
    return transformEventToResponse(event);
  }),

  deleteEvent: adminProcedure.handler(async ({ input }: { input: any }) => {
    await eventService.deleteEvent(input.id);
    return { success: true };
  }),

  // ============================================================================
  // CATEGORY PROCEDURES
  // ============================================================================

  createCategory: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { eventId, ...data } = input;
    const category = await categoryModel.create({
      ...data,
      event: { connect: { id: eventId } },
    });
    return transformCategoryToResponse(category);
  }),

  updateCategory: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { id, eventId, ...data } = input;

    // Build update data with event connection if provided
    const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;

    const category = await categoryModel.update(id, updateData);
    return transformCategoryToResponse(category);
  }),

  deleteCategory: adminProcedure.handler(async ({ input }: { input: any }) => {
    await categoryModel.deleteById(input.id);
    return { success: true };
  }),

  markWinner: adminProcedure.handler(async ({ input }: { input: any }) => {
    const category = await categoryService.markWinner(input.categoryId, input.nominationId);
    return transformCategoryToResponse(category);
  }),

  clearWinner: adminProcedure.handler(async ({ input }: { input: any }) => {
    const category = await categoryService.clearWinner(input.categoryId);
    return transformCategoryToResponse(category);
  }),

  // ============================================================================
  // NOMINATION PROCEDURES
  // ============================================================================

  createNomination: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { categoryId, workId, personId, ...data } = input;

    // Build the nomination data with proper Prisma relations
    const nominationData = {
      ...data,
      category: { connect: { id: categoryId } },
      ...(workId && { work: { connect: { id: workId } } }),
      ...(personId && { person: { connect: { id: personId } } }),
    };

    const nomination = await nominationModel.create(nominationData);
    return transformNominationToResponse(nomination);
  }),

  updateNomination: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { id, categoryId, workId, personId, ...data } = input;

    // Build update data with proper Prisma relations
    const updateData = {
      ...data,
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      ...(workId !== undefined && {
        work: workId ? { connect: { id: workId } } : { disconnect: true },
      }),
      ...(personId !== undefined && {
        person: personId ? { connect: { id: personId } } : { disconnect: true },
      }),
    };

    const nomination = await nominationModel.update(id, updateData);
    return transformNominationToResponse(nomination);
  }),

  deleteNomination: adminProcedure.handler(async ({ input }: { input: any }) => {
    await nominationModel.deleteById(input.id);
    return { success: true };
  }),

  // ============================================================================
  // PERSON PROCEDURES
  // ============================================================================

  listPeople: adminProcedure.handler(async () => {
    const people = await personModel.findAllWithCounts();
    return people;
  }),

  createPerson: adminProcedure.handler(async ({ input }: { input: any }) => {
    const person = await personModel.create(input);
    return transformPersonToResponse(person);
  }),

  updatePerson: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { id, ...data } = input;
    const person = await personModel.update(id, data);
    return transformPersonToResponse(person);
  }),

  deletePerson: adminProcedure.handler(async ({ input }: { input: any }) => {
    await personModel.deleteById(input.id);
    return { success: true };
  }),

  // ============================================================================
  // WORK PROCEDURES
  // ============================================================================

  listWorks: adminProcedure.handler(async () => {
    const works = await workModel.findAll();
    return works;
  }),

  createWork: adminProcedure.handler(async ({ input }: { input: any }) => {
    const work = await workModel.create(input);
    return transformWorkToResponse(work);
  }),

  updateWork: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { id, ...data } = input;
    const work = await workModel.update(id, data);
    return transformWorkToResponse(work);
  }),

  deleteWork: adminProcedure.handler(async ({ input }: { input: any }) => {
    await workModel.deleteById(input.id);
    return { success: true };
  }),

  // ============================================================================
  // GAME PROCEDURES
  // ============================================================================

  listGames: adminProcedure.handler(async () => {
    const games = await gameModel.findAll();
    return games;
  }),

  createGame: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { eventId, ...data } = input;
    const game = await gameService.createGame({
      ...data,
      event: { connect: { id: eventId } },
    });
    return transformGameToResponse(game);
  }),

  updateGame: adminProcedure.handler(async ({ input }: { input: any }) => {
    const { id, eventId, ...data } = input;

    // Build update data with event connection if provided
    const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;

    const game = await gameService.updateGame(id, updateData);
    return transformGameToResponse(game);
  }),

  updateGameStatus: adminProcedure.handler(async ({ input }: { input: any }) => {
    const game = await gameService.updateGameStatus(input.id, input.status);
    return transformGameToResponse(game);
  }),

  deleteGame: adminProcedure.handler(async ({ input }: { input: any }) => {
    await gameService.deleteGame(input.id);
    return { success: true };
  }),

  // ============================================================================
  // WIKIPEDIA IMPORT PROCEDURES
  // ============================================================================

  previewWikipediaImport: adminProcedure.handler(async ({ input }: { input: any }) => {
    const preview = await wikipediaImportService.previewImport(input.url);
    return preview;
  }),

  importFromWikipedia: adminProcedure.handler(async ({ input }: { input: any }) => {
    const result = await wikipediaImportService.commitImport(input.url);
    return result;
  }),
};
