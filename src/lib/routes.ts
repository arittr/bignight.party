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
  /**
   * Admin routes (admin role required)
   */
  admin: {
    /** Event management */
    events: {
      /** Category management */
      categories: {
        /** View/edit category */
        detail: (eventId: string, categoryId: string) =>
          `/admin/events/${eventId}/categories/${categoryId}`,
        /** Create new category */
        new: (eventId: string) => `/admin/events/${eventId}/categories/new`,

        /** Nomination management */
        nominations: {
          /** Create new nomination */
          new: (eventId: string, categoryId: string) =>
            `/admin/events/${eventId}/categories/${categoryId}/nominations/new`,
        },
      },
      /** View/edit event */
      detail: (eventId: string) => `/admin/events/${eventId}`,
      /** List all events */
      index: () => "/admin/events",
      /** Create new event */
      new: () => "/admin/events/new",
    },

    /** Game management */
    games: {
      /** View/edit game */
      detail: (gameId: string) => `/admin/games/${gameId}`,
      /** List all games */
      index: () => "/admin/games",
      /** Create new game */
      new: () => "/admin/games/new",
    },

    /** Wikipedia import */
    import: () => "/admin/import",
    /** Admin home */
    index: () => "/admin",

    /** Live ceremony controls */
    live: (gameId?: string) => (gameId ? `/admin/live?game=${gameId}` : "/admin/live"),

    /** People management */
    people: {
      /** View/edit person */
      detail: (personId: string) => `/admin/people/${personId}`,
      /** List all people */
      index: () => "/admin/people",
      /** Create new person */
      new: () => "/admin/people/new",
    },

    /** Works management */
    works: {
      /** View/edit work */
      detail: (workId: string) => `/admin/works/${workId}`,
      /** List all works (with optional type filter) */
      index: (type?: string) => (type ? `/admin/works?type=${type}` : "/admin/works"),
      /** Create new work */
      new: () => "/admin/works/new",
    },
  },

  /**
   * User dashboard (authentication required)
   */
  dashboard: () => "/dashboard",

  /**
   * Game routes (authentication required)
   */
  game: {
    /** Leaderboard page */
    leaderboard: (gameId: string) => `/game/${gameId}/leaderboard`,
    /** Pick wizard page */
    pick: (gameId: string, categoryId?: string) =>
      categoryId ? `/game/${gameId}/pick?category=${categoryId}` : `/game/${gameId}/pick`,
  },
  /** Home page */
  home: () => "/",

  /** Join game with access code */
  join: (code: string) => `/join/${code}`,

  /** Sign in page */
  signIn: () => "/sign-in",

  /** Sign up flow */
  signup: {
    /** Email verification callback */
    callback: (code?: string) => (code ? `/signup/callback?code=${code}` : "/signup/callback"),
    /** Initial signup page with optional code */
    index: (code?: string) => (code ? `/signup?code=${code}` : "/signup"),
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
