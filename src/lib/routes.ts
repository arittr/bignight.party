/**
 * Centralized route definitions for the application.
 *
 * ALL routes and redirects must use these functions instead of hardcoded strings.
 * This provides:
 * - Type-safe route parameters
 * - Single source of truth for URLs
 * - Easy refactoring (change route in one place)
 * - No typos in route strings
 *
 * @example
 * // ❌ BAD - hardcoded route
 * redirect("/game/123/pick");
 *
 * // ✅ GOOD - centralized route
 * redirect(routes.game.pick("123"));
 */

/**
 * Public routes (no authentication required)
 */
export const routes = {
  /** Home page */
  home: () => "/",

  /** Sign in page */
  signIn: () => "/sign-in",

  /** Sign up flow */
  signup: {
    /** Initial signup page with optional code */
    index: (code?: string) => (code ? `/signup?code=${code}` : "/signup"),
    /** Email verification callback */
    callback: (code?: string) => (code ? `/signup/callback?code=${code}` : "/signup/callback"),
  },

  /** Join game with access code */
  join: (code: string) => `/join/${code}`,

  /**
   * Game routes (authentication required)
   */
  game: {
    /** Pick wizard page */
    pick: (gameId: string, categoryId?: string) =>
      categoryId ? `/game/${gameId}/pick?category=${categoryId}` : `/game/${gameId}/pick`,
    /** Leaderboard page */
    leaderboard: (gameId: string) => `/game/${gameId}/leaderboard`,
  },

  /**
   * User dashboard (authentication required)
   */
  dashboard: () => "/dashboard",

  /**
   * Admin routes (admin role required)
   */
  admin: {
    /** Admin home */
    index: () => "/admin",

    /** Wikipedia import */
    import: () => "/admin/import",

    /** Event management */
    events: {
      /** List all events */
      index: () => "/admin/events",
      /** Create new event */
      new: () => "/admin/events/new",
      /** View/edit event */
      detail: (eventId: string) => `/admin/events/${eventId}`,

      /** Category management */
      categories: {
        /** Create new category */
        new: (eventId: string) => `/admin/events/${eventId}/categories/new`,
        /** View/edit category */
        detail: (eventId: string, categoryId: string) =>
          `/admin/events/${eventId}/categories/${categoryId}`,

        /** Nomination management */
        nominations: {
          /** Create new nomination */
          new: (eventId: string, categoryId: string) =>
            `/admin/events/${eventId}/categories/${categoryId}/nominations/new`,
        },
      },
    },

    /** Game management */
    games: {
      /** List all games */
      index: () => "/admin/games",
      /** Create new game */
      new: () => "/admin/games/new",
      /** View/edit game */
      detail: (gameId: string) => `/admin/games/${gameId}`,
    },

    /** People management */
    people: {
      /** List all people */
      index: () => "/admin/people",
      /** Create new person */
      new: () => "/admin/people/new",
      /** View/edit person */
      detail: (personId: string) => `/admin/people/${personId}`,
    },

    /** Works management */
    works: {
      /** List all works (with optional type filter) */
      index: (type?: string) => (type ? `/admin/works?type=${type}` : "/admin/works"),
      /** Create new work */
      new: () => "/admin/works/new",
      /** View/edit work */
      detail: (workId: string) => `/admin/works/${workId}`,
    },

    /** Live ceremony controls */
    live: (gameId?: string) => (gameId ? `/admin/live?game=${gameId}` : "/admin/live"),
  },
} as const;

/**
 * Protected route prefixes for middleware
 * These prefixes define which routes require authentication
 */
export const protectedRoutePrefixes = [
  "/picks",
  "/leaderboard",
  "/dashboard",
  "/admin",
  "/game",
] as const;

/**
 * Type helper to extract all possible route strings
 * Useful for testing and validation
 */
export type RouteString = ReturnType<
  (typeof routes)[keyof typeof routes] extends (...args: never[]) => string
    ? (typeof routes)[keyof typeof routes]
    : never
>;
