import { motion } from 'framer-motion';
import type { Card, CategoryId } from '../../types';
import { getCharacter } from '../../i18n';
import { useGameStore } from '../../store/gameStore';

/** Category accent colors for revealed card faces. */
const FACE_BY_CATEGORY: Record<CategoryId, string> = {
  inventors: 'bg-gradient-to-br from-amber-100 to-amber-300 ring-amber-400',
  leaders: 'bg-gradient-to-br from-sky-100 to-sky-300 ring-sky-400',
  athletes: 'bg-gradient-to-br from-lime-100 to-lime-300 ring-lime-400',
};

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
        className="flex h-full w-full select-none items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500 shadow-[0_5px_0_rgba(0,0,0,0.3)] ring-4 ring-white/60"
      >
        <span className="animate-float text-[min(8vw,3rem)] drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]">🏛️</span>
      </div>
    );
  }

  const character = getCharacter(card.characterId);
  const faceUp = card.status !== 'down';
  const matched = card.status === 'matched';

  return (
    <motion.button
      data-testid={`card-${index}`}
      data-status={card.status}
      aria-label={faceUp ? character.languages[language].name : `? ${index + 1}`}
      onClick={() => onFlip(index)}
      whileTap={{ scale: 0.93 }}
      className="relative h-full w-full [perspective:600px]"
    >
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ duration: 0.45, type: 'spring', damping: 18, stiffness: 200 }}
      >
        {/* back (face-down side): candy gradient with a star badge */}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-grape-500 to-indigo-600 shadow-[0_5px_0_rgba(0,0,0,0.35)] ring-4 ring-white/40 [backface-visibility:hidden]">
          <span className="flex aspect-square w-[55%] max-h-[60%] max-w-[4.5rem] items-center justify-center rounded-full bg-white/15 text-[min(7vw,2rem)] font-extrabold text-amber-300">
            ★
          </span>
        </div>
        {/* front (character side) */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-2xl ring-4 [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            FACE_BY_CATEGORY[character.category]
          } ${
            matched
              ? 'shadow-[0_0_18px_4px_rgba(250,204,21,0.8)]'
              : 'shadow-[0_5px_0_rgba(0,0,0,0.3)]'
          }`}
        >
          <span className="text-[min(9vw,2.8rem)] leading-none drop-shadow-[0_3px_2px_rgba(0,0,0,0.2)]">
            {character.emoji}
          </span>
          {matched && (
            <span className="absolute -top-1.5 -end-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-md">
              ⭐
            </span>
          )}
        </div>
      </motion.div>
    </motion.button>
  );
}
