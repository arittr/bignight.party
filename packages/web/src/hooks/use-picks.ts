import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { PicksResponseSchema, SubmitPickResponseSchema } from "@bignight/shared";
import { useAuth } from "../auth";
import type { SaveStatus } from "../components/save-indicator";

export function usePicks() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedNominationId, setSelectedNominationId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Fetch existing picks
  const { data: picks = [], isLoading } = useQuery({
    queryKey: ["my-picks"],
    queryFn: async () => {
      const res = await fetch("/api/picks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = PicksResponseSchema.parse(await res.json());
      return data.picks;
    },
    enabled: !!token,
  });

  // Submit pick mutation
  const mutation = useMutation({
    mutationFn: async ({
      categoryId,
      nominationId,
    }: { categoryId: string; nominationId: string }) => {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId }),
      });
      if (!res.ok) throw new Error("Failed to save pick");
      return SubmitPickResponseSchema.parse(await res.json());
    },
    onSuccess: () => {
      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["my-picks"] });
    },
    onError: () => {
      setSaveStatus("error");
    },
  });

  const handleSelect = useCallback(
    (categoryId: string, nominationId: string) => {
      setSelectedNominationId(nominationId); // Optimistic
      setSaveStatus("saving");
      mutation.mutate({ categoryId, nominationId });
    },
    [mutation],
  );

  // Set of completed category IDs
  const completedCategoryIds = new Set(
    picks.map((p) => p.categoryId),
  );

  return {
    picks,
    selectedNominationId,
    setSelectedNominationId,
    handleSelect,
    saveStatus,
    isLoading,
    completedCategoryIds,
    isSubmitting: mutation.isPending,
  };
}
