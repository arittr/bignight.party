import type { Nomination } from "@prisma/client";
import {
  BEST_ACTOR_CATEGORY,
  BEST_ACTRESS_CATEGORY,
  BEST_ANIMATED_FEATURE_CATEGORY,
  BEST_DIRECTOR_CATEGORY,
  BEST_PICTURE_CATEGORY,
  BEST_SUPPORTING_ACTOR_CATEGORY,
  REVEALED_BEST_ACTOR_2024,
  REVEALED_BEST_PICTURE_2024,
} from "./categories";

/**
 * Test fixtures for Nomination model
 * Realistic Oscar nominations linked to categories
 * Nominations can be for a Work (film) or Person (actor/director)
 */

// ==================== Best Picture 2025 Nominations ====================
// Best Picture nominees are Works (films)

export const OPPENHEIMER_BEST_PICTURE_NOM: Nomination = {
  categoryId: BEST_PICTURE_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-oppenheimer-best-picture",
  nominationText: "Oppenheimer",
  personId: null,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-oppenheimer",
};

export const BARBIE_BEST_PICTURE_NOM: Nomination = {
  categoryId: BEST_PICTURE_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-barbie-best-picture",
  nominationText: "Barbie",
  personId: null,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-barbie",
};

export const KILLERS_OF_THE_FLOWER_MOON_BEST_PICTURE_NOM: Nomination = {
  categoryId: BEST_PICTURE_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-killers-best-picture",
  nominationText: "Killers of the Flower Moon",
  personId: null,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-killers-flower-moon",
};

export const POOR_THINGS_BEST_PICTURE_NOM: Nomination = {
  categoryId: BEST_PICTURE_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-poor-things-best-picture",
  nominationText: "Poor Things",
  personId: null,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-poor-things",
};

export const THE_ZONE_OF_INTEREST_BEST_PICTURE_NOM: Nomination = {
  categoryId: BEST_PICTURE_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-zone-interest-best-picture",
  nominationText: "The Zone of Interest",
  personId: null,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-zone-of-interest",
};

// ==================== Best Actor 2025 Nominations ====================
// Best Actor nominees are Persons

export const CILLIAN_MURPHY_BEST_ACTOR_NOM: Nomination = {
  categoryId: BEST_ACTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-cillian-murphy-best-actor",
  nominationText: "Cillian Murphy - Oppenheimer",
  personId: "person-cillian-murphy",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-oppenheimer",
};

export const PAUL_GIAMATTI_BEST_ACTOR_NOM: Nomination = {
  categoryId: BEST_ACTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-paul-giamatti-best-actor",
  nominationText: "Paul Giamatti - The Holdovers",
  personId: "person-paul-giamatti",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-the-holdovers",
};

export const BRADLEY_COOPER_BEST_ACTOR_NOM: Nomination = {
  categoryId: BEST_ACTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-bradley-cooper-best-actor",
  nominationText: "Bradley Cooper - Maestro",
  personId: "person-bradley-cooper",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-maestro",
};

export const COLMAN_DOMINGO_BEST_ACTOR_NOM: Nomination = {
  categoryId: BEST_ACTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-colman-domingo-best-actor",
  nominationText: "Colman Domingo - Rustin",
  personId: "person-colman-domingo",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-rustin",
};

export const JEFFREY_WRIGHT_BEST_ACTOR_NOM: Nomination = {
  categoryId: BEST_ACTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-jeffrey-wright-best-actor",
  nominationText: "Jeffrey Wright - American Fiction",
  personId: "person-jeffrey-wright",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-american-fiction",
};

// ==================== Best Actress 2025 Nominations ====================

export const EMMA_STONE_BEST_ACTRESS_NOM: Nomination = {
  categoryId: BEST_ACTRESS_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-emma-stone-best-actress",
  nominationText: "Emma Stone - Poor Things",
  personId: "person-emma-stone",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-poor-things",
};

export const LILY_GLADSTONE_BEST_ACTRESS_NOM: Nomination = {
  categoryId: BEST_ACTRESS_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-lily-gladstone-best-actress",
  nominationText: "Lily Gladstone - Killers of the Flower Moon",
  personId: "person-lily-gladstone",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-killers-flower-moon",
};

export const SANDRA_HULLER_BEST_ACTRESS_NOM: Nomination = {
  categoryId: BEST_ACTRESS_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-sandra-huller-best-actress",
  nominationText: "Sandra Hüller - Anatomy of a Fall",
  personId: "person-sandra-huller",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-anatomy-of-a-fall",
};

export const CAREY_MULLIGAN_BEST_ACTRESS_NOM: Nomination = {
  categoryId: BEST_ACTRESS_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-carey-mulligan-best-actress",
  nominationText: "Carey Mulligan - Maestro",
  personId: "person-carey-mulligan",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-maestro",
};

