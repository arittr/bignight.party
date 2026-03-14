import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { GamePhase, GameConfig } from "@bignight/shared";
import { WEBSOCKET_EVENTS, GameStateResponseSchema } from "@bignight/shared";
import { useAuth } from "../auth";
import { getSocket } from "../socket";

interface GameState {
  phase: GamePhase;
  config: GameConfig | null;
  categoryCount: number;
  isLoading: boolean;
  lockWarning: boolean; // true when < 30 min until lock
}

export function useGameState(): GameState {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [lockWarning, setLockWarning] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["game-state"],
    queryFn: async () => {
      const res = await fetch("/api/game", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return GameStateResponseSchema.parse(await res.json());
    },
    refetchInterval: 30000, // Poll every 30s
  });

  // Lock warning timer
  useEffect(() => {
    if (!data?.config?.picksLockAt) {
      setLockWarning(false);
      return;
    }
    const check = () => {
      const remaining = data.config.picksLockAt - Date.now();
      setLockWarning(remaining > 0 && remaining < 30 * 60 * 1000);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [data?.config?.picksLockAt]);

  // Listen for WebSocket events and refetch game state
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    const refetch = () => {
      queryClient.invalidateQueries({ queryKey: ["game-state"] });
    };

    socket.on(WEBSOCKET_EVENTS.PICKS_LOCKED, refetch);
    socket.on(WEBSOCKET_EVENTS.GAME_COMPLETED, refetch);

    return () => {
      socket.off(WEBSOCKET_EVENTS.PICKS_LOCKED, refetch);
      socket.off(WEBSOCKET_EVENTS.GAME_COMPLETED, refetch);
    };
  }, [token, queryClient]);

  return {
    phase: data?.phase ?? "setup",
    config: data?.config ?? null,
    categoryCount: data?.categoryCount ?? 0,
    isLoading,
    lockWarning,
  };
}
