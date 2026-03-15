import { useState, useEffect, useCallback, useRef } from "react";
import { WEBSOCKET_EVENTS, REACTION_TTL_MS } from "@bignight/shared";
import { useAuth } from "../auth";
import { getSocket } from "../socket";

export interface FloatingReaction {
  id: string;
  emoji: string;
  name: string;
  playerId: string;
  rank: number | null;
}

export function useReactions() {
  const { token } = useAuth();
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!token) return;
      const socket = getSocket(token);
      socket.emit(WEBSOCKET_EVENTS.REACTION_SEND, { emoji });
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    const onBroadcast = (data: FloatingReaction) => {
      setReactions((prev) => [...prev, data]);

      const timer = setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== data.id));
        timersRef.current.delete(data.id);
      }, REACTION_TTL_MS);

      timersRef.current.set(data.id, timer);
    };

    socket.on(WEBSOCKET_EVENTS.REACTION_BROADCAST, onBroadcast);

    return () => {
      socket.off(WEBSOCKET_EVENTS.REACTION_BROADCAST, onBroadcast);
      // Clean up all timers
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, [token]);

  return { reactions, sendReaction };
}
