import type { z } from "zod";

/**
 * Generic action wrapper utilities for standardizing action responses
 */

/**
 * Standard success response shape
 */
export interface ActionSuccess<T = void> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard error response shape
 */
export interface ActionError {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Action response type (success or error)
 */
export type ActionResponse<T = void> = ActionSuccess<T> | ActionError;

/**
 * Creates a standardized success response
 *
 * @example
 * ```ts
 * return actionSuccess({ id: "123" }, "Event created successfully");
 * ```
 */
export function actionSuccess<T>(data: T, message?: string): ActionSuccess<T> {
  return {
    data,
    message,
    success: true,
  };
}

/**
 * Creates a standardized error response
 *
 * @example
 * ```ts
 * return actionError("Event not found");
 * return actionError("Validation failed", { name: ["Name is required"] });
 * ```
 */
export function actionError(error: string, fieldErrors?: Record<string, string[]>): ActionError {
  return {
    error,
    fieldErrors,
    success: false,
  };
}

/**
 * Type guard to check if response is a success
 */
export function isActionSuccess<T>(response: ActionResponse<T>): response is ActionSuccess<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isActionError<T>(response: ActionResponse<T>): response is ActionError {
  return response.success === false;
}

/**
 * Wraps an async function with standardized error handling
 *
 * @example
 * ```ts
 * export const deleteEvent = adminAction
 *   .schema(z.object({ id: z.string() }))
 *   .action(async ({ parsedInput }) => {
 *     return withActionErrorHandling(async () => {
 *       await eventService.delete(parsedInput.id);
 *       return actionSuccess(undefined, "Event deleted successfully");
 *     });
 *   });
 * ```
 */
export async function withActionErrorHandling<T>(
  fn: () => Promise<ActionResponse<T>>
): Promise<ActionResponse<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      return actionError(error.message);
    }
    return actionError("An unexpected error occurred");
  }
}

/**
 * Converts Zod validation errors to field errors object
 */
export function zodErrorToFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
}

/**
 * Validates input with Zod schema and returns ActionResponse
 *
 * @example
 * ```ts
 * const result = validateInput(eventCreateSchema, input);
 * if (isActionError(result)) {
 *   return result; // Return validation error
 * }
 * // Use result.data (typed correctly)
 * ```
 */
export function validateInput<T extends z.ZodType>(
  schema: T,
  input: unknown
): ActionResponse<z.infer<T>> {
  const result = schema.safeParse(input);

  if (!result.success) {
    return actionError("Validation failed", zodErrorToFieldErrors(result.error));
  }

  return actionSuccess(result.data);
}

/**
 * Generic handler for common CRUD action patterns
 */
export interface CrudActionHandlers<TInput, TOutput> {
  /**
   * The actual operation to perform
   */
  operation: (input: TInput) => Promise<TOutput>;

  /**
   * Success message to return
   */
  successMessage?: string;

  /**
   * Optional error message transformer
   */
  transformError?: (error: Error) => string;
}

/**
 * Wraps a CRUD operation with standardized error handling and response formatting
 *
 * @example
 * ```ts
 * export const createEvent = adminAction
 *   .schema(eventCreateSchema)
 *   .action(async ({ parsedInput }) => {
 *     return handleCrudAction({
 *       operation: () => eventService.create(parsedInput),
 *       successMessage: "Event created successfully",
 *     });
 *   });
 * ```
 */
export async function handleCrudAction<TInput, TOutput>({
  operation,
  successMessage,
  transformError,
}: CrudActionHandlers<TInput, TOutput>): Promise<ActionResponse<TOutput>> {
  return withActionErrorHandling(async () => {
    try {
      const result = await operation({} as TInput);
      return actionSuccess(result, successMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? transformError
            ? transformError(error)
            : error.message
          : "Operation failed";
      return actionError(errorMessage);
    }
  });
}

/**
 * Utility to assert that a value exists, throwing an error if it doesn't
 *
 * @example
 * ```ts
 * const event = await eventModel.findById(id);
 * assertExists(event, "Event not found");
 * // event is now typed as non-null
 * ```
 */
export function assertExists<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Utility to assert a condition is true, throwing an error if it isn't
 *
 * @example
 * ```ts
 * assertCondition(user.role === "ADMIN", "Must be admin");
 * ```
 */
export function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
