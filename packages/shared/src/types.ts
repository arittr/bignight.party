import type { z } from "zod";
import type {
  PlayerSchema,
  CreatePlayerSchema,
  CategorySchema,
  NominationSchema,
  PickSchema,
  SubmitPickSchema,
  GameConfigSchema,
  LeaderboardPlayerSchema,
  ReactionBroadcastSchema,
  JoinResponseSchema,
  GameStateResponseSchema,
  CategoriesResponseSchema,
  PicksResponseSchema,
  SubmitPickResponseSchema,
  LeaderboardResponseSchema,
} from "./schemas";

export type Player = z.infer<typeof PlayerSchema>;
export type CreatePlayer = z.infer<typeof CreatePlayerSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Nomination = z.infer<typeof NominationSchema>;
export type GamePick = z.infer<typeof PickSchema>; // "GamePick" not "Pick" to avoid TS builtin collision
export type SubmitPick = z.infer<typeof SubmitPickSchema>;
export type GameConfig = z.infer<typeof GameConfigSchema>;
export type LeaderboardPlayer = z.infer<typeof LeaderboardPlayerSchema>;
export type ReactionBroadcast = z.infer<typeof ReactionBroadcastSchema>;

export type JoinResponse = z.infer<typeof JoinResponseSchema>;
export type GameStateResponse = z.infer<typeof GameStateResponseSchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
export type PicksResponse = z.infer<typeof PicksResponseSchema>;
export type SubmitPickResponse = z.infer<typeof SubmitPickResponseSchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export type GamePhase = "setup" | "open" | "locked" | "completed";
export type CategoryWithNominations = Category & { nominations: Nomination[] };
export type PlayerPick = GamePick & { nomination: Nomination };
