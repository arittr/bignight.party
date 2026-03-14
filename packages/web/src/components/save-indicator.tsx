import { useEffect, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  status: SaveStatus;
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (status === "saved") {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible) return null;

  const styles: Record<SaveStatus, string> = {
    saving: "bg-white/10 text-gray-300",
    saved: "bg-green-500/20 text-green-400",
    error: "bg-red-500/20 text-red-400",
    idle: "",
  };

  const labels: Record<SaveStatus, string> = {
    saving: "Saving...",
    saved: "Saved ✓",
    error: "Error!",
    idle: "",
  };

  return (
    <div
      className={`fixed top-4 right-4 px-3 py-1.5 rounded-full text-sm ${styles[status]} transition-opacity`}
    >
      {labels[status]}
    </div>
  );
}
