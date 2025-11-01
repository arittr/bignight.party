"use client";

import { useId, useState } from "react";
import { api } from "@/lib/api/client";

export default function SignInPage() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "executing" | "hasSucceeded" | "hasErrored">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const mutation = (api.auth.signIn as any).useMutation?.() || null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("executing");
    setErrorMessage("");

    try {
      const result = await (api.auth.signIn as any)({
        email,
      });

      if (result.success) {
        setEmail("");
        setStatus("hasSucceeded");
      } else {
        setStatus("hasErrored");
        setErrorMessage(result.message || "Failed to send magic link. Please try again.");
      }
    } catch (error) {
      setStatus("hasErrored");
      setErrorMessage(error instanceof Error ? error.message : "Failed to send magic link. Please try again.");
    }
  };

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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label className="sr-only" htmlFor={emailId}>
                Email address
              </label>
              <input
                autoComplete="email"
                className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                id={emailId}
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          {status === "hasSucceeded" && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Magic link sent! Check your email.
              </p>
            </div>
          )}

          {status === "hasErrored" && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                {errorMessage}
              </p>
            </div>
          )}

          <div>
            <button
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              disabled={status === "executing"}
              type="submit"
            >
              {status === "executing" ? "Sending..." : "Send Magic Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