export const ANNETTE_BENING_BEST_ACTRESS_NOM: Nomination = {
  categoryId: BEST_ACTRESS_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-annette-bening-best-actress",
  nominationText: "Annette Bening - Nyad",
  personId: "person-annette-bening",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-nyad",
};

// ==================== Best Director 2025 Nominations ====================

export const CHRISTOPHER_NOLAN_BEST_DIRECTOR_NOM: Nomination = {
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-christopher-nolan-best-director",
  nominationText: "Christopher Nolan - Oppenheimer",
  personId: "person-christopher-nolan",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-oppenheimer",
};

export const MARTIN_SCORSESE_BEST_DIRECTOR_NOM: Nomination = {
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-martin-scorsese-best-director",
  nominationText: "Martin Scorsese - Killers of the Flower Moon",
  personId: "person-martin-scorsese",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-killers-flower-moon",
};

export const YORGOS_LANTHIMOS_BEST_DIRECTOR_NOM: Nomination = {
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-yorgos-lanthimos-best-director",
  nominationText: "Yorgos Lanthimos - Poor Things",
  personId: "person-yorgos-lanthimos",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-poor-things",
};

export const JONATHAN_GLAZER_BEST_DIRECTOR_NOM: Nomination = {
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-jonathan-glazer-best-director",
  nominationText: "Jonathan Glazer - The Zone of Interest",
  personId: "person-jonathan-glazer",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-zone-of-interest",
};

export const JUSTINE_TRIET_BEST_DIRECTOR_NOM: Nomination = {
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-justine-triet-best-director",
  nominationText: "Justine Triet - Anatomy of a Fall",
  personId: "person-justine-triet",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-anatomy-of-a-fall",
};

// ==================== Best Supporting Actor 2025 Nominations ====================

export const ROBERT_DOWNEY_JR_BEST_SUPPORTING_ACTOR_NOM: Nomination = {
  categoryId: BEST_SUPPORTING_ACTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-robert-downey-jr-best-supporting-actor",
  nominationText: "Robert Downey Jr. - Oppenheimer",
  personId: "person-robert-downey-jr",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-oppenheimer",
};

export const RYAN_GOSLING_BEST_SUPPORTING_ACTOR_NOM: Nomination = {
  categoryId: BEST_SUPPORTING_ACTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-ryan-gosling-best-supporting-actor",
  nominationText: "Ryan Gosling - Barbie",
  personId: "person-ryan-gosling",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-barbie",
};

export const MARK_RUFFALO_BEST_SUPPORTING_ACTOR_NOM: Nomination = {
  categoryId: BEST_SUPPORTING_ACTOR_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-mark-ruffalo-best-supporting-actor",
  nominationText: "Mark Ruffalo - Poor Things",
  personId: "person-mark-ruffalo",
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-poor-things",
};

// ==================== Best Animated Feature 2025 Nominations ====================

export const SPIDER_VERSE_BEST_ANIMATED_NOM: Nomination = {
  categoryId: BEST_ANIMATED_FEATURE_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-spider-verse-best-animated",
  nominationText: "Spider-Man: Across the Spider-Verse",
  personId: null,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-spider-verse",
};

export const THE_BOY_AND_THE_HERON_BEST_ANIMATED_NOM: Nomination = {
  categoryId: BEST_ANIMATED_FEATURE_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-boy-heron-best-animated",
  nominationText: "The Boy and the Heron",
  personId: null,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-boy-and-heron",
};

export const ELEMENTAL_BEST_ANIMATED_NOM: Nomination = {
  categoryId: BEST_ANIMATED_FEATURE_CATEGORY.id,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  id: "nom-elemental-best-animated",
  nominationText: "Elemental",
  personId: null,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  workId: "work-elemental",
};

// ==================== 2024 Winners (for REVEALED categories) ====================

export const OPPENHEIMER_BEST_PICTURE_2024_WINNER: Nomination = {
  categoryId: REVEALED_BEST_PICTURE_2024.id,
  createdAt: new Date("2023-12-15T00:00:00.000Z"),
  id: "nom-oppenheimer-best-picture-2024",
  nominationText: "Oppenheimer",
  personId: null,
  updatedAt: new Date("2024-03-10T04:30:00.000Z"), // Updated when won
  workId: "work-oppenheimer-2024",
};

export const CILLIAN_MURPHY_BEST_ACTOR_2024_WINNER: Nomination = {
  categoryId: REVEALED_BEST_ACTOR_2024.id,
  createdAt: new Date("2023-12-15T00:00:00.000Z"),
  id: "nom-cillian-murphy-best-actor-2024",
  nominationText: "Cillian Murphy - Oppenheimer",
  personId: "person-cillian-murphy-2024",
  updatedAt: new Date("2024-03-10T03:45:00.000Z"), // Updated when won
  workId: "work-oppenheimer-2024",
};
