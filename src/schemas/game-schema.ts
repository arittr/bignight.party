import { GameStatus } from "@prisma/client";
import { z } from "zod";

// Access code validation: uppercase letters and numbers only
const accessCodeRegex = /^[A-Z0-9]+$/;

export const gameCreateSchema = z.object({
  accessCode: z
    .string()
    .min(4, "Access code must be at least 4 characters")
    .regex(accessCodeRegex, "Access code must contain only uppercase letters and numbers"),
  eventId: z.string().cuid("Invalid event ID"),
  name: z.string().min(1, "Game name is required"),
  picksLockAt: z.coerce
    .date({
      message: "Picks lock date must be a valid date",
    })
    .optional(),
  status: z.nativeEnum(GameStatus).default(GameStatus.SETUP),
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
  picksLockAt: z.coerce
    .date({
      message: "Picks lock date must be a valid date",
    })
    .optional(),
  status: z.nativeEnum(GameStatus).optional(),
});

export const joinGameSchema = z.object({
  gameId: z.string().cuid(),
});

export const resolveAccessCodeSchema = z.object({
  accessCode: z.string().regex(/^[A-Z0-9]+$/, "Access code must be uppercase alphanumeric"),
});

export type GameCreateInput = z.infer<typeof gameCreateSchema>;
export type GameUpdateInput = z.infer<typeof gameUpdateSchema>;
export type JoinGameInput = z.infer<typeof joinGameSchema>;
export type ResolveAccessCodeInput = z.infer<typeof resolveAccessCodeSchema>;
