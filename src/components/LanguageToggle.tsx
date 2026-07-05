import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { gameData, LANGUAGES } from '../i18n';

/**
 * Pill-style language switcher driven entirely by the languages in gameData.json.
 * The control is pinned to LTR so its options never swap sides when the page
 * direction flips, and the active highlight slides smoothly between them.
 */
export function LanguageToggle() {
  const language = useGameStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);

  return (
    <div
      dir="ltr"
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
            className="relative rounded-xl px-5 py-2 text-base font-extrabold"
          >
            {active && (
              <motion.span
                layoutId="language-toggle-pill"
                initial={false}
                transition={{ type: 'spring', damping: 24, stiffness: 400 }}
                className="absolute inset-0 rounded-xl bg-amber-300 shadow-[0_3px_0_#b45309]"
                aria-hidden="true"
              />
            )}
            <span
              className={`relative transition-colors duration-200 ${
                active ? 'text-amber-950' : 'text-white/70'
              }`}
            >
              {gameData.languages[code].label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
