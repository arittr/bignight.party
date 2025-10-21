"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function AdminEmptyState({
  icon,
  title,
  message,
  primaryAction,
  secondaryAction,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
    >
      {icon && (
        <div aria-hidden="true" className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{message}</p>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {primaryAction && <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
