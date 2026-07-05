import { motion } from 'framer-motion';
import type { Card } from '../../types';
import { getCharacter } from '../../i18n';
import { useGameStore } from '../../store/gameStore';

interface MemoryCardProps {
  card: Card;
  index: number;
  onFlip: (index: number) => void;
}

/** A single 3D-flipping memory card. The logo variant is static and unclickable. */
export function MemoryCard({ card, index, onFlip }: MemoryCardProps) {
  const language = useGameStore((s) => s.language);

  if (card.isLogo) {
    return (
      <div
        data-testid="logo-card"
        aria-hidden="true"
        className="flex aspect-square select-none items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-green-100 shadow-inner ring-2 ring-sky-200"
      >
        <span className="text-[min(8vw,3rem)]">🏛️</span>
      </div>
    );
  }

  const character = getCharacter(card.characterId);
  const faceUp = card.status !== 'down';

  return (
    <motion.button
      data-testid={`card-${index}`}
      data-status={card.status}
      aria-label={faceUp ? character.languages[language].name : `? ${index + 1}`}
      onClick={() => onFlip(index)}
      whileTap={{ scale: 0.95 }}
      className="relative aspect-square [perspective:600px]"
    >
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ duration: 0.45, type: 'spring', damping: 18, stiffness: 200 }}
      >
        {/* back (face-down side) */}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200 to-sky-300 shadow-md [backface-visibility:hidden]">
          <span className="text-[min(7vw,2.2rem)] opacity-70">❓</span>
        </div>
        {/* front (character side) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-orange-50 p-1 shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            card.status === 'matched' ? 'ring-4 ring-green-300/90 shadow-green-200 shadow-lg' : ''
          }`}
        >
          <span className="text-[min(9vw,2.8rem)] leading-none">{character.emoji}</span>
        </div>
      </motion.div>
    </motion.button>
  );
}
