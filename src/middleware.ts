import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth/config";

export default auth((req: NextRequest & { auth: Session | null }) => {
  const isAuthenticated = !!req.auth;

  const isAuthPage = req.nextUrl.pathname === "/sign-in";
  const isProtectedRoute = ["/picks", "/leaderboard", "/dashboard", "/admin"].some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to sign-in for protected routes
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
