import { implement } from "@orpc/server";
import { adminProcedure } from "@/lib/api/procedures";
import {
  clearWinnerContract,
  createCategoryContract,
  createEventContract,
  createGameContract,
  createNominationContract,
  createPersonContract,
  createWorkContract,
  deleteCategoryContract,
  deleteEventContract,
  deleteGameContract,
  deleteNominationContract,
  deletePersonContract,
  deleteWorkContract,
  importFromWikipediaContract,
  listEventsContract,
  listGamesContract,
  listPeopleContract,
  listWorksContract,
  markWinnerContract,
  previewWikipediaImportContract,
  updateCategoryContract,
  updateEventContract,
  updateGameContract,
  updateGameStatusContract,
  updateNominationContract,
  updatePersonContract,
  updateWorkContract,
} from "@/lib/api/contracts/admin";
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
 * Uses contract-first pattern with individual contracts
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

// ============================================================================
// CONTRACT BUILDERS - One per contract for proper type inference
// ============================================================================

const listEventsBuilder = implement(listEventsContract);
const createEventBuilder = implement(createEventContract);
const updateEventBuilder = implement(updateEventContract);
const deleteEventBuilder = implement(deleteEventContract);

const createCategoryBuilder = implement(createCategoryContract);
const updateCategoryBuilder = implement(updateCategoryContract);
const deleteCategoryBuilder = implement(deleteCategoryContract);
const markWinnerBuilder = implement(markWinnerContract);
const clearWinnerBuilder = implement(clearWinnerContract);

const createNominationBuilder = implement(createNominationContract);
const updateNominationBuilder = implement(updateNominationContract);
const deleteNominationBuilder = implement(deleteNominationContract);

const listPeopleBuilder = implement(listPeopleContract);
const createPersonBuilder = implement(createPersonContract);
const updatePersonBuilder = implement(updatePersonContract);
const deletePersonBuilder = implement(deletePersonContract);

const listWorksBuilder = implement(listWorksContract);
const createWorkBuilder = implement(createWorkContract);
const updateWorkBuilder = implement(updateWorkContract);
const deleteWorkBuilder = implement(deleteWorkContract);

const listGamesBuilder = implement(listGamesContract);
const createGameBuilder = implement(createGameContract);
const updateGameBuilder = implement(updateGameContract);
const updateGameStatusBuilder = implement(updateGameStatusContract);
const deleteGameBuilder = implement(deleteGameContract);

const previewWikipediaImportBuilder = implement(previewWikipediaImportContract);
const importFromWikipediaBuilder = implement(importFromWikipediaContract);

