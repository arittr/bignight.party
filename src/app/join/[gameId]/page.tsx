import { redirect } from "next/navigation";
import Link from "next/link";
import { requireValidatedSession } from "@/lib/auth/config";
import { serverClient } from "@/lib/api/server-client";
import { routes } from "@/lib/routes";

interface PageProps {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default async function JoinGamePage({ params, searchParams }: PageProps) {
  // Require authentication first
  await requireValidatedSession();

  // Await params and searchParams per Next.js 15 conventions
  const { gameId } = await params;
  const { code } = await searchParams;

  // Redirect to dashboard if code param is missing
  if (!code) {
    redirect(routes.dashboard());
  }

  try {
    // Call join API with both gameId and accessCode
    await serverClient.game.join({
      gameId,
      accessCode: code,
    });

    // Success: redirect to pick wizard
    redirect(routes.game.pick(gameId));
  } catch (error) {
    // Error: display error message with link to dashboard
    const errorMessage =
      error instanceof Error ? error.message : "Failed to join game. Please try again.";

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Unable to Join Game</h1>
            </div>

            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>

            <div className="text-center">
              <Link
                href={routes.dashboard()}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
