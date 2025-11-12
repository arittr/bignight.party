import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { SignupForm } from "./signup-form";

interface SignupPageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const session = await auth();
  const params = await searchParams;

  // If already authenticated, redirect to dashboard
  // The dashboard or a separate callback handler will handle joining the game
  if (session?.user?.id) {
    // If there's a code, store it in the redirect URL
    if (params.code) {
      redirect(`/signup/callback?code=${params.code}`);
    }
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Join BigNight.Party
          </h2>
          {params.code ? (
            <div className="mt-4 rounded-md bg-indigo-50 p-4">
              <p className="text-sm text-indigo-800">
                You'll join the game after signing in
              </p>
              <p className="mt-1 text-xs text-indigo-600">Access code: {params.code}</p>
            </div>
          ) : (
            <p className="mt-2 text-center text-sm text-gray-600">
              We'll send you a magic link to sign in
            </p>
          )}
        </div>

        <SignupForm code={params.code} />
      </div>
    </div>
  );
}
