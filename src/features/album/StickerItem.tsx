import { motion } from 'framer-motion';
import type { Character } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { getUi } from '../../i18n';

interface StickerItemProps {
  character: Character;
  unlocked: boolean;
  onOpen: (character: Character) => void;
}

/** One album cell: a vibrant sticker if discovered, a gray mystery silhouette if not. */
export function StickerItem({ character, unlocked, onOpen }: StickerItemProps) {
  const language = useGameStore((s) => s.language);
  const ui = getUi(language);

  if (!unlocked) {
    return (
      <div
        data-testid="sticker-locked"
        aria-label={ui.mysteryHero}
        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-slate-200 shadow-inner"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-400/60 text-2xl font-extrabold text-slate-100">
          ?
        </span>
      </div>
    );
  }

  return (
    <motion.button
      data-testid={`sticker-${character.id}`}
      whileTap={{ scale: 0.93 }}
      whileHover={{ scale: 1.04, rotate: -1.5 }}
      onClick={() => onOpen(character)}
      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-amber-50 to-sky-50 p-1 shadow-md ring-2 ring-amber-200"
    >
      <span className="text-4xl">{character.emoji}</span>
      <span className="px-1 text-center text-[0.65rem] font-bold leading-tight text-slate-600">
        {character.languages[language].name}
      </span>
    </motion.button>
  );
}
