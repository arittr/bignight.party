import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/admin/shared/toast";
import { useFormSubmission } from "../use-form-submission";

// Mock toast
vi.mock("@/components/admin/shared/toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useFormSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockAction = (result: unknown) => ({
    executeAsync: vi.fn().mockResolvedValue(result),
  });

  it("should initialize with default state", () => {
    const mockAction = createMockAction({ data: { id: "1" } });

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
      })
    );

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.isSuccess).toBe(false);
    expect(result.current.state.error).toBe(null);
  });

  it("should handle successful submission", async () => {
    const mockData = { id: "1", name: "Test" };
    const mockAction = createMockAction({ data: mockData });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
        onSuccess,
        successMessage: "Operation successful",
      })
    );

    await act(async () => {
      await result.current.submit({ name: "Test" });
    });

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.isSuccess).toBe(true);
    expect(result.current.state.error).toBe(null);
    expect(onSuccess).toHaveBeenCalledWith(mockData);
    expect(toast.success).toHaveBeenCalledWith("Operation successful");
  });

  it("should handle server errors", async () => {
    const mockAction = createMockAction({ serverError: "Server error occurred" });
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
        onError,
      })
    );

    await act(async () => {
      await result.current.submit({ name: "Test" });
    });

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.isSuccess).toBe(false);
    expect(result.current.state.error).toBe("Server error occurred");
    expect(onError).toHaveBeenCalledWith("Server error occurred");
    expect(toast.error).toHaveBeenCalledWith("Server error occurred");
  });

  it("should handle validation errors", async () => {
    const mockAction = createMockAction({
      validationErrors: {
        email: ["Invalid email format"],
        name: ["Name is required"],
      },
    });

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
      })
    );

    await act(async () => {
      await result.current.submit({ name: "" });
    });

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.isSuccess).toBe(false);
    expect(result.current.state.error).toContain("Name is required");
    expect(result.current.state.error).toContain("Invalid email format");
  });

  it("should apply optimistic update and revert on error", async () => {
    const mockAction = createMockAction({ serverError: "Failed" });
    const optimisticUpdate = vi.fn();
    const revertOptimistic = vi.fn();

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
        optimisticUpdate,
        revertOptimistic,
      })
    );

    await act(async () => {
      await result.current.submit({ name: "Test" });
    });

    expect(optimisticUpdate).toHaveBeenCalledWith({ name: "Test" });
    expect(revertOptimistic).toHaveBeenCalled();
  });

  it("should apply optimistic update without revert on success", async () => {
    const mockData = { id: "1", name: "Test" };
    const mockAction = createMockAction({ data: mockData });
    const optimisticUpdate = vi.fn();
    const revertOptimistic = vi.fn();

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
        optimisticUpdate,
        revertOptimistic,
      })
    );

    await act(async () => {
      await result.current.submit({ name: "Test" });
    });

    expect(optimisticUpdate).toHaveBeenCalledWith({ name: "Test" });
    expect(revertOptimistic).not.toHaveBeenCalled();
  });

  it("should reset state", async () => {
    const mockAction = createMockAction({ serverError: "Error" });

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
      })
    );

    await act(async () => {
      await result.current.submit({ name: "Test" });
    });

    expect(result.current.state.error).toBe("Error");

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.isSuccess).toBe(false);
    expect(result.current.state.error).toBe(null);
  });

  it("should set loading state during submission", async () => {
    let resolveAction: ((value: unknown) => void) | undefined;
    const mockAction = {
      executeAsync: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          })
      ),
    };

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
      })
    );

    act(() => {
      result.current.submit({ name: "Test" });
    });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(true);
    });

    await act(async () => {
      if (resolveAction) {
        resolveAction({ data: { id: "1" } });
      }
    });

    expect(result.current.state.isLoading).toBe(false);
  });

  it("should handle action execution error", async () => {
    const mockAction = {
      executeAsync: vi.fn().mockRejectedValue(new Error("Network error")),
    };

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
      })
    );

    await act(async () => {
      await result.current.submit({ name: "Test" });
    });

    expect(result.current.state.error).toBe("Network error");
    expect(toast.error).toHaveBeenCalledWith("Network error");
  });

  it("should handle non-Error exceptions", async () => {
    const mockAction = {
      executeAsync: vi.fn().mockRejectedValue("String error"),
    };

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction as never,
      })
    );

    await act(async () => {
      await result.current.submit({ name: "Test" });
    });

    expect(result.current.state.error).toBe("An error occurred");
  });
});
