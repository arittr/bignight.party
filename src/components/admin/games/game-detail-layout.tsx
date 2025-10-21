"use client";

import type { Event, Game, GameStatus, User } from "@prisma/client";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import * as React from "react";
import { match } from "ts-pattern";
import { AdminTable, type AdminTableColumn } from "@/components/admin/ui/admin-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { GameStatusBadge } from "./game-status-badge";

export interface GameWithDetails extends Game {
  event: Event;
  participants: Array<{
    id: string;
    userId: string;
    joinedAt: Date;
    user: User;
  }>;
  _count?: {
    picks: number;
  };
}

export interface ParticipantWithPickStatus {
  id: string;
  userId: string;
  user: User;
  joinedAt: Date;
  hasSubmittedPicks: boolean;
}

export interface GameDetailLayoutProps {
  game: GameWithDetails;
  participantsWithPicks: ParticipantWithPickStatus[];
  onStatusTransition: (newStatus: GameStatus) => void;
  isTransitioning?: boolean;
  className?: string;
}

/**
 * Game detail layout with info header, participant list, and status transition controls.
 * Handles status machine transitions with confirmation dialogs.
 */
export function GameDetailLayout({
  game,
  participantsWithPicks,
  onStatusTransition,
  isTransitioning = false,
  className,
}: GameDetailLayoutProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<GameStatus | null>(null);

  const handleTransitionClick = (newStatus: GameStatus) => {
    setPendingStatus(newStatus);
    setConfirmDialogOpen(true);
  };

  const handleConfirmTransition = () => {
    if (pendingStatus) {
      onStatusTransition(pendingStatus);
      setConfirmDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const handleCancelTransition = () => {
    setConfirmDialogOpen(false);
    setPendingStatus(null);
  };

  // Get available transitions based on current status using ts-pattern
  const availableTransitions = match(game.status)
    .with("SETUP", () => [
      {
        description: "Allow participants to submit picks",
        label: "Open for Picks",
        status: "OPEN" as const,
      },
    ])
    .with("OPEN", () => [
      {
        description: "Lock picks and begin revealing winners",
        label: "Start Live Ceremony",
        status: "LIVE" as const,
      },
    ])
    .with("LIVE", () => [
      {
        description: "Mark ceremony as finished",
        label: "Complete Ceremony",
        status: "COMPLETED" as const,
      },
    ])
    .with("COMPLETED", () => [])
    .exhaustive();

  const participantColumns: AdminTableColumn<ParticipantWithPickStatus>[] = [
    {
      key: "name",
      label: "Participant",
      render: (p) => p.user.name ?? p.user.email,
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
      render: (p) => p.user.email,
      sortable: true,
    },
    {
      key: "joinedAt",
      label: "Joined",
      render: (p) => format(new Date(p.joinedAt), "MMM d, yyyy h:mm a"),
      sortable: true,
    },
    {
      key: "picks",
      label: "Picks Status",
      render: (p) =>
        p.hasSubmittedPicks ? (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            Submitted
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600">
            <XCircle className="h-4 w-4" />
            Not submitted
          </span>
        ),
      sortable: true,
    },
  ];

  const submittedCount = participantsWithPicks.filter((p) => p.hasSubmittedPicks).length;
  const totalParticipants = participantsWithPicks.length;

  return (
    <div className={className}>
      {/* Game Info Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{game.name}</CardTitle>
              <CardDescription>
                {game.event.name} - {format(new Date(game.event.eventDate), "MMMM d, yyyy")}
              </CardDescription>
            </div>
            <GameStatusBadge status={game.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Access Code</p>
              <p className="text-lg font-mono font-semibold">{game.accessCode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Picks Lock Time</p>
              <p className="text-lg">
                {game.picksLockAt
                  ? format(new Date(game.picksLockAt), "MMM d, yyyy h:mm a")
                  : "Not set"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Picks Summary */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Picks Summary</p>
            <div className="flex items-center gap-2">
              {submittedCount === totalParticipants && totalParticipants > 0 ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    All participants have submitted their picks ({submittedCount}/
                    {totalParticipants})
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {submittedCount} of {totalParticipants} participants have submitted picks
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Status Transition Buttons */}
          {availableTransitions.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Status Transitions</p>
                <div className="flex gap-2">
                  {availableTransitions.map((transition) => (
                    <Button
                      aria-label={`Transition to ${transition.label}`}
                      disabled={isTransitioning}
                      key={transition.status}
                      onClick={() => handleTransitionClick(transition.status)}
                    >
                      {transition.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Participant List */}
      <Card>
        <CardHeader>
          <CardTitle>Participants ({totalParticipants})</CardTitle>
          <CardDescription>
            Users who have joined this game and their pick submission status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTable
            ariaLabel="Participants table"
            columns={participantColumns}
            data={participantsWithPicks}
            emptyState="No participants yet. Share the access code to invite users."
          />
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog onOpenChange={setConfirmDialogOpen} open={confirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              {pendingStatus &&
                match(pendingStatus)
                  .with(
                    "OPEN",
                    () =>
                      "Are you sure you want to open this game for picks? Participants will be able to submit their predictions."
                  )
                  .with(
                    "LIVE",
                    () =>
                      "Are you sure you want to start the live ceremony? This will lock all picks and begin revealing winners."
                  )
                  .with(
                    "COMPLETED",
                    () =>
                      "Are you sure you want to complete this ceremony? This will finalize all results."
                  )
                  .otherwise(() => "Are you sure you want to change the status?")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCancelTransition} variant="outline">
              Cancel
            </Button>
            <Button disabled={isTransitioning} onClick={handleConfirmTransition}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
