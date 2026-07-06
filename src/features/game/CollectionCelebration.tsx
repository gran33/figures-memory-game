import { motion } from 'framer-motion';
import type { CollectionId } from '../../types';
import { gameData, getUi, format } from '../../i18n';
import { useGameStore } from '../../store/gameStore';
import { Confetti } from './Confetti';
import { Button } from '../../components/Button';

export function collectionName(collectionId: CollectionId, language: 'en' | 'he'): string {
  if (collectionId === 'women') return getUi(language).womenHeroes;
  return gameData.categories[collectionId][language];
}

/**
 * The rarest event in the game: a completed sticker collection. Extra-festive
 * trophy moment layered after the regular match/reward flow.
 */
export function CollectionCelebration({
  collectionId,
  onClose,
}: {
  collectionId: CollectionId;
  onClose: () => void;
}) {
  const language = useGameStore((s) => s.language);
  const ui = getUi(language);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-grape-900/70 p-4 backdrop-blur-sm">
      <Confetti pieces={80} />
      <motion.div
        data-testid="collection-celebration"
        role="dialog"
        aria-modal="true"
        aria-label={format(ui.collectionComplete, { collection: collectionName(collectionId, language) })}
        initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 220 }}
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-b from-amber-200 via-amber-300 to-orange-400 p-8 text-center shadow-[0_10px_0_rgba(0,0,0,0.35)] ring-8 ring-white/70"
      >
        <motion.div
          className="text-7xl drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]"
          animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          aria-hidden="true"
        >
          🏆
        </motion.div>
        <div className="text-xl font-extrabold text-grape-900">
          {format(ui.collectionComplete, { collection: collectionName(collectionId, language) })}
        </div>
        <div className="text-3xl font-extrabold text-grape-900">🪙 +500</div>
        <Button variant="pink" onClick={onClose}>
          {ui.close} ⭐
        </Button>
      </motion.div>
    </div>
  );
}
