import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getUi, gameData } from '../i18n';
import { Button } from './Button';
import { LanguageToggle } from './LanguageToggle';

/** Landing screen: playful title, language selector, Play + Sticker Album. */
export function MainMenu() {
  const language = useGameStore((s) => s.language);
  const navigate = useGameStore((s) => s.navigate);
  const unlockedStickers = useGameStore((s) => s.unlockedStickers);
  const ui = getUi(language);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-b from-sky-50 via-orange-50 to-green-50 p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <motion.span
          className="text-7xl"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🏛️
        </motion.span>
        <h1 className="text-4xl font-extrabold text-slate-700">{ui.appTitle}</h1>
        <p className="text-lg text-slate-500">{ui.appTagline}</p>
      </motion.div>

      <LanguageToggle />

      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button variant="success" className="py-4 text-2xl" onClick={() => navigate({ name: 'map' })}>
          ▶️ {ui.play}
        </Button>
        <Button variant="soft" onClick={() => navigate({ name: 'album' })}>
          📔 {ui.stickerAlbum} ({unlockedStickers.length}/{gameData.characters.length})
        </Button>
      </div>
    </div>
  );
}
