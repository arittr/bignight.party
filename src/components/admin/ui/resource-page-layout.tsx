"use client";

import type * as React from "react";
import {
  AdminEmptyState,
  type AdminEmptyStateProps,
} from "@/components/admin/ui/admin-empty-state";
import {
  AdminPageHeader,
  type AdminPageHeaderProps,
} from "@/components/admin/ui/admin-page-header";

export interface ResourcePageLayoutProps {
  /**
   * Props for the page header (title, description, breadcrumbs, actions)
   */
  header: AdminPageHeaderProps;

  /**
   * The main content of the page (typically a table or list)
   */
  children: React.ReactNode;

  /**
   * Optional empty state to show when no resources exist
   */
  emptyState?: Omit<AdminEmptyStateProps, "className">;

  /**
   * Whether to show the empty state (controlled by parent)
   */
  showEmptyState?: boolean;

  /**
   * Optional className for the root container
   */
  className?: string;
}

/**
 * ResourcePageLayout provides consistent structure for admin resource pages
 *
 * Combines AdminPageHeader and AdminEmptyState into a single layout component
 * with standard spacing and responsive behavior.
 *
 * @example
 * ```tsx
 * <ResourcePageLayout
 *   header={{
 *     title: "Events",
 *     description: "Manage awards show events",
 *     breadcrumbs: [
 *       { label: "Admin", href: routes.admin.dashboard() },
 *       { label: "Events" },
 *     ],
 *     actions: <Button onClick={handleCreate}>Create Event</Button>,
 *   }}
 *   emptyState={{
 *     icon: <Calendar className="h-12 w-12" />,
 *     title: "No events yet",
 *     message: "Create your first event to get started",
 *     primaryAction: {
 *       label: "Create Event",
 *       onClick: handleCreate,
 *     },
 *   }}
 *   showEmptyState={events.length === 0}
 * >
 *   <EventTable events={events} />
 * </ResourcePageLayout>
 * ```
 */
export function ResourcePageLayout({
  header,
  children,
  emptyState,
  showEmptyState = false,
  className,
}: ResourcePageLayoutProps) {
  return (
    <div className={className}>
      <AdminPageHeader {...header} />

      {showEmptyState && emptyState ? (
        <AdminEmptyState {...emptyState} />
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  );
}
