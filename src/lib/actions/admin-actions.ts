"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/actions/safe-action";
import * as categoryModel from "@/lib/models/category";
import * as nominationModel from "@/lib/models/nomination";
import * as personModel from "@/lib/models/person";
import * as workModel from "@/lib/models/work";
import * as eventService from "@/lib/services/event-service";
import * as gameService from "@/lib/services/game-service";
import { categoryCreateSchema, categoryUpdateSchema } from "@/schemas/category-schema";
import { eventCreateSchema, eventUpdateSchema } from "@/schemas/event-schema";
import { gameCreateSchema, gameUpdateSchema } from "@/schemas/game-schema";
import { nominationCreateSchema, nominationUpdateSchema } from "@/schemas/nomination-schema";
import { personCreateSchema, personUpdateSchema } from "@/schemas/person-schema";
import { workCreateSchema, workUpdateSchema } from "@/schemas/work-schema";

// ============================================================================
// EVENT ACTIONS
// ============================================================================

/**
 * Create a new event
 */
export const createEventAction = adminAction
  .schema(eventCreateSchema)
  .action(async ({ parsedInput }) => {
    const event = await eventService.createEvent(parsedInput);
    revalidatePath("/admin/events");
    return event;
  });

/**
 * Update an existing event
 */
export const updateEventAction = adminAction
  .schema(eventUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const event = await eventService.updateEvent(id, data);
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    return event;
  });

/**
 * Delete an event (cascades to categories and games)
 */
export const deleteEventAction = adminAction
  .schema(eventUpdateSchema.pick({ id: true }))
  .action(async ({ parsedInput }) => {
    await eventService.deleteEvent(parsedInput.id);
    revalidatePath("/admin/events");
    return { success: true };
  });

// ============================================================================
// GAME ACTIONS
// ============================================================================

/**
 * Create a new game
 */
export const createGameAction = adminAction
  .schema(gameCreateSchema)
  .action(async ({ parsedInput }) => {
    const { eventId, ...data } = parsedInput;
    const game = await gameService.createGame({
      ...data,
      event: { connect: { id: eventId } },
    });
    revalidatePath("/admin/games");
    revalidatePath(`/admin/events/${eventId}`);
    return game;
  });

/**
 * Update an existing game
 */
export const updateGameAction = adminAction
  .schema(gameUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, eventId, ...data } = parsedInput;

    // Build update data with event connection if provided
    const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;

    const game = await gameService.updateGame(id, updateData);
    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${id}`);
    if (eventId) {
      revalidatePath(`/admin/events/${eventId}`);
    }
    return game;
  });

/**
 * Delete a game (cascades to picks)
 */
export const deleteGameAction = adminAction
  .schema(gameUpdateSchema.pick({ id: true }))
  .action(async ({ parsedInput }) => {
    await gameService.deleteGame(parsedInput.id);
    revalidatePath("/admin/games");
    return { success: true };
  });

// ============================================================================
// CATEGORY ACTIONS
// ============================================================================

/**
 * Create a new category
 */
export const createCategoryAction = adminAction
  .schema(categoryCreateSchema)
  .action(async ({ parsedInput }) => {
    const { eventId, ...data } = parsedInput;
    const category = await categoryModel.create({
      ...data,
      event: { connect: { id: eventId } },
    });
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    return category;
  });

/**
 * Update an existing category
 */
export const updateCategoryAction = adminAction
  .schema(categoryUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, eventId, ...data } = parsedInput;

    // Build update data with event connection if provided
    const updateData = eventId ? { ...data, event: { connect: { id: eventId } } } : data;

    const category = await categoryModel.update(id, updateData);
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${category.eventId}`);
    if (eventId && eventId !== category.eventId) {
      revalidatePath(`/admin/events/${eventId}`);
    }
    return category;
  });

/**
 * Delete a category (cascades to nominations)
 */
