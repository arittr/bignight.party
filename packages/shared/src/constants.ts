export const ALLOWED_REACTIONS = ["🔥", "💕", "💩", "💀", "👏"] as const;
export type AllowedReaction = (typeof ALLOWED_REACTIONS)[number];

export const WEBSOCKET_EVENTS = {
  LEADERBOARD_UPDATE: "leaderboard:update",
  GAME_COMPLETED: "game:completed",
  REACTION_BROADCAST: "reaction:broadcast",
  PICKS_LOCKED: "picks:locked",
  JOIN: "join",
  REACTION_SEND: "reaction:send",
} as const;

export const REACTION_TTL_MS = 3000;
export const TOKEN_EXPIRY_HOURS = 24;
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;
