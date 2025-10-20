"use client";

import { useAction } from "next-safe-action/hooks";
import { useId, useState, useEffect } from "react";
import { signInAction } from "@/lib/actions/auth-actions";

interface SignupFormProps {
  code?: string;
}

export function SignupForm({ code }: SignupFormProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const { execute, status } = useAction(signInAction, {
    onSuccess: () => {
      setEmail("");
      // Store the code in sessionStorage if it exists
      if (code) {
        sessionStorage.setItem("pendingInviteCode", code);
      }
    },
  });

  // Store code in sessionStorage when component mounts
  useEffect(() => {
    if (code) {
      sessionStorage.setItem("pendingInviteCode", code);
    }
  }, [code]);

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        execute({ email });
      }}
    >
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
            Magic link sent! Check your email to complete sign in.
          </p>
          {code && (
            <p className="mt-1 text-xs text-green-700">
              You'll be automatically joined to the game after signing in.
            </p>
          )}
        </div>
      )}

      {status === "hasErrored" && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Failed to send magic link. Please try again.
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
  );
}
