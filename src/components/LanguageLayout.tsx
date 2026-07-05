import { useEffect, type ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameData } from '../i18n';

/**
 * Global layout wrapper: keeps the document's `dir` and `lang` attributes in
 * sync with the active language, so the whole UI (including Tailwind logical
 * properties) flips between LTR and RTL reactively.
 */
export function LanguageLayout({ children }: { children: ReactNode }) {
  const language = useGameStore((s) => s.language);

  useEffect(() => {
    document.documentElement.setAttribute('dir', gameData.languages[language].dir);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  return <div className="min-h-dvh bg-orange-50 font-sans text-slate-700">{children}</div>;
}
