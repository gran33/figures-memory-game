import { motion } from 'framer-motion';
import type { CategoryId, Character } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { getUi } from '../../i18n';

const STICKER_BY_CATEGORY: Record<CategoryId, string> = {
  inventors: 'from-amber-200 to-orange-300 ring-amber-400',
  leaders: 'from-sky-200 to-blue-300 ring-sky-400',
  athletes: 'from-lime-200 to-emerald-300 ring-lime-400',
};

interface StickerItemProps {
  character: Character;
  unlocked: boolean;
  onOpen: (character: Character) => void;
}

/** One album cell: a vibrant sticker if discovered, a shadowy mystery slot if not. */
export function StickerItem({ character, unlocked, onOpen }: StickerItemProps) {
  const language = useGameStore((s) => s.language);
  const ui = getUi(language);

  if (!unlocked) {
    return (
      <div
        data-testid="sticker-locked"
        aria-label={ui.mysteryHero}
        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 shadow-inner ring-2 ring-white/10"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl font-extrabold text-white/50">
          ?
        </span>
      </div>
    );
  }

  return (
    <motion.button
      data-testid={`sticker-${character.id}`}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.06, rotate: -2 }}
      initial={{ scale: 0.6, rotate: -8 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 12 }}
      onClick={() => onOpen(character)}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br p-1 shadow-[0_4px_0_rgba(0,0,0,0.35)] ring-4 ${STICKER_BY_CATEGORY[character.category]}`}
    >
      <span className="text-4xl drop-shadow-[0_2px_1px_rgba(0,0,0,0.2)]">{character.emoji}</span>
      <span className="px-1 text-center text-[0.65rem] font-extrabold leading-tight text-slate-800">
        {character.languages[language].name}
      </span>
    </motion.button>
  );
}
