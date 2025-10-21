"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("space-y-4 pb-6", className)}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <li className="flex items-center gap-2" key={crumb.href ?? crumb.label}>
                {index > 0 && <ChevronRight aria-hidden="true" className="h-4 w-4" />}
                {crumb.href ? (
                  <Link className="hover:text-foreground transition-colors" href={crumb.href}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <Separator />
    </div>
  );
}
