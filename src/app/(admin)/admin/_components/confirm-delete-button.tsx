"use client";

type ConfirmDeleteButtonProps = {
  onDelete: () => Promise<void>;
  confirmMessage: string;
  buttonText: string;
  className?: string;
};

export function ConfirmDeleteButton({
  onDelete,
  confirmMessage,
  buttonText,
  className = "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors",
}: ConfirmDeleteButtonProps) {
  async function handleSubmit(_formData: FormData) {
    if (confirm(confirmMessage)) {
      await onDelete();
    }
  }

  return (
    <form action={handleSubmit}>
      <button className={className} type="submit">
        {buttonText}
      </button>
    </form>
  );
}
