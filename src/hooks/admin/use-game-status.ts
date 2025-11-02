"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";
import { toast } from "@/components/admin/shared/toast";
import { orpc } from "@/lib/api/client";

export type GameStatus = "SETUP" | "OPEN" | "LIVE" | "COMPLETED";

export interface UseGameStatusOptions {
  gameId: string;
  initialStatus: GameStatus;
  onStatusChanged?: (newStatus: GameStatus) => void;
}

export interface UseGameStatusReturn {
  currentStatus: GameStatus;
  isTransitioning: boolean;
  availableTransitions: GameStatus[];
  canTransitionTo: (status: GameStatus) => boolean;
  transitionTo: (status: GameStatus) => Promise<void>;
}

/**
 * Custom hook for game status machine transitions using ts-pattern
 *
 * Status flow: SETUP → OPEN → LIVE → COMPLETED
 *
 * Features:
 * - Valid transition validation using ts-pattern
 * - Exhaustive pattern matching for all states
 * - Prevents invalid transitions
 * - Optimistic updates with revert on error
 * - Toast notifications
 *
 * @param options - Configuration including game ID, initial status, and callbacks
 * @returns Status state and transition handlers
 *
 * @example
 * ```tsx
 * const { currentStatus, availableTransitions, transitionTo } = useGameStatus({
 *   gameId: "game-123",
 *   initialStatus: "SETUP",
 *   onStatusChanged: () => router.refresh(),
 * });
 *
 * const handleOpenGame = async () => {
 *   await transitionTo("OPEN");
 * };
 * ```
 */
export function useGameStatus({
  gameId,
  initialStatus,
  onStatusChanged,
}: UseGameStatusOptions): UseGameStatusReturn {
  const [currentStatus, setCurrentStatus] = useState<GameStatus>(initialStatus);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const updateGameMutation = useMutation(orpc.admin.games.update.mutationOptions());

  /**
   * Get available transitions from current status using ts-pattern
   */
  const availableTransitions = useMemo((): GameStatus[] => {
    return match(currentStatus)
      .with("SETUP", () => ["OPEN"] as GameStatus[])
      .with("OPEN", () => ["LIVE"] as GameStatus[])
      .with("LIVE", () => ["COMPLETED"] as GameStatus[])
      .with("COMPLETED", () => [] as GameStatus[])
      .exhaustive();
  }, [currentStatus]);

  /**
   * Check if a transition to target status is valid
   */
  const canTransitionTo = useCallback(
    (targetStatus: GameStatus): boolean => {
      return availableTransitions.includes(targetStatus);
    },
    [availableTransitions]
  );

  /**
   * Get user-friendly status transition message
   */
  const getTransitionMessage = useCallback((from: GameStatus, to: GameStatus): string => {
    return match([from, to] as const)
      .with(["SETUP", "OPEN"], () => "Game opened for picks")
      .with(["OPEN", "LIVE"], () => "Game is now live")
      .with(["LIVE", "COMPLETED"], () => "Game completed")
      .otherwise(() => `Status changed to ${to}`);
  }, []);

  /**
   * Validate transition and show error if invalid
   */
  const validateTransition = useCallback(
    (targetStatus: GameStatus): boolean => {
      if (canTransitionTo(targetStatus)) {
        return true;
      }

      const errorMessage = match(currentStatus)
        .with("SETUP", () => "Can only open game from setup")
        .with("OPEN", () => "Can only start live ceremony from open")
        .with("LIVE", () => "Can only complete from live")
        .with("COMPLETED", () => "Cannot transition from completed state")
        .exhaustive();

      toast.error(errorMessage);
      return false;
    },
    [currentStatus, canTransitionTo]
  );

  /**
   * Execute transition with optimistic update
   */
  const executeTransition = useCallback(
    async (targetStatus: GameStatus, originalStatus: GameStatus) => {
      await updateGameMutation.mutateAsync({
        id: gameId,
        status: targetStatus,
      });

      const successMessage = getTransitionMessage(originalStatus, targetStatus);
      toast.success(successMessage);

      if (onStatusChanged) {
        onStatusChanged(targetStatus);
      }
    },
    [gameId, updateGameMutation, getTransitionMessage, onStatusChanged]
  );

  /**
   * Transition to new status with validation
   */
  const transitionTo = useCallback(
    async (targetStatus: GameStatus) => {
      if (!validateTransition(targetStatus)) {
        return;
      }

      setIsTransitioning(true);
      const originalStatus = currentStatus;

      try {
        setCurrentStatus(targetStatus);
        await executeTransition(targetStatus, originalStatus);
      } catch (error) {
        setCurrentStatus(originalStatus);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update game status";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsTransitioning(false);
      }
    },
    [currentStatus, validateTransition, executeTransition]
  );

  return {
    availableTransitions,
    canTransitionTo,
    currentStatus,
    isTransitioning,
    transitionTo,
  };
}
