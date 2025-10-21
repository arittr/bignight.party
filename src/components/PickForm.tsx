"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { submitPickAction } from "@/lib/actions/pick-actions";

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
      categoryId,
      gameId,
      nominationId: selectedNominationId,
    });
  };

  return (
    <form data-testid="pick-form" onSubmit={handleSubmit}>
      <h2>{categoryName}</h2>

      <fieldset aria-label="Nominees">
        {nominations.map((nomination) => (
          <label className="nominee-option" key={nomination.id}>
            <input
              checked={selectedNominationId === nomination.id}
              disabled={isPending}
              name="nomination"
              onChange={(e) => setSelectedNominationId(e.target.value)}
              type="radio"
              value={nomination.id}
            />
            <span>{nomination.nominationText}</span>
          </label>
        ))}
      </fieldset>

      <button disabled={isPending || !selectedNominationId} type="submit">
        {isPending ? "Submitting..." : "Submit Pick"}
      </button>

      {result?.data && <output className="success-message">Pick saved successfully!</output>}

      {result?.serverError && (
        <div className="error-message" role="alert">
          {result.serverError}
        </div>
      )}
    </form>
  );
}
