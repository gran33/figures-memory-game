import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { gameData, LANGUAGES } from '../i18n';

/** Pill-style language switcher driven entirely by the languages in gameData.json. */
export function LanguageToggle() {
  const language = useGameStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);

  return (
    <div
      className="flex gap-1 rounded-2xl bg-grape-900/40 p-1.5 shadow-inner"
      role="group"
      aria-label="Language"
    >
      {LANGUAGES.map((code) => {
        const active = code === language;
        return (
          <motion.button
            key={code}
            whileTap={{ scale: 0.92 }}
            aria-pressed={active}
            onClick={() => setLanguage(code)}
            className={`rounded-xl px-5 py-2 text-base font-extrabold transition-colors ${
              active
                ? 'bg-amber-300 text-amber-950 shadow-[0_3px_0_#b45309]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {gameData.languages[code].label}
          </motion.button>
        );
      })}
    </div>
  );
}
