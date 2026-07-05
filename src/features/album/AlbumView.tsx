import { useState } from 'react';
import type { CategoryId, Character } from '../../types';
import { gameData, getUi } from '../../i18n';
import { useGameStore } from '../../store/gameStore';
import { StickerItem } from './StickerItem';
import { CharacterModal } from '../../components/CharacterModal';

const CATEGORY_ORDER: CategoryId[] = ['inventors', 'leaders', 'athletes'];

/** The permanent sticker album: categorised grid of every hero in the game. */
export function AlbumView() {
  const language = useGameStore((s) => s.language);
  const navigate = useGameStore((s) => s.navigate);
  const unlockedStickers = useGameStore((s) => s.unlockedStickers);
  const ui = getUi(language);
  const [openCharacter, setOpenCharacter] = useState<Character | null>(null);

  return (
    <div className="min-h-dvh bg-orange-50 p-4 pb-10">
      <header className="mx-auto flex max-w-xl items-center justify-between pb-4">
        <button
          aria-label={ui.backToMap}
          onClick={() => navigate({ name: 'map' })}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-xl shadow-sm active:scale-95"
        >
          🗺️
        </button>
        <h1 className="text-2xl font-extrabold text-slate-700">📔 {ui.stickerAlbum}</h1>
        <div className="rounded-2xl bg-green-100 px-3 py-1.5 text-sm font-bold text-green-800">
          {unlockedStickers.length}/{gameData.characters.length}
        </div>
      </header>
      <p className="pb-4 text-center text-sm text-slate-400">
        {unlockedStickers.length} {ui.albumProgress}
      </p>

      <div className="mx-auto flex max-w-xl flex-col gap-6">
        {CATEGORY_ORDER.map((categoryId) => (
          <section key={categoryId}>
            <h2 className="flex items-center gap-2 pb-2 text-lg font-extrabold text-slate-500">
              <span aria-hidden="true">{gameData.categories[categoryId].emoji}</span>
              <span>{gameData.categories[categoryId][language]}</span>
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {gameData.characters
                .filter((c) => c.category === categoryId)
                .map((character) => (
                  <StickerItem
                    key={character.id}
                    character={character}
                    unlocked={unlockedStickers.includes(character.id)}
                    onOpen={setOpenCharacter}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>

      <CharacterModal character={openCharacter} onClose={() => setOpenCharacter(null)} />
    </div>
  );
}
