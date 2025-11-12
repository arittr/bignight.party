import { oc } from "@orpc/contract";
import { z } from "zod";
import { adminProcedure } from "@/lib/api/procedures";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from "@/schemas/category-schema";
import {
  eventCreateSchema,
  eventUpdateSchema,
  type EventCreateInput,
  type EventUpdateInput,
} from "@/schemas/event-schema";
import {
  gameCreateSchema,
  gameUpdateSchema,
  type GameCreateInput,
  type GameUpdateInput,
} from "@/schemas/game-schema";
import {
  nominationCreateSchema,
  nominationUpdateSchema,
  type NominationCreateInput,
  type NominationUpdateInput,
} from "@/schemas/nomination-schema";
import {
  personCreateSchema,
  personUpdateSchema,
  type PersonCreateInput,
  type PersonUpdateInput,
} from "@/schemas/person-schema";
import {
  workCreateSchema,
  workUpdateSchema,
  type WorkCreateInput,
  type WorkUpdateInput,
} from "@/schemas/work-schema";
import { wikipediaUrlSchema, type WikipediaUrlInput } from "@/schemas/wikipedia-import-schema";

/**
 * Admin Contracts - All admin operations require ADMIN role
 *
 * Covers: Events, Categories, Nominations, People, Works, Games, Wikipedia Import
 * All procedures use adminProcedure with role enforcement
 */

// ============================================================================
// EVENT CONTRACTS
// ============================================================================

/**
 * List all events with category counts
 */
export const listEventsContract = oc.input(z.void()).output(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      description: z.string().nullable(),
      eventDate: z.date(),
      createdAt: z.date(),
      updatedAt: z.date(),
      _count: z.object({
        categories: z.number(),
      }),
      games: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]),
        })
      ),
    })
  )
);

/**
 * Create a new event
 */
export const createEventContract = oc.input(eventCreateSchema).output(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    eventDate: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Update an existing event
 */
export const updateEventContract = oc.input(eventUpdateSchema).output(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    eventDate: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Delete an event (cascades to categories and games)
 */
export const deleteEventContract = oc
  .input(
    z.object({
      id: z.string().cuid("Invalid event ID"),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
    })
  );

// ============================================================================
// CATEGORY CONTRACTS
// ============================================================================

/**
 * Create a new category
 */
export const createCategoryContract = oc.input(categoryCreateSchema).output(
  z.object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    points: z.number(),
    isRevealed: z.boolean(),
    winnerNominationId: z.string().nullable(),
    eventId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Update an existing category
 */
export const updateCategoryContract = oc.input(categoryUpdateSchema).output(
  z.object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    points: z.number(),
    isRevealed: z.boolean(),
    winnerNominationId: z.string().nullable(),
    eventId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Delete a category (cascades to nominations)
 */
export const deleteCategoryContract = oc
  .input(
    z.object({
      id: z.string().cuid("Invalid category ID"),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
    })
  );

/**
 * Mark a winner for a category during live ceremony
 */
export const markWinnerContract = oc
  .input(
    z.object({
      categoryId: z.string().cuid("Invalid category ID"),
      nominationId: z.string().cuid("Invalid nomination ID"),
      gameId: z.string().cuid("Invalid game ID"),
    })
  )
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
      order: z.number(),
      points: z.number(),
      isRevealed: z.boolean(),
      winnerNominationId: z.string().nullable(),
      eventId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  );

/**
 * Clear the winner for a category
 */
export const clearWinnerContract = oc
  .input(
    z.object({
      categoryId: z.string().cuid("Invalid category ID"),
      gameId: z.string().cuid("Invalid game ID"),
    })
  )
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
      order: z.number(),
      points: z.number(),
      isRevealed: z.boolean(),
      winnerNominationId: z.string().nullable(),
      eventId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  );

// ============================================================================
// NOMINATION CONTRACTS
// ============================================================================

/**
 * Create a new nomination
 */
export const createNominationContract = oc.input(nominationCreateSchema).output(
  z.object({
    id: z.string(),
    nominationText: z.string(),
    categoryId: z.string(),
    workId: z.string().nullable(),
    personId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Update an existing nomination
 */
export const updateNominationContract = oc.input(nominationUpdateSchema).output(
  z.object({
    id: z.string(),
    nominationText: z.string(),
    categoryId: z.string(),
    workId: z.string().nullable(),
    personId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Delete a nomination
 */
export const deleteNominationContract = oc
  .input(
    z.object({
      id: z.string().cuid("Invalid nomination ID"),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
    })
  );

// ============================================================================
// PERSON CONTRACTS
// ============================================================================

/**
 * List all people with nomination counts
 */
export const listPeopleContract = oc.input(z.void()).output(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      imageUrl: z.string().nullable(),
      _count: z.object({
        nominations: z.number(),
      }),
      nominations: z.array(
        z.object({
          workId: z.string().nullable(),
        })
      ),
    })
  )
);

/**
 * Create a new person
 */
export const createPersonContract = oc.input(personCreateSchema).output(
  z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string().nullable(),
    externalId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Update an existing person
 */
export const updatePersonContract = oc.input(personUpdateSchema).output(
  z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string().nullable(),
    externalId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Delete a person (will fail if person has nominations due to foreign key constraint)
 */
export const deletePersonContract = oc
  .input(
    z.object({
      id: z.string().cuid("Invalid person ID"),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
    })
  );

// ============================================================================
// WORK CONTRACTS
// ============================================================================

/**
 * List all works
 */
export const listWorksContract = oc.input(z.void()).output(
  z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.enum(["FILM", "TV_SHOW", "SONG", "ALBUM", "BOOK", "PLAY", "OTHER"]),
      year: z.number().nullable(),
      imageUrl: z.string().nullable(),
      externalId: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      nominations: z.array(
        z.object({
          id: z.string(),
          nominationText: z.string(),
        })
      ),
    })
  )
);

/**
 * Create a new work
 */
export const createWorkContract = oc.input(workCreateSchema).output(
  z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(["FILM", "TV_SHOW", "SONG", "ALBUM", "BOOK", "PLAY", "OTHER"]),
    year: z.number().nullable(),
    imageUrl: z.string().nullable(),
    externalId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Update an existing work
 */
export const updateWorkContract = oc.input(workUpdateSchema).output(
  z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(["FILM", "TV_SHOW", "SONG", "ALBUM", "BOOK", "PLAY", "OTHER"]),
    year: z.number().nullable(),
    imageUrl: z.string().nullable(),
    externalId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Delete a work (will fail if work has nominations due to foreign key constraint)
 */
export const deleteWorkContract = oc
  .input(
    z.object({
      id: z.string().cuid("Invalid work ID"),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
    })
  );

// ============================================================================
// GAME CONTRACTS
// ============================================================================

/**
 * List all games
 */
export const listGamesContract = oc.input(z.void()).output(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]),
      accessCode: z.string(),
      picksLockAt: z.date().nullable(),
      completedAt: z.date().nullable(),
      eventId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      event: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().nullable(),
        eventDate: z.date(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    })
  )
);

/**
 * Create a new game
 */
export const createGameContract = oc.input(gameCreateSchema).output(
  z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]),
    accessCode: z.string(),
    picksLockAt: z.date().nullable(),
    eventId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Update an existing game
 */
export const updateGameContract = oc.input(gameUpdateSchema).output(
  z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]),
    accessCode: z.string(),
    picksLockAt: z.date().nullable(),
    eventId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

