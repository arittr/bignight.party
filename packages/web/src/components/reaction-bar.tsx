import { AnimatePresence, motion } from "framer-motion";
import { ALLOWED_REACTIONS } from "@bignight/shared";

interface FloatingReaction {
  id: string;
  emoji: string;
  name: string;
}

interface ReactionBarProps {
  onReact: (emoji: string) => void;
  reactions: FloatingReaction[];
}

export function ReactionBar({ onReact, reactions }: ReactionBarProps) {
  return (
    <>
      {/* Floating reactions */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 100, x: Math.random() * 300 }}
              animate={{ opacity: 1, y: -100 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute bottom-20 text-3xl"
            >
              {r.emoji}
              <span className="text-xs text-white/50 ml-1">{r.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-4 p-4 bg-gradient-to-t from-[#1a1a2e] to-transparent">
        {ALLOWED_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="text-2xl p-2 hover:scale-125 transition-transform active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