export const adminRouter = {
  // ============================================================================
  // EVENT PROCEDURES
  // ============================================================================

  listEvents: listEventsBuilder.use(adminProcedure).handler(async () => {
    const events = await eventModel.findAllWithCategoryCounts();
    return events;
  }),

  createEvent: createEventBuilder.use(adminProcedure).handler(async ({ input }) => {
    const event = await eventService.createEvent(input);
    return event;
  }),

  updateEvent: updateEventBuilder.use(adminProcedure).handler(async ({ input }) => {
    const { id, ...data } = input;
    const event = await eventService.updateEvent(id, data);
    return event;
  }),

  deleteEvent: deleteEventBuilder.use(adminProcedure).handler(async ({ input }) => {
    await eventService.deleteEvent(input.id);
    return { success: true };
  }),

  // ============================================================================
  // CATEGORY PROCEDURES
  // ============================================================================

  createCategory: createCategoryBuilder.use(adminProcedure).handler(async ({ input }) => {
    const { eventId, ...data } = input;
    const category = await categoryModel.create({
      ...data,
      event: { connect: { id: eventId } },
    });
    return category;
  }),

  updateCategory: updateCategoryBuilder.use(adminProcedure).handler(async ({ input }) => {
    const { id, eventId, ...data } = input;

    // Build update data with event connection if provided
    const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;

    const category = await categoryModel.update(id, updateData);
    return category;
  }),

  deleteCategory: deleteCategoryBuilder.use(adminProcedure).handler(async ({ input }) => {
    await categoryModel.deleteById(input.id);
    return { success: true };
  }),

  markWinner: markWinnerBuilder.use(adminProcedure).handler(async ({ input }) => {
    const category = await categoryService.markWinner(input.categoryId, input.nominationId);
    return category;
  }),

  clearWinner: clearWinnerBuilder.use(adminProcedure).handler(async ({ input }) => {
    const category = await categoryService.clearWinner(input.categoryId);
    return category;
  }),

  // ============================================================================
  // NOMINATION PROCEDURES
  // ============================================================================

  createNomination: createNominationBuilder.use(adminProcedure).handler(async ({ input }) => {
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
  }),

  updateNomination: updateNominationBuilder.use(adminProcedure).handler(async ({ input }) => {
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
  }),

  deleteNomination: deleteNominationBuilder.use(adminProcedure).handler(async ({ input }) => {
    await nominationModel.deleteById(input.id);
    return { success: true };
  }),

  // ============================================================================
  // PERSON PROCEDURES
  // ============================================================================

  listPeople: listPeopleBuilder.use(adminProcedure).handler(async () => {
    const people = await personModel.findAllWithCounts();
    return people;
  }),

  createPerson: createPersonBuilder.use(adminProcedure).handler(async ({ input }) => {
    const person = await personModel.create(input);
    return person;
  }),

  updatePerson: updatePersonBuilder.use(adminProcedure).handler(async ({ input }) => {
    const { id, ...data } = input;
    const person = await personModel.update(id, data);
    return person;
  }),

  deletePerson: deletePersonBuilder.use(adminProcedure).handler(async ({ input }) => {
    await personModel.deleteById(input.id);
    return { success: true };
  }),

  // ============================================================================
  // WORK PROCEDURES
  // ============================================================================

  listWorks: listWorksBuilder.use(adminProcedure).handler(async () => {
    const works = await workModel.findAll();
    return works;
  }),

  createWork: createWorkBuilder.use(adminProcedure).handler(async ({ input }) => {
    const work = await workModel.create(input);
    return work;
  }),

  updateWork: updateWorkBuilder.use(adminProcedure).handler(async ({ input }) => {
    const { id, ...data } = input;
    const work = await workModel.update(id, data);
    return work;
  }),

  deleteWork: deleteWorkBuilder.use(adminProcedure).handler(async ({ input }) => {
    await workModel.deleteById(input.id);
    return { success: true };
  }),

  // ============================================================================
  // GAME PROCEDURES
  // ============================================================================

  listGames: listGamesBuilder.use(adminProcedure).handler(async () => {
    const games = await gameModel.findAll();
    return games;
  }),

  createGame: createGameBuilder.use(adminProcedure).handler(async ({ input }) => {
    const { eventId, ...data } = input;
    const game = await gameService.createGame({
      ...data,
      event: { connect: { id: eventId } },
    });
    return game;
  }),

  updateGame: updateGameBuilder.use(adminProcedure).handler(async ({ input }) => {
    const { id, eventId, ...data } = input;

    // Build update data with event connection if provided
    const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;

    const game = await gameService.updateGame(id, updateData);
    return game;
  }),

  updateGameStatus: updateGameStatusBuilder.use(adminProcedure).handler(async ({ input }) => {
    const game = await gameService.updateGameStatus(input.id, input.status);
    return game;
  }),

  deleteGame: deleteGameBuilder.use(adminProcedure).handler(async ({ input }) => {
    await gameService.deleteGame(input.id);
    return { success: true };
  }),

  // ============================================================================
  // WIKIPEDIA IMPORT PROCEDURES
  // ============================================================================

  previewWikipediaImport: previewWikipediaImportBuilder
    .use(adminProcedure)
    .handler(async ({ input }) => {
      const preview = await wikipediaImportService.previewImport(input.url);
      return preview;
    }),

  importFromWikipedia: importFromWikipediaBuilder
    .use(adminProcedure)
    .handler(async ({ input }) => {
      const result = await wikipediaImportService.commitImport(input.url);
      return result;
    }),
};
