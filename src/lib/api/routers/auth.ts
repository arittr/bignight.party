import { implement } from "@orpc/server";
import { publicProcedure } from "@/lib/api/procedures";
import { authContract } from "@/lib/api/contracts/auth";
import { signIn } from "@/lib/auth/config";

/**
 * Auth Router - Public authentication operations
 *
 * All procedures use publicProcedure (no authentication required)
 * as they handle the authentication flow itself.
 *
 * Layer boundaries:
 * - Router calls Auth.js signIn directly for auth operations
 * - No models or services needed - Auth.js handles the flow
 * - Simple passthrough to Auth.js providers
 *
 * Contract-first pattern:
 * - Uses implement(authContract) for full type safety
 * - Input/output types inferred from contract
 * - No manual type annotations needed
 */

// Create typed builder from contract
const authBuilder = implement(authContract);

export const authRouter = authBuilder.router({
  // ============================================================================
  // SIGN IN PROCEDURE
  // ============================================================================

  /**
   * Sign in with email - sends magic link
   * Works for both existing users and new signups
   * Uses Auth.js email provider (Mailpit in dev, Resend in prod)
   */
  signIn: authBuilder.signIn.use(publicProcedure).handler(async ({ input }) => {
    // Determine provider based on environment
    const providerId = process.env.NODE_ENV === "development" ? "email" : "resend";

    // Call Auth.js signIn with redirect disabled
    // This allows the client to handle redirect/navigation
    await signIn(providerId, {
      email: input.email,
      redirect: false,
    });

    return {
      success: true,
      message: "Magic link sent! Check your email.",
    };
  }),

  // ============================================================================
  // SIGN UP PROCEDURE
  // ============================================================================

  /**
   * Sign up with email - creates account and sends magic link
   * In our system, signup and signin are the same flow:
   * Auth.js creates the user on first email verification
   */
  signUp: authBuilder.signUp.use(publicProcedure).handler(async ({ input }) => {
    // Determine provider based on environment
    const providerId = process.env.NODE_ENV === "development" ? "email" : "resend";

    // Call Auth.js signIn with redirect disabled
    // Auth.js will create a new user on first verification
    await signIn(providerId, {
      email: input.email,
      redirect: false,
    });

    return {
      success: true,
      message: "Magic link sent! Check your email to complete signup.",
    };
  }),

  // ============================================================================
  // VERIFY EMAIL PROCEDURE
  // ============================================================================

  /**
   * Verify email with callback token
   * This is primarily handled by Auth.js callback flow automatically,
   * but exposed here for potential explicit verification needs
   */
  verifyEmail: authBuilder.verifyEmail.use(publicProcedure).handler(async ({ input }) => {
    // In the current implementation, Auth.js handles email verification
    // through the callback URL (auth/callback/email)
    // This procedure is a placeholder for potential future needs
    // or explicit verification flows

    // For now, just return success - actual verification is handled
    // by the Auth.js callback route
    return {
      success: true,
      message: "Email verification handled by Auth.js callback",
    };
  }),
});
