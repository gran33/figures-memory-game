import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getUi, gameData } from '../i18n';
import { Button } from './Button';
import { LanguageToggle } from './LanguageToggle';

const FLOATERS = ['⚽', '💡', '🏀', '🎨', '🥊', '🔭', '🎾', '📞'];

/** Landing screen: candy-bright gradient, floating emoji, big arcade buttons. */
export function MainMenu() {
  const language = useGameStore((s) => s.language);
  const navigate = useGameStore((s) => s.navigate);
  const unlockedStickers = useGameStore((s) => s.unlockedStickers);
  const ui = getUi(language);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-gradient-to-b from-grape-600 via-fuchsia-600 to-orange-500 p-6">
      {/* floating background emoji */}
      {FLOATERS.map((emoji, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute text-4xl opacity-25"
          style={{ left: `${(i * 13 + 5) % 90}%`, top: `${(i * 23 + 8) % 85}%` }}
          animate={{ y: [0, -18, 0], rotate: [0, i % 2 ? 14 : -14, 0] }}
          transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        >
          {emoji}
        </motion.span>
      ))}

      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: -30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        className="z-10 flex flex-col items-center gap-3 text-center"
      >
        <motion.span
          className="text-8xl drop-shadow-[0_8px_0_rgba(0,0,0,0.25)]"
          animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          🏛️
        </motion.span>
        <h1 className="text-5xl font-extrabold text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]">
          {ui.appTitle}
        </h1>
        <p className="rounded-full bg-white/20 px-4 py-1.5 text-lg font-bold text-amber-200">
          ✨ {ui.appTagline} ✨
        </p>
      </motion.div>

      <div className="z-10">
        <LanguageToggle />
      </div>

      <div className="z-10 flex w-full max-w-xs flex-col gap-5">
        <Button variant="success" className="py-5 text-3xl" onClick={() => navigate({ name: 'map' })}>
          ▶ {ui.play}
        </Button>
        <Button variant="soft" onClick={() => navigate({ name: 'album' })}>
          📔 {ui.stickerAlbum} · {unlockedStickers.length}/{gameData.characters.length}
        </Button>
      </div>
    </div>
  );
}
