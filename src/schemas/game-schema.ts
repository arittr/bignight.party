import { z } from "zod";

/**
 * Game Schemas - Wire Format
 *
 * These schemas validate the wire format (JSON/HTTP) that comes from forms and clients.
 * Dates are ISO 8601 strings, not Date objects.
 * Routers transform wire format → domain types before passing to services.
 */

// Access code validation: uppercase letters and numbers only
const accessCodeRegex = /^[A-Z0-9]+$/;

export const gameCreateSchema = z.object({
  accessCode: z
    .string()
    .min(4, "Access code must be at least 4 characters")
    .regex(accessCodeRegex, "Access code must contain only uppercase letters and numbers"),
  eventId: z.string().cuid("Invalid event ID"),
  name: z.string().min(1, "Game name is required"),
  picksLockAt: z.string().datetime().optional(),
  // Note: status field omitted - backend sets default value
});

export const gameUpdateSchema = z.object({
  accessCode: z
    .string()
    .min(4, "Access code must be at least 4 characters")
    .regex(accessCodeRegex, "Access code must contain only uppercase letters and numbers")
    .optional(),
  eventId: z.string().cuid("Invalid event ID").optional(),
  id: z.string().cuid("Invalid game ID"),
  name: z.string().min(1, "Game name is required").optional(),
  picksLockAt: z.string().datetime().optional(),
  status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]).optional(),
});

export const joinGameSchema = z.object({
  gameId: z.string().cuid("Invalid game ID"),
});

export const resolveAccessCodeSchema = z.object({
  accessCode: z.string().regex(/^[A-Z0-9]+$/, "Access code must be uppercase alphanumeric"),
});

export type GameCreateInput = z.infer<typeof gameCreateSchema>;
export type GameUpdateInput = z.infer<typeof gameUpdateSchema>;
export type JoinGameInput = z.infer<typeof joinGameSchema>;
export type ResolveAccessCodeInput = z.infer<typeof resolveAccessCodeSchema>;
