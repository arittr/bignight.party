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

export type GamePhase = "setup" | "open" | "locked" | "completed";
export type CategoryWithNominations = Category & { nominations: Nomination[] };
export type PlayerPick = GamePick & { nomination: Nomination };
