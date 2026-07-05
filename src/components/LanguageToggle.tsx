import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { gameData, LANGUAGES } from '../i18n';

/** Pill-style language switcher driven entirely by the languages in gameData.json. */
export function LanguageToggle() {
  const language = useGameStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);

  return (
    <div className="flex gap-1 rounded-2xl bg-sky-100 p-1 shadow-inner" role="group" aria-label="Language">
      {LANGUAGES.map((code) => {
        const active = code === language;
        return (
          <motion.button
            key={code}
            whileTap={{ scale: 0.93 }}
            aria-pressed={active}
            onClick={() => setLanguage(code)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              active ? 'bg-white text-sky-700 shadow' : 'text-sky-500'
            }`}
          >
            {gameData.languages[code].label}
          </motion.button>
        );
      })}
    </div>
  );
}
