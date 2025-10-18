import { deleteNominationAction } from "@/lib/actions/admin-actions";

type DeleteNominationButtonProps = {
  nominationId: string;
  nominationText: string;
};

export function DeleteNominationButton({
  nominationId,
  nominationText,
}: DeleteNominationButtonProps) {
  async function handleDelete(formData: FormData) {
    "use server";

    const confirmed = formData.get("confirmed");
    if (confirmed === "true") {
      await deleteNominationAction({ id: nominationId });
    }
  }

  return (
    <form action={handleDelete} className="inline">
      <input type="hidden" name="confirmed" value="true" />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`Are you sure you want to delete: "${nominationText}"?`)) {
            e.preventDefault();
          }
        }}
        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
