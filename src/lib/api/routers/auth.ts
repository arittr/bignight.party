import { implement } from "@orpc/server";
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

// Create typed implementation from contract
const os = implement(authContract);

// ============================================================================
// ROUTER
// ============================================================================

export const authRouter = os.router({
  signIn: os.signIn.handler(async ({ input }) => {
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
  signUp: os.signUp.handler(async ({ input }) => {
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
  verifyEmail: os.verifyEmail.handler(async ({ input }) => {
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
