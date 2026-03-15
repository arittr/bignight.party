import { getCookie, setCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";

const COOKIE_NAME = "bignight_invite";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Middleware that gates access behind an invite code.
 *
 * First visit: user must have ?invite=CODE in the URL.
 * On success, sets an httpOnly cookie so the param isn't needed again.
 * All subsequent requests are validated via the cookie.
 *
 * Set INVITE_CODE env var to enable. If not set, the gate is disabled.
 */
export const inviteGate: MiddlewareHandler = async (c, next) => {
	const inviteCode = process.env.INVITE_CODE;

	// If no invite code configured, gate is disabled — let everyone through
	if (!inviteCode) {
		return next();
	}

	// Skip API routes — they're protected by JWT auth already.
	// The invite gate only protects page loads (HTML/static assets).
	const pathname = new URL(c.req.url).pathname;
	if (pathname.startsWith("/api/")) {
		return next();
	}

	// Check URL param first (initial invite link)
	const url = new URL(c.req.url);
	const paramCode = url.searchParams.get("invite");

	if (paramCode === inviteCode) {
		// Valid invite param — set cookie and redirect to clean URL (strip param)
		// Behind a reverse proxy, always set secure=true (Caddy handles TLS)
		const isBehindProxy = !!c.req.header("x-forwarded-proto");
		setCookie(c, COOKIE_NAME, inviteCode, {
			httpOnly: true,
			secure: isBehindProxy || url.protocol === "https:",
			sameSite: "Lax",
			maxAge: COOKIE_MAX_AGE,
			path: "/",
		});

		// Redirect to strip the invite param — use pathname only to avoid http/https issues behind proxy
		if (!url.pathname.startsWith("/api/")) {
			url.searchParams.delete("invite");
			const cleanPath = url.pathname + (url.search || "");
			return c.redirect(cleanPath || "/", 302);
		}

		return next();
	}

	// Check cookie
	const cookieCode = getCookie(c, COOKIE_NAME);
	if (cookieCode === inviteCode) {
		return next();
	}

	// No valid invite — reject
	return c.text("Access denied. You need an invite link to join this game.", 403);
};
