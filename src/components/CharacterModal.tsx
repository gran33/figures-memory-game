import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { CategoryId, Character } from '../types';
import { Modal } from './Modal';
import { useGameStore } from '../store/gameStore';
import { getUi } from '../i18n';
import { playVoiceover, stopVoiceover } from '../lib/audio';
import { shareCharacter } from '../lib/share';

const BADGE_BY_CATEGORY: Record<CategoryId, string> = {
  inventors: 'from-amber-300 to-orange-400 ring-amber-200',
  leaders: 'from-sky-300 to-blue-500 ring-sky-200',
  athletes: 'from-lime-300 to-emerald-500 ring-lime-200',
};

interface CharacterModalProps {
  character: Character | null;
  onClose: () => void;
}

/**
 * The premium first-person reward pop-up: emoji portrait on a sunburst,
 * localized name + bio, auto-playing voiceover with replay, and native sharing.
 */
export function CharacterModal({ character, onClose }: CharacterModalProps) {
  const language = useGameStore((s) => s.language);
  const ui = getUi(language);

  // auto-play the localized voiceover whenever a character is revealed
  useEffect(() => {
    if (character) playVoiceover(character, language);
    return stopVoiceover;
  }, [character, language]);

  const locale = character?.languages[language];

  return (
    <Modal open={character !== null} label={locale?.name ?? ''} onClose={onClose}>
      {character && locale && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative -mt-20">
            {/* spinning sunburst behind the portrait */}
            <motion.div
              aria-hidden="true"
              className="absolute -inset-5 rounded-full opacity-80 [background:conic-gradient(#fbbf24_0_20deg,#f472b6_20deg_40deg,#fbbf24_40deg_60deg,#f472b6_60deg_80deg,#fbbf24_80deg_100deg,#f472b6_100deg_120deg,#fbbf24_120deg_140deg,#f472b6_140deg_160deg,#fbbf24_160deg_180deg,#f472b6_180deg_200deg,#fbbf24_200deg_220deg,#f472b6_220deg_240deg,#fbbf24_240deg_260deg,#f472b6_260deg_280deg,#fbbf24_280deg_300deg,#f472b6_300deg_320deg,#fbbf24_320deg_340deg,#f472b6_340deg)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            />
            <span
              className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br text-7xl shadow-xl ring-8 ${BADGE_BY_CATEGORY[character.category]}`}
            >
              {character.emoji}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-grape-800">{locale.name}</h2>
          <p className="text-base leading-relaxed font-medium text-slate-600">{locale.bio}</p>
          <div className="flex items-center gap-3">
            <button
              data-testid="replay-audio"
              aria-label={ui.replayAudio}
              onClick={() => playVoiceover(character, language)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400 text-2xl shadow-[0_5px_0_#0369a1] active:translate-y-1 active:shadow-none"
            >
              🔊
            </button>
            <button
              data-testid="share-button"
              aria-label={ui.share}
              onClick={() => void shareCharacter(character, language)}
              className="flex h-14 items-center gap-2 rounded-2xl bg-lime-400 px-5 text-lg font-extrabold text-lime-950 shadow-[0_5px_0_#4d7c0f] active:translate-y-1 active:shadow-none"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M13 5.83V17a1 1 0 1 1-2 0V5.83L8.7 8.12A1 1 0 0 1 7.3 6.7l4-4a1 1 0 0 1 1.4 0l4 4a1 1 0 1 1-1.4 1.42L13 5.83zM5 12a1 1 0 0 1 1 1v6h12v-6a1 1 0 1 1 2 0v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a1 1 0 0 1 1-1z" />
              </svg>
              {ui.share}
            </button>
          </div>
          <button
            data-testid="modal-close"
            aria-label={ui.close}
            onClick={onClose}
            className="absolute -end-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-pink-500 text-lg font-extrabold text-white shadow-[0_4px_0_#9d174d] ring-4 ring-white active:translate-y-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </Modal>
  );
}
