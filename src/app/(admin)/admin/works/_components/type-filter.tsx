"use client";

import { WorkType } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";

export function TypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const type = e.target.value;
    if (type) {
      router.push(`/admin/works?type=${type}`);
    } else {
      router.push("/admin/works");
    }
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="typeFilter">
        Filter by Type
      </label>
      <select
        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        id="typeFilter"
        name="type"
        onChange={handleChange}
        value={currentType}
      >
        <option value="">All Types</option>
        <option value={WorkType.FILM}>Film</option>
        <option value={WorkType.TV_SHOW}>TV Show</option>
        <option value={WorkType.ALBUM}>Album</option>
        <option value={WorkType.SONG}>Song</option>
        <option value={WorkType.PLAY}>Play</option>
        <option value={WorkType.BOOK}>Book</option>
      </select>
    </div>
  );
}
