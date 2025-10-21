"use client";

import { useAction } from "next-safe-action/hooks";
import { submitPickAction } from "@/lib/actions/pick-actions";
import { useState } from "react";

interface Nomination {
  id: string;
  nominationText: string;
}

interface PickFormProps {
  gameId: string;
  categoryId: string;
  categoryName: string;
  nominations: Nomination[];
  initialNominationId?: string;
}

export function PickForm({
  gameId,
  categoryId,
  categoryName,
  nominations,
  initialNominationId,
}: PickFormProps) {
  const [selectedNominationId, setSelectedNominationId] = useState<string>(
    initialNominationId || ""
  );

  const { execute, isPending, result } = useAction(submitPickAction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNominationId) return;

    await execute({
      gameId,
      categoryId,
      nominationId: selectedNominationId,
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="pick-form">
      <h2>{categoryName}</h2>

      <div role="group" aria-label="Nominees">
        {nominations.map((nomination) => (
          <label key={nomination.id} className="nominee-option">
            <input
              type="radio"
              name="nomination"
              value={nomination.id}
              checked={selectedNominationId === nomination.id}
              onChange={(e) => setSelectedNominationId(e.target.value)}
              disabled={isPending}
            />
            <span>{nomination.nominationText}</span>
          </label>
        ))}
      </div>

      <button type="submit" disabled={isPending || !selectedNominationId}>
        {isPending ? "Submitting..." : "Submit Pick"}
      </button>

      {result?.data && (
        <div role="status" className="success-message">
          Pick saved successfully!
        </div>
      )}

      {result?.serverError && (
        <div role="alert" className="error-message">
          {result.serverError}
        </div>
      )}
    </form>
  );
}
