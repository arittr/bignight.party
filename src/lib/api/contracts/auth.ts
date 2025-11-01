import { oc } from "@orpc/contract";
import { z } from "zod";
import { emailSchema } from "@/schemas/auth-schema";

/**
 * Auth Contracts - Public authentication operations
 *
 * All contracts are public (no authentication required) as they handle
 * the authentication flow itself. Used for sign-in, sign-up, and email verification.
 */

/**
 * Sign in with email - sends magic link
 * Used for both existing users and new users
 */
export const signInContract = oc.input(emailSchema).output(
  z.object({
    success: z.boolean(),
    message: z.string(),
  })
);

/**
 * Sign up with email - creates account and sends magic link
 * This is semantically the same as signIn in our implementation
 * (both trigger magic link flow via Auth.js)
 */
export const signUpContract = oc.input(emailSchema).output(
  z.object({
    success: z.boolean(),
    message: z.string(),
  })
);

/**
 * Verify email with callback token
 * This is handled by Auth.js callback flow in practice,
 * but exposed here for potential explicit verification if needed
 */
export const verifyEmailContract = oc
  .input(
    z.object({
      token: z.string().min(1, "Token is required"),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  );
