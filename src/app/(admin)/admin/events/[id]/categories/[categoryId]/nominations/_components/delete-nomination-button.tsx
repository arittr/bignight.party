"use client";

import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/api/client";

type DeleteNominationButtonProps = {
  nominationId: string;
  nominationText: string;
};

export function DeleteNominationButton({
  nominationId,
  nominationText,
}: DeleteNominationButtonProps) {
  const mutation = useMutation(orpc.admin.nominations.delete.mutationOptions());

  async function handleDelete(_formData: FormData) {
    if (confirm(`Are you sure you want to delete: "${nominationText}"?`)) {
      mutation.mutate({ id: nominationId });
    }
  }

  return (
    <form action={handleDelete} className="inline">
      <button
        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        type="submit"
      >
        Delete
      </button>
    </form>
  );
}
