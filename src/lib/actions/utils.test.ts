import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  actionError,
  actionSuccess,
  assertCondition,
  assertExists,
  handleCrudAction,
  isActionError,
  isActionSuccess,
  validateInput,
  withActionErrorHandling,
  zodErrorToFieldErrors,
} from "./utils";

describe("action utils", () => {
  describe("actionSuccess", () => {
    it("should create success response with data", () => {
      const result = actionSuccess({ id: "123" });

      expect(result).toEqual({
        data: { id: "123" },
        success: true,
      });
    });

    it("should create success response with message", () => {
      const result = actionSuccess({ id: "123" }, "Created successfully");

      expect(result).toEqual({
        data: { id: "123" },
        message: "Created successfully",
        success: true,
      });
    });

    it("should handle void data", () => {
      const result = actionSuccess(undefined);

      expect(result).toEqual({
        data: undefined,
        success: true,
      });
    });
  });

  describe("actionError", () => {
    it("should create error response", () => {
      const result = actionError("Something went wrong");

      expect(result).toEqual({
        error: "Something went wrong",
        success: false,
      });
    });

    it("should create error response with field errors", () => {
      const result = actionError("Validation failed", {
        email: ["Email is invalid"],
        name: ["Name is required"],
      });

      expect(result).toEqual({
        error: "Validation failed",
        fieldErrors: {
          email: ["Email is invalid"],
          name: ["Name is required"],
        },
        success: false,
      });
    });
  });

  describe("isActionSuccess", () => {
    it("should return true for success response", () => {
      const response = actionSuccess({ id: "123" });
      expect(isActionSuccess(response)).toBe(true);
    });

    it("should return false for error response", () => {
      const response = actionError("Error");
      expect(isActionSuccess(response)).toBe(false);
    });
  });

  describe("isActionError", () => {
    it("should return true for error response", () => {
      const response = actionError("Error");
      expect(isActionError(response)).toBe(true);
    });

    it("should return false for success response", () => {
      const response = actionSuccess({ id: "123" });
      expect(isActionError(response)).toBe(false);
    });
  });

  describe("withActionErrorHandling", () => {
    it("should return success response when function succeeds", async () => {
      const fn = async () => actionSuccess({ id: "123" });
      const result = await withActionErrorHandling(fn);

      expect(result).toEqual({
        data: { id: "123" },
        success: true,
      });
    });

    it("should catch Error and return error response", async () => {
      const fn = async () => {
        throw new Error("Operation failed");
      };
      const result = await withActionErrorHandling(fn);

      expect(result).toEqual({
        error: "Operation failed",
        success: false,
      });
    });

    it("should catch non-Error and return generic error response", async () => {
      const fn = async () => {
        throw "String error";
      };
      const result = await withActionErrorHandling(fn);

      expect(result).toEqual({
        error: "An unexpected error occurred",
        success: false,
      });
    });

    it("should return error response from function", async () => {
      const fn = async () => actionError("Custom error");
      const result = await withActionErrorHandling(fn);

      expect(result).toEqual({
        error: "Custom error",
        success: false,
      });
    });
  });

  describe("zodErrorToFieldErrors", () => {
    it("should convert Zod errors to field errors object", () => {
      const schema = z.object({
        email: z.string().email("Invalid email"),
        name: z.string().min(1, "Name is required"),
      });

      const result = schema.safeParse({
        email: "invalid",
        name: "",
      });

      if (!result.success) {
        const fieldErrors = zodErrorToFieldErrors(result.error);

        expect(fieldErrors).toHaveProperty("name");
        expect(fieldErrors).toHaveProperty("email");
        expect(fieldErrors.name).toContain("Name is required");
        expect(fieldErrors.email).toContain("Invalid email");
      } else {
        throw new Error("Expected validation to fail");
      }
    });

    it("should handle nested field errors", () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
        }),
      });

      const result = schema.safeParse({
        user: { name: "" },
      });

      if (!result.success) {
        const fieldErrors = zodErrorToFieldErrors(result.error);

        expect(fieldErrors).toHaveProperty("user.name");
      } else {
        throw new Error("Expected validation to fail");
      }
    });

    it("should handle multiple errors for same field", () => {
      const schema = z.object({
        password: z.string().min(8, "Too short").max(20, "Too long"),
      });

      const result = schema.safeParse({
        password: "short",
      });

      if (!result.success) {
        const fieldErrors = zodErrorToFieldErrors(result.error);

        expect(fieldErrors.password).toHaveLength(1);
        expect(fieldErrors.password[0]).toBe("Too short");
      }
    });
  });

  describe("validateInput", () => {
    it("should return success for valid input", () => {
      const schema = z.object({
        age: z.number(),
        name: z.string(),
      });

      const result = validateInput(schema, {
        age: 30,
        name: "John",
      });

      expect(isActionSuccess(result)).toBe(true);
      if (isActionSuccess(result)) {
        expect(result.data).toEqual({ age: 30, name: "John" });
      }
    });

    it("should return error for invalid input", () => {
      const schema = z.object({
        age: z.number(),
        name: z.string(),
      });

      const result = validateInput(schema, {
        age: "not a number",
        name: "John",
      });

      expect(isActionError(result)).toBe(true);
      if (isActionError(result)) {
        expect(result.error).toBe("Validation failed");
        expect(result.fieldErrors).toBeDefined();
        expect(result.fieldErrors?.age).toBeDefined();
      }
    });

    it("should handle coercion", () => {
      const schema = z.object({
        id: z.coerce.number(),
      });

      const result = validateInput(schema, { id: "123" });

      expect(isActionSuccess(result)).toBe(true);
      if (isActionSuccess(result)) {
        expect(result.data.id).toBe(123);
      }
    });
  });

  describe("handleCrudAction", () => {
    it("should return success when operation succeeds", async () => {
      const mockOperation = vi.fn().mockResolvedValue({ id: "123" });

      const result = await handleCrudAction({
        operation: mockOperation,
        successMessage: "Created successfully",
      });

      expect(isActionSuccess(result)).toBe(true);
      if (isActionSuccess(result)) {
        expect(result.data).toEqual({ id: "123" });
        expect(result.message).toBe("Created successfully");
      }
    });

    it("should return error when operation fails", async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error("Database error"));

      const result = await handleCrudAction({
        operation: mockOperation,
      });

      expect(isActionError(result)).toBe(true);
      if (isActionError(result)) {
        expect(result.error).toBe("Database error");
      }
    });

    it("should use custom error transformer", async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error("NOT_FOUND"));

      const result = await handleCrudAction({
        operation: mockOperation,
        transformError: (error) => {
          if (error.message === "NOT_FOUND") {
            return "Resource not found";
          }
          return error.message;
        },
      });

      expect(isActionError(result)).toBe(true);
      if (isActionError(result)) {
        expect(result.error).toBe("Resource not found");
      }
    });

    it("should handle non-Error rejections", async () => {
      const mockOperation = vi.fn().mockRejectedValue("String error");

      const result = await handleCrudAction({
        operation: mockOperation,
      });

      expect(isActionError(result)).toBe(true);
      if (isActionError(result)) {
        expect(result.error).toBe("Operation failed");
      }
    });
  });

  describe("assertExists", () => {
    it("should not throw when value exists", () => {
      const value = { id: "123" };
      expect(() => assertExists(value, "Not found")).not.toThrow();
    });

    it("should throw when value is null", () => {
      const value = null;
      expect(() => assertExists(value, "Not found")).toThrow("Not found");
    });

    it("should throw when value is undefined", () => {
      const value = undefined;
      expect(() => assertExists(value, "Not found")).toThrow("Not found");
    });

    it("should narrow type after assertion", () => {
      const value: string | null = "test";
      assertExists(value, "Not found");
      // Type should be narrowed to string (not string | null)
      const length: number = value.length;
      expect(length).toBe(4);
    });
  });

  describe("assertCondition", () => {
    it("should not throw when condition is true", () => {
      expect(() => assertCondition(true, "Failed")).not.toThrow();
    });

    it("should throw when condition is false", () => {
      expect(() => assertCondition(false, "Failed")).toThrow("Failed");
    });

    it("should work with complex conditions", () => {
      const user = { role: "ADMIN" };
      expect(() => assertCondition(user.role === "ADMIN", "Must be admin")).not.toThrow();
      expect(() => assertCondition(user.role === "USER", "Must be user")).toThrow("Must be user");
    });
  });

  describe("type safety", () => {
    it("should preserve generic types in actionSuccess", () => {
      interface User {
        id: string;
        name: string;
      }

      const result = actionSuccess<User>({ id: "123", name: "John" });

      if (isActionSuccess(result)) {
        // TypeScript should know result.data is User
        const name: string = result.data.name;
        expect(name).toBe("John");
      }
    });

    it("should work with validateInput type inference", () => {
      const schema = z.object({
        count: z.number(),
        id: z.string(),
      });

      const result = validateInput(schema, { count: 5, id: "123" });

      if (isActionSuccess(result)) {
        // TypeScript should infer the type from schema
        const id: string = result.data.id;
        const count: number = result.data.count;
        expect(id).toBe("123");
        expect(count).toBe(5);
      }
    });
  });
});
