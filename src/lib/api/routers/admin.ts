import { implement } from "@orpc/server";
import { adminMiddleware } from "@/lib/api/procedures";
import { adminContract } from "@/lib/api/contracts/admin";
import { parseOptionalDate } from "@/lib/api/utils/wire-to-domain";
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
// ADMIN ROUTER - NESTED STRUCTURE MATCHING CONTRACT
// ============================================================================

export const adminRouter = os.router({
  events: {
    list: os.events.list.use(adminMiddleware).handler(async () => {
      const events = await eventModel.findAllWithCategoryCounts();
      return events;
    }),
    create: os.events.create.use(adminMiddleware).handler(async ({ input }) => {
      const event = await eventService.createEvent(input);
      return event;
    }),
    update: os.events.update.use(adminMiddleware).handler(async ({ input }) => {
      const { id, ...data } = input;
      const event = await eventService.updateEvent(id, data);
      return event;
    }),
    delete: os.events.delete.use(adminMiddleware).handler(async ({ input }) => {
      await eventService.deleteEvent(input.id);
      return { success: true };
    }),
  },
  categories: {
    create: os.categories.create.use(adminMiddleware).handler(async ({ input }) => {
      const { eventId, isRevealed = false, points = 1, ...data } = input;
      const category = await categoryModel.create({
        ...data,
        isRevealed,
        points,
        event: { connect: { id: eventId } },
      });
      return category;
    }),
    update: os.categories.update.use(adminMiddleware).handler(async ({ input }) => {
      const { id, eventId, ...data } = input;
    
      // Build update data with event connection if provided
      const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;
    
      const category = await categoryModel.update(id, updateData);
      return category;
    }),
    delete: os.categories.delete.use(adminMiddleware).handler(async ({ input }) => {
      await categoryModel.deleteById(input.id);
      return { success: true };
    }),
    markWinner: os.categories.markWinner.use(adminMiddleware).handler(async ({ input }) => {
      const category = await categoryService.markWinner(input.categoryId, input.nominationId);
      return category;
    }),
    clearWinner: os.categories.clearWinner.use(adminMiddleware).handler(async ({ input }) => {
      const category = await categoryService.clearWinner(input.categoryId);
      return category;
    }),
  },
  nominations: {
    create: os.nominations.create.use(adminMiddleware).handler(async ({ input }) => {
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
    update: os.nominations.update.use(adminMiddleware).handler(async ({ input }) => {
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
    delete: os.nominations.delete.use(adminMiddleware).handler(async ({ input }) => {
      await nominationModel.deleteById(input.id);
      return { success: true };
    }),
  },
  people: {
    list: os.people.list.use(adminMiddleware).handler(async () => {
      const people = await personModel.findAllWithCounts();
      return people;
    }),
    create: os.people.create.use(adminMiddleware).handler(async ({ input }) => {
      const person = await personModel.create(input);
      return person;
    }),
    update: os.people.update.use(adminMiddleware).handler(async ({ input }) => {
      const { id, ...data } = input;
      const person = await personModel.update(id, data);
      return person;
    }),
    delete: os.people.delete.use(adminMiddleware).handler(async ({ input }) => {
      await personModel.deleteById(input.id);
      return { success: true };
    }),
  },
  works: {
    list: os.works.list.use(adminMiddleware).handler(async () => {
      const works = await workModel.findAll();
      return works;
    }),
    create: os.works.create.use(adminMiddleware).handler(async ({ input }) => {
      const work = await workModel.create(input);
      return work;
    }),
    update: os.works.update.use(adminMiddleware).handler(async ({ input }) => {
      const { id, ...data } = input;
      const work = await workModel.update(id, data);
      return work;
    }),
    delete: os.works.delete.use(adminMiddleware).handler(async ({ input }) => {
      await workModel.deleteById(input.id);
      return { success: true };
    }),
  },
  games: {
    list: os.games.list.use(adminMiddleware).handler(async () => {
      const games = await gameModel.findAll();
      return games;
    }),
    create: os.games.create.use(adminMiddleware).handler(async ({ input }) => {
      const { eventId, picksLockAt, ...data } = input;
      const game = await gameService.createGame({
        ...data,
        picksLockAt: parseOptionalDate(picksLockAt),
        event: { connect: { id: eventId } },
      });
      return game;
    }),
    update: os.games.update.use(adminMiddleware).handler(async ({ input }) => {
      const { id, eventId, picksLockAt, ...data } = input;
      const game = await gameService.updateGame(id, {
        ...data,
        picksLockAt: parseOptionalDate(picksLockAt),
      });
      return game;
    }),
    updateStatus: os.games.updateStatus.use(adminMiddleware).handler(async ({ input }) => {
      const game = await gameService.updateGameStatus(input.id, input.status);
      return game;
    }),
    delete: os.games.delete.use(adminMiddleware).handler(async ({ input }) => {
      await gameService.deleteGame(input.id);
      return { success: true };
    }),
  },
  wikipedia: {
    previewImport: os.wikipedia.previewImport.use(adminMiddleware).handler(async ({ input }) => {
      const preview = await wikipediaImportService.previewImport(input.url);
      return preview;
    }),
    import: os.wikipedia.import.use(adminMiddleware).handler(async ({ input }) => {
      const result = await wikipediaImportService.commitImport(input.url);
      return result;
    }),
  },
});
