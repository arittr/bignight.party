import type { Nomination } from "@prisma/client";
import {
  BEST_PICTURE_CATEGORY,
  BEST_ACTOR_CATEGORY,
  BEST_ACTRESS_CATEGORY,
  BEST_DIRECTOR_CATEGORY,
  BEST_SUPPORTING_ACTOR_CATEGORY,
  BEST_ANIMATED_FEATURE_CATEGORY,
  REVEALED_BEST_PICTURE_2024,
  REVEALED_BEST_ACTOR_2024,
} from "./categories";

/**
 * Test fixtures for Nomination model
 * Realistic Oscar nominations linked to categories
 * Nominations can be for a Work (film) or Person (actor/director)
 */

// ==================== Best Picture 2025 Nominations ====================
// Best Picture nominees are Works (films)

export const OPPENHEIMER_BEST_PICTURE_NOM: Nomination = {
  id: "nom-oppenheimer-best-picture",
  categoryId: BEST_PICTURE_CATEGORY.id,
  workId: "work-oppenheimer",
  personId: null,
  nominationText: "Oppenheimer",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const BARBIE_BEST_PICTURE_NOM: Nomination = {
  id: "nom-barbie-best-picture",
  categoryId: BEST_PICTURE_CATEGORY.id,
  workId: "work-barbie",
  personId: null,
  nominationText: "Barbie",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const KILLERS_OF_THE_FLOWER_MOON_BEST_PICTURE_NOM: Nomination = {
  id: "nom-killers-best-picture",
  categoryId: BEST_PICTURE_CATEGORY.id,
  workId: "work-killers-flower-moon",
  personId: null,
  nominationText: "Killers of the Flower Moon",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const POOR_THINGS_BEST_PICTURE_NOM: Nomination = {
  id: "nom-poor-things-best-picture",
  categoryId: BEST_PICTURE_CATEGORY.id,
  workId: "work-poor-things",
  personId: null,
  nominationText: "Poor Things",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const THE_ZONE_OF_INTEREST_BEST_PICTURE_NOM: Nomination = {
  id: "nom-zone-interest-best-picture",
  categoryId: BEST_PICTURE_CATEGORY.id,
  workId: "work-zone-of-interest",
  personId: null,
  nominationText: "The Zone of Interest",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

// ==================== Best Actor 2025 Nominations ====================
// Best Actor nominees are Persons

export const CILLIAN_MURPHY_BEST_ACTOR_NOM: Nomination = {
  id: "nom-cillian-murphy-best-actor",
  categoryId: BEST_ACTOR_CATEGORY.id,
  workId: "work-oppenheimer",
  personId: "person-cillian-murphy",
  nominationText: "Cillian Murphy - Oppenheimer",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const PAUL_GIAMATTI_BEST_ACTOR_NOM: Nomination = {
  id: "nom-paul-giamatti-best-actor",
  categoryId: BEST_ACTOR_CATEGORY.id,
  workId: "work-the-holdovers",
  personId: "person-paul-giamatti",
  nominationText: "Paul Giamatti - The Holdovers",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const BRADLEY_COOPER_BEST_ACTOR_NOM: Nomination = {
  id: "nom-bradley-cooper-best-actor",
  categoryId: BEST_ACTOR_CATEGORY.id,
  workId: "work-maestro",
  personId: "person-bradley-cooper",
  nominationText: "Bradley Cooper - Maestro",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const COLMAN_DOMINGO_BEST_ACTOR_NOM: Nomination = {
  id: "nom-colman-domingo-best-actor",
  categoryId: BEST_ACTOR_CATEGORY.id,
  workId: "work-rustin",
  personId: "person-colman-domingo",
  nominationText: "Colman Domingo - Rustin",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const JEFFREY_WRIGHT_BEST_ACTOR_NOM: Nomination = {
  id: "nom-jeffrey-wright-best-actor",
  categoryId: BEST_ACTOR_CATEGORY.id,
  workId: "work-american-fiction",
  personId: "person-jeffrey-wright",
  nominationText: "Jeffrey Wright - American Fiction",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

// ==================== Best Actress 2025 Nominations ====================

export const EMMA_STONE_BEST_ACTRESS_NOM: Nomination = {
  id: "nom-emma-stone-best-actress",
  categoryId: BEST_ACTRESS_CATEGORY.id,
  workId: "work-poor-things",
  personId: "person-emma-stone",
  nominationText: "Emma Stone - Poor Things",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const LILY_GLADSTONE_BEST_ACTRESS_NOM: Nomination = {
  id: "nom-lily-gladstone-best-actress",
  categoryId: BEST_ACTRESS_CATEGORY.id,
  workId: "work-killers-flower-moon",
  personId: "person-lily-gladstone",
  nominationText: "Lily Gladstone - Killers of the Flower Moon",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const SANDRA_HULLER_BEST_ACTRESS_NOM: Nomination = {
  id: "nom-sandra-huller-best-actress",
  categoryId: BEST_ACTRESS_CATEGORY.id,
  workId: "work-anatomy-of-a-fall",
  personId: "person-sandra-huller",
  nominationText: "Sandra Hüller - Anatomy of a Fall",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const CAREY_MULLIGAN_BEST_ACTRESS_NOM: Nomination = {
  id: "nom-carey-mulligan-best-actress",
  categoryId: BEST_ACTRESS_CATEGORY.id,
  workId: "work-maestro",
  personId: "person-carey-mulligan",
  nominationText: "Carey Mulligan - Maestro",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const ANNETTE_BENING_BEST_ACTRESS_NOM: Nomination = {
  id: "nom-annette-bening-best-actress",
  categoryId: BEST_ACTRESS_CATEGORY.id,
  workId: "work-nyad",
  personId: "person-annette-bening",
  nominationText: "Annette Bening - Nyad",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

// ==================== Best Director 2025 Nominations ====================

export const CHRISTOPHER_NOLAN_BEST_DIRECTOR_NOM: Nomination = {
  id: "nom-christopher-nolan-best-director",
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  workId: "work-oppenheimer",
  personId: "person-christopher-nolan",
  nominationText: "Christopher Nolan - Oppenheimer",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const MARTIN_SCORSESE_BEST_DIRECTOR_NOM: Nomination = {
  id: "nom-martin-scorsese-best-director",
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  workId: "work-killers-flower-moon",
  personId: "person-martin-scorsese",
  nominationText: "Martin Scorsese - Killers of the Flower Moon",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const YORGOS_LANTHIMOS_BEST_DIRECTOR_NOM: Nomination = {
  id: "nom-yorgos-lanthimos-best-director",
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  workId: "work-poor-things",
  personId: "person-yorgos-lanthimos",
  nominationText: "Yorgos Lanthimos - Poor Things",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const JONATHAN_GLAZER_BEST_DIRECTOR_NOM: Nomination = {
  id: "nom-jonathan-glazer-best-director",
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  workId: "work-zone-of-interest",
  personId: "person-jonathan-glazer",
  nominationText: "Jonathan Glazer - The Zone of Interest",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const JUSTINE_TRIET_BEST_DIRECTOR_NOM: Nomination = {
  id: "nom-justine-triet-best-director",
  categoryId: BEST_DIRECTOR_CATEGORY.id,
  workId: "work-anatomy-of-a-fall",
  personId: "person-justine-triet",
  nominationText: "Justine Triet - Anatomy of a Fall",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

// ==================== Best Supporting Actor 2025 Nominations ====================

export const ROBERT_DOWNEY_JR_BEST_SUPPORTING_ACTOR_NOM: Nomination = {
  id: "nom-robert-downey-jr-best-supporting-actor",
  categoryId: BEST_SUPPORTING_ACTOR_CATEGORY.id,
  workId: "work-oppenheimer",
  personId: "person-robert-downey-jr",
  nominationText: "Robert Downey Jr. - Oppenheimer",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const RYAN_GOSLING_BEST_SUPPORTING_ACTOR_NOM: Nomination = {
  id: "nom-ryan-gosling-best-supporting-actor",
  categoryId: BEST_SUPPORTING_ACTOR_CATEGORY.id,
  workId: "work-barbie",
  personId: "person-ryan-gosling",
  nominationText: "Ryan Gosling - Barbie",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const MARK_RUFFALO_BEST_SUPPORTING_ACTOR_NOM: Nomination = {
  id: "nom-mark-ruffalo-best-supporting-actor",
  categoryId: BEST_SUPPORTING_ACTOR_CATEGORY.id,
  workId: "work-poor-things",
  personId: "person-mark-ruffalo",
  nominationText: "Mark Ruffalo - Poor Things",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

// ==================== Best Animated Feature 2025 Nominations ====================

export const SPIDER_VERSE_BEST_ANIMATED_NOM: Nomination = {
  id: "nom-spider-verse-best-animated",
  categoryId: BEST_ANIMATED_FEATURE_CATEGORY.id,
  workId: "work-spider-verse",
  personId: null,
  nominationText: "Spider-Man: Across the Spider-Verse",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const THE_BOY_AND_THE_HERON_BEST_ANIMATED_NOM: Nomination = {
  id: "nom-boy-heron-best-animated",
  categoryId: BEST_ANIMATED_FEATURE_CATEGORY.id,
  workId: "work-boy-and-heron",
  personId: null,
  nominationText: "The Boy and the Heron",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

export const ELEMENTAL_BEST_ANIMATED_NOM: Nomination = {
  id: "nom-elemental-best-animated",
  categoryId: BEST_ANIMATED_FEATURE_CATEGORY.id,
  workId: "work-elemental",
  personId: null,
  nominationText: "Elemental",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

// ==================== 2024 Winners (for REVEALED categories) ====================

export const OPPENHEIMER_BEST_PICTURE_2024_WINNER: Nomination = {
  id: "nom-oppenheimer-best-picture-2024",
  categoryId: REVEALED_BEST_PICTURE_2024.id,
  workId: "work-oppenheimer-2024",
  personId: null,
  nominationText: "Oppenheimer",
  createdAt: new Date("2023-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-03-10T04:30:00.000Z"), // Updated when won
};

export const CILLIAN_MURPHY_BEST_ACTOR_2024_WINNER: Nomination = {
  id: "nom-cillian-murphy-best-actor-2024",
  categoryId: REVEALED_BEST_ACTOR_2024.id,
  workId: "work-oppenheimer-2024",
  personId: "person-cillian-murphy-2024",
  nominationText: "Cillian Murphy - Oppenheimer",
  createdAt: new Date("2023-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-03-10T03:45:00.000Z"), // Updated when won
};
