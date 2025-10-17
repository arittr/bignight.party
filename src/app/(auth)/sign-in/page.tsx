import { signIn } from "@/lib/auth/config";
import { emailSchema } from "@/schemas/auth-schema";

export default function SignInPage() {
  async function handleSignIn(formData: FormData) {
    "use server";

    const email = formData.get("email");

    // Validate email with Zod
    const result = emailSchema.safeParse({ email });

    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? "Invalid email");
    }

    // Trigger Auth.js magic link flow
    await signIn("resend", {
      email: result.data.email,
      redirect: false,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to BigNight.Party
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We'll send you a magic link to sign in
          </p>
        </div>

        <form action={handleSignIn} className="mt-8 space-y-6">
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label className="sr-only">
                Email address
                <input
                  autoComplete="email"
                  className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  name="email"
                  placeholder="Email address"
                  required
                  type="email"
                />
              </label>
            </div>
          </div>

          <div>
            <button
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              type="submit"
            >
              Send Magic Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
