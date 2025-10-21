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
        group relative w-full cursor-pointer transition-all overflow-hidden
        ${
          isSelected
            ? "ring-2 ring-indigo-600 shadow-lg"
            : "border-gray-200 hover:border-indigo-300 hover:shadow-md"
        }
        ${isLocked ? "cursor-not-allowed opacity-60" : ""}
      `}
      onClick={isLocked ? undefined : onClick}
      role="button"
      tabIndex={isLocked ? -1 : 0}
    >
      {/* Selection indicator - top right corner */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-indigo-600 p-1 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Image at top - vertical poster/headshot layout */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-200">
        {imageUrl ? (
          <Image
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={imageUrl}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
            <ImageIcon className="h-16 w-16 text-gray-500" />
          </div>
        )}
      </div>

      {/* Content below image */}
      <CardContent className="p-4">
        <div className="font-semibold text-lg text-gray-900 leading-tight">
          {title}
          {year && <span className="ml-1 text-gray-500 font-normal">({year})</span>}
        </div>
        {nomination.nominationText && (
          <div className="mt-2 text-sm text-gray-600 line-clamp-2">{nomination.nominationText}</div>
        )}
      </CardContent>
    </Card>
  );
}
