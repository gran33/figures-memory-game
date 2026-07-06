import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getUi } from '../i18n';

/** The lifetime points counter — a cumulative treasure, shown on every screen. */
export function ScoreChip() {
  const language = useGameStore((s) => s.language);
  const totalScore = useGameStore((s) => s.totalScore);
  const ui = getUi(language);

  return (
    <div
      data-testid="score-chip"
      aria-label={`${ui.totalPoints}: ${totalScore}`}
      className="flex h-12 items-center gap-1 rounded-2xl bg-white/15 px-3 text-base font-extrabold text-amber-300 ring-2 ring-white/20"
    >
      <span aria-hidden="true">🪙</span>
      <motion.span
        key={totalScore}
        initial={{ scale: 1.4 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
      >
        {totalScore.toLocaleString()}
      </motion.span>
    </div>
  );
}
