"use client";

import { WorkType } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TypeFilterProps {
  className?: string;
}

const workTypeOptions = [
  { label: "All Types", value: "all" },
  { label: "Film", value: WorkType.FILM },
  { label: "TV Show", value: WorkType.TV_SHOW },
  { label: "Album", value: WorkType.ALBUM },
  { label: "Song", value: WorkType.SONG },
  { label: "Play", value: WorkType.PLAY },
  { label: "Book", value: WorkType.BOOK },
];

export function TypeFilter({ className }: TypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") ?? "all";

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : "";

    router.push(newUrl, { scroll: false });
  };

  return (
    <div className={className}>
      <Select defaultValue={currentType} onValueChange={handleTypeChange}>
        <SelectTrigger aria-label="Filter by work type" className="w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          {workTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
