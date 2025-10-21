import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useConfirmDialog } from "../use-confirm-dialog";

describe("useConfirmDialog", () => {
  it("should initialize with dialog closed", () => {
    const { result } = renderHook(() => useConfirmDialog());

    expect(result.current.isOpen).toBe(false);
  });

  it("should open dialog and store callback", () => {
    const { result } = renderHook(() => useConfirmDialog());
    const mockCallback = vi.fn();

    act(() => {
      result.current.open(mockCallback);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should close dialog and clear callback", () => {
    const { result } = renderHook(() => useConfirmDialog());
    const mockCallback = vi.fn();

    act(() => {
      result.current.open(mockCallback);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("should execute callback and close dialog on confirm", async () => {
    const { result } = renderHook(() => useConfirmDialog());
    const mockCallback = vi.fn();

    act(() => {
      result.current.open(mockCallback);
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it("should handle async callback", async () => {
    const { result } = renderHook(() => useConfirmDialog());
    const mockAsyncCallback = vi.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.open(mockAsyncCallback);
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockAsyncCallback).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it("should not execute callback if none was set", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    await act(async () => {
      await result.current.confirm();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("should replace callback when opening multiple times", () => {
    const { result } = renderHook(() => useConfirmDialog());
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    act(() => {
      result.current.open(firstCallback);
    });

    act(() => {
      result.current.open(secondCallback);
    });

    act(() => {
      result.current.confirm();
    });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });

  it("should maintain stable function references", () => {
    const { result, rerender } = renderHook(() => useConfirmDialog());

    const firstOpen = result.current.open;
    const firstClose = result.current.close;
    const firstConfirm = result.current.confirm;

    rerender();

    expect(result.current.open).toBe(firstOpen);
    expect(result.current.close).toBe(firstClose);
    expect(result.current.confirm).toBe(firstConfirm);
  });
});
