"use client";

import { CheckCircle2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface NomineeCardProps {
  nomination: {
    id: string;
    nominationText: string;
    work?: {
      title: string;
      imageUrl: string | null;
      year: number | null;
    } | null;
    person?: {
      name: string;
      imageUrl: string | null;
    } | null;
  };
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export function NomineeCard({ nomination, isSelected, isLocked, onClick }: NomineeCardProps) {
  const imageUrl = nomination.person?.imageUrl || nomination.work?.imageUrl || null;
  const title = nomination.person?.name || nomination.work?.title || "Unknown";
  const year = nomination.work?.year;

  return (
    // biome-ignore lint/a11y/useSemanticElements: TODO: fix the card in general
    <Card
      className={`
        group relative w-full cursor-pointer transition-all
        ${
          isSelected
            ? "border-indigo-600 bg-indigo-50 shadow-md"
            : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
        }
        ${isLocked ? "cursor-not-allowed opacity-60" : ""}
      `}
      onClick={isLocked ? undefined : onClick}
      role="button"
      tabIndex={isLocked ? -1 : 0}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* Image or placeholder */}
          <div className="relative h-40 w-28 flex-shrink-0 overflow-hidden rounded bg-gray-200">
            {imageUrl ? (
              <Image
                alt={title}
                className="h-full w-full object-cover"
                fill
                sizes="112px"
                src={imageUrl}
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                <ImageIcon className="h-12 w-12 text-gray-500" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="font-semibold text-lg text-gray-900">
              {title}
              {year && <span className="ml-1 text-gray-500">({year})</span>}
            </div>
            {nomination.nominationText && (
              <div className="mt-2 text-base text-gray-600 whitespace-normal break-words">
                {nomination.nominationText}
              </div>
            )}
          </div>

          {/* Selection indicator */}
          {isSelected && (
            <div className="flex-shrink-0 self-center">
              <CheckCircle2 className="h-6 w-6 text-indigo-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
