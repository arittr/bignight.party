import * as z from "zod";

// Player
export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  pin: z.string(),
  createdAt: z.number().int(),
});

export const CreatePlayerSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  pin: z.string().min(4).max(6),
});

// Category
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  order: z.number().int().nonnegative(),
  points: z.number().int().positive().default(1),
  winnerId: z.string().nullable(),
  isRevealed: z.boolean().default(false),
  createdAt: z.number().int(),
});

// Nomination
export const NominationSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  title: z.string().min(1),
  subtitle: z.string().default(""),
  imageUrl: z.string().nullable(),
  createdAt: z.number().int(),
});

// Pick
export const PickSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  categoryId: z.string(),
  nominationId: z.string(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const SubmitPickSchema = z.object({
  categoryId: z.string(),
  nominationId: z.string(),
});

// Game Config
export const GameConfigSchema = z.object({
  id: z.number().int().default(1),
  picksLockAt: z.number().int().nullable(),
  completedAt: z.number().int().nullable(),
});

export const SetPicksLockSchema = z.object({
  picksLockAt: z.number().int().nullable(),
});

// Admin
export const AdminLoginSchema = z.object({ pin: z.string().min(1) });
export const ImportWikipediaSchema = z.object({ url: z.string().url() });
export const MarkWinnerSchema = z.object({ categoryId: z.string(), nominationId: z.string() });
export const ClearWinnerSchema = z.object({ categoryId: z.string() });

// Leaderboard
export const LeaderboardPlayerSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  totalScore: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
});

// Reactions
export const ReactionSendSchema = z.object({ emoji: z.string() });
export const ReactionBroadcastSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  emoji: z.string(),
  id: z.string(),
  timestamp: z.number(),
});
