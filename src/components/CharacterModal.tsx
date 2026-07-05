import { useEffect } from 'react';
import type { Character } from '../types';
import { Modal } from './Modal';
import { useGameStore } from '../store/gameStore';
import { getUi } from '../i18n';
import { playVoiceover, stopVoiceover } from '../lib/audio';
import { shareCharacter } from '../lib/share';

interface CharacterModalProps {
  character: Character | null;
  onClose: () => void;
}

/**
 * The premium first-person reward pop-up: emoji portrait, localized name + bio,
 * auto-playing voiceover with a replay speaker button, and native sharing.
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
          <span className="-mt-16 flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-6xl shadow-lg ring-8 ring-orange-50">
            {character.emoji}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-700">{locale.name}</h2>
          <p className="text-base leading-relaxed text-slate-600">{locale.bio}</p>
          <div className="flex items-center gap-3">
            <button
              data-testid="replay-audio"
              aria-label={ui.replayAudio}
              onClick={() => playVoiceover(character, language)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-200 text-2xl shadow-md active:scale-95"
            >
              🔊
            </button>
            <button
              data-testid="share-button"
              aria-label={ui.share}
              onClick={() => void shareCharacter(character, language)}
              className="flex h-14 items-center gap-2 rounded-2xl bg-green-200 px-5 text-lg font-bold text-green-900 shadow-md active:scale-95"
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
            className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-slate-500 active:scale-95"
          >
            ✕
          </button>
        </div>
      )}
    </Modal>
  );
}
