import { useState, useEffect } from "react";
import type { LeaderboardPlayer } from "@bignight/shared";
import { WEBSOCKET_EVENTS, LeaderboardResponseSchema } from "@bignight/shared";
import { useAuth } from "../auth";
import { getSocket } from "../socket";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface JustAnnounced {
  categoryName: string;
  winnerTitle: string;
}

export function useLeaderboard() {
  const { token } = useAuth();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [justAnnounced, setJustAnnounced] = useState<JustAnnounced | null>(
    null,
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Fetch initial leaderboard
  useEffect(() => {
    fetch("/api/game/leaderboard", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((raw) => {
        const data = LeaderboardResponseSchema.parse(raw);
        setPlayers(data.players);
        setRevealedCount(data.revealedCount);
        setTotalCount(data.totalCount);
      })
      .catch(() => {});
  }, [token]);

  // WebSocket subscription
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");

    const onLeaderboardUpdate = (data: {
      players?: LeaderboardPlayer[];
      revealedCategory?: { name: string; winnerTitle: string };
      revealedCount?: number;
      totalCount?: number;
    }) => {
      if (data.players) setPlayers(data.players);
      if (data.revealedCategory) {
        setJustAnnounced({
          categoryName: data.revealedCategory.name,
          winnerTitle: data.revealedCategory.winnerTitle,
        });
        // Auto-clear after 3s
        setTimeout(() => setJustAnnounced(null), 3000);
      }
      if (data.revealedCount !== undefined)
        setRevealedCount(data.revealedCount);
      if (data.totalCount !== undefined) setTotalCount(data.totalCount);
    };

    const onGameCompleted = () => setIsGameComplete(true);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(WEBSOCKET_EVENTS.LEADERBOARD_UPDATE, onLeaderboardUpdate);
    socket.on(WEBSOCKET_EVENTS.GAME_COMPLETED, onGameCompleted);

    if (socket.connected) setConnectionStatus("connected");

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(WEBSOCKET_EVENTS.LEADERBOARD_UPDATE, onLeaderboardUpdate);
      socket.off(WEBSOCKET_EVENTS.GAME_COMPLETED, onGameCompleted);
    };
  }, [token]);

  return {
    players,
    connectionStatus,
    justAnnounced,
    revealedCount,
    totalCount,
    isGameComplete,
  };
}
