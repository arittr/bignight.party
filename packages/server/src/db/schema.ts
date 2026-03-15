import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const players = sqliteTable("player", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  pin: text("pin").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const categories = sqliteTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  points: integer("points").notNull().default(1),
  winnerId: text("winner_id").references(() => nominations.id),
  isRevealed: integer("is_revealed", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const nominations = sqliteTable("nomination", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const picks = sqliteTable(
  "pick",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    nominationId: text("nomination_id")
      .notNull()
      .references(() => nominations.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    uniqueIndex("pick_player_category_idx").on(
      table.playerId,
      table.categoryId,
    ),
  ],
);

export const gameConfig = sqliteTable("game_config", {
  id: integer("id").primaryKey().default(1),
  completedAt: integer("completed_at", { mode: "number" }),
});