/**
 * Update game status with state machine validation
 */
export const updateGameStatusContract = oc
  .input(
    z.object({
      id: z.string().cuid("Invalid game ID"),
      status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]),
    })
  )
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]),
      accessCode: z.string(),
      picksLockAt: z.date().nullable(),
      eventId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  );

/**
 * Delete a game (cascades to picks)
 */
export const deleteGameContract = oc
  .input(
    z.object({
      id: z.string().cuid("Invalid game ID"),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
    })
  );

// ============================================================================
// WIKIPEDIA IMPORT CONTRACTS
// ============================================================================

/**
 * Preview Wikipedia import without saving to database
 */
export const previewWikipediaImportContract = oc.input(wikipediaUrlSchema).output(
  z.object({
    event: z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      date: z.date(),
    }),
    categoryCount: z.number().int().min(0),
    nominationCount: z.number().int().min(0),
    categories: z
      .array(
        z.object({
          name: z.string(),
          pointValue: z.number().int(),
          nominationCount: z.number().int().min(0),
        })
      )
      .optional(),
    url: z.string().url(),
  })
);

/**
 * Import Wikipedia data into database (commit mode)
 */
export const importFromWikipediaContract = oc.input(wikipediaUrlSchema).output(
  z.object({
    eventId: z.string(),
    eventName: z.string(),
    categoriesCreated: z.number().int().min(0),
    nominationsCreated: z.number().int().min(0),
  })
);

// ============================================================================
// ADMIN ROUTER CONTRACT - HIERARCHICAL OBJECT PATTERN
// ============================================================================

/**
 * Combined admin router contract as hierarchical object
 * All procedures require ADMIN role
 *
 * Organized by domain:
 * - events: List, create, update, delete events
 * - categories: Create, update, delete, mark/clear winner
 * - nominations: Create, update, delete nominations
 * - people: List, create, update, delete people
 * - works: List, create, update, delete works
 * - games: List, create, update, updateStatus, delete games
 * - wikipedia: Preview and import from Wikipedia
 */
export const adminContract = {
  events: {
    list: listEventsContract,
    create: createEventContract,
    update: updateEventContract,
    delete: deleteEventContract,
  },
  categories: {
    create: createCategoryContract,
    update: updateCategoryContract,
    delete: deleteCategoryContract,
    markWinner: markWinnerContract,
    clearWinner: clearWinnerContract,
  },
  nominations: {
    create: createNominationContract,
    update: updateNominationContract,
    delete: deleteNominationContract,
  },
  people: {
    list: listPeopleContract,
    create: createPersonContract,
    update: updatePersonContract,
    delete: deletePersonContract,
  },
  works: {
    list: listWorksContract,
    create: createWorkContract,
    update: updateWorkContract,
    delete: deleteWorkContract,
  },
  games: {
    list: listGamesContract,
    create: createGameContract,
    update: updateGameContract,
    updateStatus: updateGameStatusContract,
    delete: deleteGameContract,
  },
  wikipedia: {
    previewImport: previewWikipediaImportContract,
    import: importFromWikipediaContract,
  },
};
