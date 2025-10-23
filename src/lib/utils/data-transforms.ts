/**
 * Data transformation utilities for converting Prisma models to component interfaces
 *
 * These utilities centralize the conversion logic between database models and
 * component props, eliminating duplicated transformation code across the admin section.
 */

/**
 * Transforms a Prisma Event with category count to EventListItem interface
 */
export interface EventWithCategoryCount {
  id: string;
  name: string;
  slug: string;
  eventDate: Date;
  description: string | null;
  _count: {
    categories: number;
  };
}

export interface EventListItem {
  id: string;
  name: string;
  slug: string;
  eventDate: Date;
  description: string | null;
  _count: {
    categories: number;
  };
}

export function transformEventToListItem(event: EventWithCategoryCount): EventListItem {
  return {
    _count: {
      categories: event._count.categories,
    },
    description: event.description,
    eventDate: event.eventDate,
    id: event.id,
    name: event.name,
    slug: event.slug,
  };
}

/**
 * Transforms multiple events to list items
 */
export function transformEventsToListItems(events: EventWithCategoryCount[]): EventListItem[] {
  return events.map(transformEventToListItem);
}

/**
 * Transforms a Prisma Game with participant count to GameListItem interface
 */
export interface GameWithParticipantCount {
  id: string;
  name: string;
  accessCode: string;
  status: "SETUP" | "OPEN" | "LIVE" | "COMPLETED";
  picksLockAt: Date | null;
  event: {
    id: string;
    name: string;
  };
  _count: {
    participants: number;
  };
}

export interface GameListItem {
  id: string;
  name: string;
  accessCode: string;
  status: "SETUP" | "OPEN" | "LIVE" | "COMPLETED";
  picksLockAt: Date | null;
  eventName: string;
  participantCount: number;
}

export function transformGameToListItem(game: GameWithParticipantCount): GameListItem {
  return {
    accessCode: game.accessCode,
    eventName: game.event.name,
    id: game.id,
    name: game.name,
    participantCount: game._count.participants,
    picksLockAt: game.picksLockAt,
    status: game.status,
  };
}

/**
 * Transforms multiple games to list items
 */
export function transformGamesToListItems(games: GameWithParticipantCount[]): GameListItem[] {
  return games.map(transformGameToListItem);
}

/**
 * Transforms a Prisma Person to PersonListItem interface
 */
export interface PersonWithNominationCount {
  id: string;
  name: string;
  slug: string;
  _count?: {
    nominations: number;
  };
}

export interface PersonListItem {
  id: string;
  name: string;
  slug: string;
  nominationCount: number;
}

export function transformPersonToListItem(person: PersonWithNominationCount): PersonListItem {
  return {
    id: person.id,
    name: person.name,
    nominationCount: person._count?.nominations ?? 0,
    slug: person.slug,
  };
}

/**
 * Transforms multiple people to list items
 */
export function transformPeopleToListItems(people: PersonWithNominationCount[]): PersonListItem[] {
  return people.map(transformPersonToListItem);
}

/**
 * Transforms a Prisma Work to WorkListItem interface
 */
export interface WorkWithNominationCount {
  id: string;
  title: string;
  slug: string;
  type: "FILM" | "TV_SHOW" | "ALBUM" | "SONG" | "PLAY" | "BOOK";
  releaseYear: number | null;
  _count?: {
    nominations: number;
  };
}

export interface WorkListItem {
  id: string;
  title: string;
  slug: string;
  type: "FILM" | "TV_SHOW" | "ALBUM" | "SONG" | "PLAY" | "BOOK";
  releaseYear: number | null;
  nominationCount: number;
}

export function transformWorkToListItem(work: WorkWithNominationCount): WorkListItem {
  return {
    id: work.id,
    nominationCount: work._count?.nominations ?? 0,
    releaseYear: work.releaseYear,
    slug: work.slug,
    title: work.title,
    type: work.type,
  };
}

/**
 * Transforms multiple works to list items
 */
export function transformWorksToListItems(works: WorkWithNominationCount[]): WorkListItem[] {
  return works.map(transformWorkToListItem);
}

/**
 * Utility to format date for display
 */
export function formatDateForDisplay(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Utility to format status for display
 */
export function formatStatusForDisplay(status: "SETUP" | "OPEN" | "LIVE" | "COMPLETED"): string {
  const statusMap = {
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    COMPLETED: "Completed",
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    LIVE: "Live",
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    OPEN: "Open",
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    SETUP: "Setup",
  };
  return statusMap[status];
}

/**
 * Utility to format work type for display
 */
export function formatWorkTypeForDisplay(
  type: "FILM" | "TV_SHOW" | "ALBUM" | "SONG" | "PLAY" | "BOOK"
): string {
  const typeMap = {
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    ALBUM: "Album",
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    BOOK: "Book",
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    FILM: "Film",
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    PLAY: "Play",
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    SONG: "Song",
    // biome-ignore lint/style/useNamingConvention: Prisma enum value
    TV_SHOW: "TV Show",
  };
  return typeMap[type];
}

/**
 * Utility to safely extract count from Prisma _count field
 */
export function extractCount<T extends { _count?: Record<string, number> }>(
  entity: T,
  field: string
): number {
  return entity._count?.[field] ?? 0;
}
