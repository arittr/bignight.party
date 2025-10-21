"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface AdminSidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface AdminSidebarSection {
  title?: string;
  items: AdminSidebarItem[];
}

export interface AdminSidebarProps {
  sections: AdminSidebarSection[];
  className?: string;
}

export function AdminSidebar({ sections, className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className={cn("w-64 border-r bg-muted/10", className)}>
      <ScrollArea className="h-full py-6">
        <div className="space-y-6 px-3">
          {sections.map((section) => (
            <div className="space-y-1" key={section.title ?? section.items[0]?.href ?? "section"}>
              {section.title && (
                <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h2>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive && "bg-accent text-accent-foreground font-medium"
                        )}
                        href={item.href}
                      >
                        {item.icon && (
                          <span aria-hidden="true" className="flex-shrink-0">
                            {item.icon}
                          </span>
                        )}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </nav>
  );
}
