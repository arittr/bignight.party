import { useEffect, useRef } from "react";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div
        ref={ref}
        className="relative bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-5"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg leading-none"
        >
          ✕
        </button>

        <h2 className="text-[#e2b04a] font-bold text-lg mb-4">How to Play</h2>

        <section className="mb-4">
          <h3 className="text-white font-semibold text-sm mb-1">1. Join the game</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Pick a name and a 4–6 digit PIN. That's your login —
            remember your PIN so you can get back in.
          </p>
        </section>

        <section className="mb-4">
          <h3 className="text-white font-semibold text-sm mb-1">2. Make your picks</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Tap a nominee to pick them for each category. Use the
            category pills at the top or the Previous / Next buttons to
            move between categories. Your picks save automatically — no
            submit button needed. You can change picks anytime until the
            ceremony starts.
          </p>
        </section>

        <section className="mb-4">
          <h3 className="text-white font-semibold text-sm mb-1">3. Scoring</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Not all categories are equal! Big awards are worth more:
          </p>
          <ul className="text-gray-300 text-sm mt-1 space-y-0.5 ml-3">
            <li><span className="text-[#e2b04a]">5 pts</span> — Best Picture</li>
            <li><span className="text-[#e2b04a]">4 pts</span> — Best Director</li>
            <li><span className="text-[#e2b04a]">3 pts</span> — Best Actor & Actress</li>
            <li><span className="text-[#e2b04a]">2 pts</span> — Supporting, Screenplay, Animated, International, Casting</li>
            <li><span className="text-[#e2b04a]">1 pt</span> — All other categories</li>
          </ul>
        </section>

        <section className="mb-4">
          <h3 className="text-white font-semibold text-sm mb-1">4. Oscar night</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Once the ceremony begins, picks lock. Head to the
            Leaderboard to watch scores update live as winners are
            announced. Send reactions (🔥 💕 💩 💀 👏 🍿) to celebrate
            or commiserate with the group.
          </p>
        </section>

        <section>
          <h3 className="text-white font-semibold text-sm mb-1">5. Win bragging rights</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            The top 3 land on the podium. Highest score wins — ties
            broken by number of correct picks, then alphabetically.
            You must pick every category to appear on the leaderboard.
          </p>
        </section>
      </div>
    </div>
  );
}
