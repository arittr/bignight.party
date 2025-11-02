import { implement } from "@orpc/server";
import { adminProcedure } from "@/lib/api/procedures";
import { adminContract } from "@/lib/api/contracts/admin";
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
 * Uses contract-first pattern with single implement() call
 * All procedures use adminProcedure for role enforcement
 *
 * Layer boundaries:
 * - Router calls Services (preferred for business logic)
 * - Router calls Models (only for simple CRUD)
 * - NO direct Prisma imports
 */

// ============================================================================
// ADMIN ROUTER IMPLEMENTATION WITH CONTRACT-FIRST PATTERN
// ============================================================================

// Single implement() call for the entire admin contract
const os = implement(adminContract);

// ============================================================================
// EVENT PROCEDURES
// ============================================================================

const listEvents = os.events.list.use(adminProcedure).handler(async () => {
  const events = await eventModel.findAllWithCategoryCounts();
  return events;
});

const createEvent = os.events.create.use(adminProcedure).handler(async ({ input }) => {
  const event = await eventService.createEvent(input);
  return event;
});

const updateEvent = os.events.update.use(adminProcedure).handler(async ({ input }) => {
  const { id, ...data } = input;
  const event = await eventService.updateEvent(id, data);
  return event;
});

const deleteEvent = os.events.delete.use(adminProcedure).handler(async ({ input }) => {
  await eventService.deleteEvent(input.id);
  return { success: true };
});

// ============================================================================
// CATEGORY PROCEDURES
// ============================================================================

const createCategory = os.categories.create.use(adminProcedure).handler(async ({ input }) => {
  const { eventId, ...data } = input;
  const category = await categoryModel.create({
    ...data,
    event: { connect: { id: eventId } },
  });
  return category;
});

const updateCategory = os.categories.update.use(adminProcedure).handler(async ({ input }) => {
  const { id, eventId, ...data } = input;

  // Build update data with event connection if provided
  const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;

  const category = await categoryModel.update(id, updateData);
  return category;
});

const deleteCategory = os.categories.delete.use(adminProcedure).handler(async ({ input }) => {
  await categoryModel.deleteById(input.id);
  return { success: true };
});

const markWinner = os.categories.markWinner.use(adminProcedure).handler(async ({ input }) => {
  const category = await categoryService.markWinner(input.categoryId, input.nominationId);
  return category;
});

const clearWinner = os.categories.clearWinner.use(adminProcedure).handler(async ({ input }) => {
  const category = await categoryService.clearWinner(input.categoryId);
  return category;
});

// ============================================================================
// NOMINATION PROCEDURES
// ============================================================================

const createNomination = os.nominations.create.use(adminProcedure).handler(async ({ input }) => {
  const { categoryId, workId, personId, ...data } = input;

  // Build the nomination data with proper Prisma relations
  const nominationData = {
    ...data,
    category: { connect: { id: categoryId } },
    ...(workId && { work: { connect: { id: workId } } }),
    ...(personId && { person: { connect: { id: personId } } }),
  };

  const nomination = await nominationModel.create(nominationData);
  return nomination;
});

const updateNomination = os.nominations.update.use(adminProcedure).handler(async ({ input }) => {
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
  return nomination;
});

const deleteNomination = os.nominations.delete.use(adminProcedure).handler(async ({ input }) => {
  await nominationModel.deleteById(input.id);
  return { success: true };
});

// ============================================================================
// PERSON PROCEDURES
// ============================================================================

const listPeople = os.people.list.use(adminProcedure).handler(async () => {
  const people = await personModel.findAllWithCounts();
  return people;
});

const createPerson = os.people.create.use(adminProcedure).handler(async ({ input }) => {
  const person = await personModel.create(input);
  return person;
});

const updatePerson = os.people.update.use(adminProcedure).handler(async ({ input }) => {
  const { id, ...data } = input;
  const person = await personModel.update(id, data);
  return person;
});

const deletePerson = os.people.delete.use(adminProcedure).handler(async ({ input }) => {
  await personModel.deleteById(input.id);
  return { success: true };
});

// ============================================================================
// WORK PROCEDURES
// ============================================================================

const listWorks = os.works.list.use(adminProcedure).handler(async () => {
  const works = await workModel.findAll();
  return works;
});

const createWork = os.works.create.use(adminProcedure).handler(async ({ input }) => {
  const work = await workModel.create(input);
  return work;
});

const updateWork = os.works.update.use(adminProcedure).handler(async ({ input }) => {
  const { id, ...data } = input;
  const work = await workModel.update(id, data);
  return work;
});

const deleteWork = os.works.delete.use(adminProcedure).handler(async ({ input }) => {
  await workModel.deleteById(input.id);
  return { success: true };
});

// ============================================================================
// GAME PROCEDURES
// ============================================================================

const listGames = os.games.list.use(adminProcedure).handler(async () => {
  const games = await gameModel.findAll();
  return games;
});

const createGame = os.games.create.use(adminProcedure).handler(async ({ input }) => {
  const { eventId, ...data } = input;
  const game = await gameService.createGame({
    ...data,
    event: { connect: { id: eventId } },
  });
  return game;
});

const updateGame = os.games.update.use(adminProcedure).handler(async ({ input }) => {
  const { id, eventId, ...data } = input;

  // Build update data with event connection if provided
  const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;

  const game = await gameService.updateGame(id, updateData);
  return game;
});

const updateGameStatus = os.games.updateStatus.use(adminProcedure).handler(async ({ input }) => {
  const game = await gameService.updateGameStatus(input.id, input.status);
  return game;
});

const deleteGame = os.games.delete.use(adminProcedure).handler(async ({ input }) => {
  await gameService.deleteGame(input.id);
  return { success: true };
});

// ============================================================================
// WIKIPEDIA IMPORT PROCEDURES
// ============================================================================

const previewWikipediaImport = os.wikipedia.previewImport
  .use(adminProcedure)
  .handler(async ({ input }) => {
    const preview = await wikipediaImportService.previewImport(input.url);
    return preview;
  });

const importFromWikipedia = os.wikipedia.import.use(adminProcedure).handler(async ({ input }) => {
  const result = await wikipediaImportService.commitImport(input.url);
  return result;
});

// ============================================================================
// ADMIN ROUTER - NESTED STRUCTURE MATCHING CONTRACT
// ============================================================================

export const adminRouter = os.router({
  events: {
    list: listEvents,
    create: createEvent,
    update: updateEvent,
    delete: deleteEvent,
  },
  categories: {
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
    markWinner: markWinner,
    clearWinner: clearWinner,
  },
  nominations: {
    create: createNomination,
    update: updateNomination,
    delete: deleteNomination,
  },
  people: {
    list: listPeople,
    create: createPerson,
    update: updatePerson,
    delete: deletePerson,
  },
  works: {
    list: listWorks,
    create: createWork,
    update: updateWork,
    delete: deleteWork,
  },
  games: {
    list: listGames,
    create: createGame,
    update: updateGame,
    updateStatus: updateGameStatus,
    delete: deleteGame,
  },
  wikipedia: {
    previewImport: previewWikipediaImport,
    import: importFromWikipedia,
  },
});
