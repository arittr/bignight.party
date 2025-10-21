"use client";

import { useCallback, useState } from "react";
import { toast } from "@/components/admin/shared/toast";

export interface FormState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

export interface ActionResult<TOutput> {
  data?: TOutput;
  serverError?: string;
  validationErrors?: Record<string, string[]>;
}

export interface SafeAction<TInput, TOutput> {
  executeAsync: (input: TInput) => Promise<ActionResult<TOutput>>;
}

export interface UseFormSubmissionOptions<TInput, TOutput> {
  action: SafeAction<TInput, TOutput>;
  onSuccess?: (data: TOutput) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  optimisticUpdate?: (input: TInput) => void;
  revertOptimistic?: () => void;
}

export interface UseFormSubmissionReturn<TInput> {
  state: FormState;
  submit: (input: TInput) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for form submission with optimistic updates and error handling
 *
 * Features:
 * - Form state management (pending, success, error)
 * - Optimistic updates with revert on error
 * - Error handling from next-safe-action
 * - Toast notification integration
 * - Success/error callbacks
 *
 * @param options - Configuration including action, callbacks, and messages
 * @returns Form state and submission handler
 *
 * @example
 * ```tsx
 * const { state, submit, reset } = useFormSubmission({
 *   action: useAction(updateEventAction),
 *   successMessage: "Event updated successfully",
 *   onSuccess: () => navigate(routes.admin.events.index()),
 *   optimisticUpdate: (input) => {
 *     setLocalEvent(input);
 *   },
 *   revertOptimistic: () => {
 *     setLocalEvent(originalEvent);
 *   },
 * });
 *
 * const handleSubmit = (data: EventInput) => {
 *   submit(data);
 * };
 * ```
 */
export function useFormSubmission<TInput, TOutput>({
  action,
  onSuccess,
  onError,
  successMessage = "Operation completed successfully",
  optimisticUpdate,
  revertOptimistic,
}: UseFormSubmissionOptions<TInput, TOutput>): UseFormSubmissionReturn<TInput> {
  const [state, setState] = useState<FormState>({
    error: null,
    isLoading: false,
    isSuccess: false,
  });

  const handleSuccess = useCallback(
    (result: { data?: TOutput }) => {
      setState({
        error: null,
        isLoading: false,
        isSuccess: true,
      });

      toast.success(successMessage);

      if (onSuccess && result?.data) {
        onSuccess(result.data);
      }
    },
    [successMessage, onSuccess]
  );

  const handleError = useCallback(
    (error: unknown) => {
      if (revertOptimistic) {
        revertOptimistic();
      }

      const errorMessage = error instanceof Error ? error.message : "An error occurred";

      setState({
        error: errorMessage,
        isLoading: false,
        isSuccess: false,
      });

      toast.error(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    },
    [revertOptimistic, onError]
  );

  const submit = useCallback(
    async (input: TInput) => {
      setState({
        error: null,
        isLoading: true,
        isSuccess: false,
      });

      if (optimisticUpdate) {
        optimisticUpdate(input);
      }

      try {
        const result = await action.executeAsync(input);

        if (result?.serverError) {
          throw new Error(result.serverError);
        }

        if (result?.validationErrors) {
          const errorMessage = Object.values(result.validationErrors).flat().join(", ");
          throw new Error(errorMessage);
        }

        handleSuccess(result);
      } catch (error) {
        handleError(error);
      }
    },
    [action, optimisticUpdate, handleSuccess, handleError]
  );

  const reset = useCallback(() => {
    setState({
      error: null,
      isLoading: false,
      isSuccess: false,
    });
  }, []);

  return {
    reset,
    state,
    submit,
  };
}
