"use client";

import { GameStatus } from "@prisma/client";
import { match } from "ts-pattern";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface GameStatusBadgeProps {
  status: GameStatus;
  className?: string;
}

/**
 * Color-coded badge for game status with tooltip descriptions.
 * Status colors: SETUP=gray, OPEN=blue, LIVE=green, COMPLETED=purple
 */
export function GameStatusBadge({ status, className }: GameStatusBadgeProps) {
  const badgeConfig = match(status)
    .with(GameStatus.SETUP, () => ({
      description: "Game is being configured and not yet accepting picks",
      label: "Setup",
      variant: "secondary" as const,
    }))
    .with(GameStatus.OPEN, () => ({
      description: "Game is accepting picks from participants",
      label: "Open",
      variant: "default" as const,
    }))
    .with(GameStatus.LIVE, () => ({
      description: "Ceremony is in progress, picks are locked",
      label: "Live",
      variant: "success" as const,
    }))
    .with(GameStatus.COMPLETED, () => ({
      description: "Ceremony has ended, final results available",
      label: "Completed",
      variant: "outline" as const,
    }))
    .exhaustive();

  return (
    <Badge
      aria-label={`Game status: ${badgeConfig.label}. ${badgeConfig.description}`}
      className={cn(className)}
      title={badgeConfig.description}
      variant={badgeConfig.variant}
    >
      {badgeConfig.label}
    </Badge>
  );
}