export const deleteCategoryAction = adminAction
  .schema(categoryUpdateSchema.pick({ id: true }))
  .action(async ({ parsedInput }) => {
    const category = await categoryModel.findById(parsedInput.id);
    if (category) {
      await categoryModel.deleteById(parsedInput.id);
      revalidatePath("/admin/events");
      revalidatePath(`/admin/events/${category.eventId}`);
    }
    return { success: true };
  });

// ============================================================================
// WORK ACTIONS
// ============================================================================

/**
 * Create a new work
 */
export const createWorkAction = adminAction
  .schema(workCreateSchema)
  .action(async ({ parsedInput }) => {
    const work = await workModel.create(parsedInput);
    revalidatePath("/admin/works");
    return work;
  });

/**
 * Update an existing work
 */
export const updateWorkAction = adminAction
  .schema(workUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const work = await workModel.update(id, data);
    revalidatePath("/admin/works");
    revalidatePath(`/admin/works/${id}`);
    return work;
  });

/**
 * Delete a work (will fail if work has nominations due to foreign key constraint)
 */
export const deleteWorkAction = adminAction
  .schema(workUpdateSchema.pick({ id: true }))
  .action(async ({ parsedInput }) => {
    await workModel.deleteById(parsedInput.id);
    revalidatePath("/admin/works");
    return { success: true };
  });

// ============================================================================
// PERSON ACTIONS
// ============================================================================

/**
 * Create a new person
 */
export const createPersonAction = adminAction
  .schema(personCreateSchema)
  .action(async ({ parsedInput }) => {
    const person = await personModel.create(parsedInput);
    revalidatePath("/admin/people");
    return person;
  });

/**
 * Update an existing person
 */
export const updatePersonAction = adminAction
  .schema(personUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const person = await personModel.update(id, data);
    revalidatePath("/admin/people");
    revalidatePath(`/admin/people/${id}`);
    return person;
  });

/**
 * Delete a person (will fail if person has nominations due to foreign key constraint)
 */
export const deletePersonAction = adminAction
  .schema(personUpdateSchema.pick({ id: true }))
  .action(async ({ parsedInput }) => {
    await personModel.deleteById(parsedInput.id);
    revalidatePath("/admin/people");
    return { success: true };
  });

// ============================================================================
// NOMINATION ACTIONS
// ============================================================================

/**
 * Create a new nomination
 */
export const createNominationAction = adminAction
  .schema(nominationCreateSchema)
  .action(async ({ parsedInput }) => {
    const { categoryId, workId, personId, ...data } = parsedInput;

    // Build the nomination data with proper Prisma relations
    const nominationData = {
      ...data,
      category: { connect: { id: categoryId } },
      ...(workId && { work: { connect: { id: workId } } }),
      ...(personId && { person: { connect: { id: personId } } }),
    };

    const nomination = await nominationModel.create(nominationData);

    // Get the category to find the eventId for revalidation
    const category = await categoryModel.findById(categoryId);
    if (category) {
      revalidatePath(`/admin/events/${category.eventId}`);
    }
    revalidatePath("/admin/events");

    return nomination;
  });

/**
 * Update an existing nomination
 */
export const updateNominationAction = adminAction
  .schema(nominationUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { id, categoryId, workId, personId, ...data } = parsedInput;

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

    // Revalidate the category's event page
    const category = await categoryModel.findById(nomination.categoryId);
    if (category) {
      revalidatePath(`/admin/events/${category.eventId}`);
    }
    revalidatePath("/admin/events");

    return nomination;
  });

/**
 * Delete a nomination
 */
export const deleteNominationAction = adminAction
  .schema(nominationUpdateSchema.pick({ id: true }))
  .action(async ({ parsedInput }) => {
    const nomination = await nominationModel.findById(parsedInput.id);
    if (nomination) {
      await nominationModel.deleteById(parsedInput.id);

      // Revalidate the category's event page
      const category = await categoryModel.findById(nomination.categoryId);
      if (category) {
        revalidatePath(`/admin/events/${category.eventId}`);
      }
      revalidatePath("/admin/events");
    }
    return { success: true };
  });
