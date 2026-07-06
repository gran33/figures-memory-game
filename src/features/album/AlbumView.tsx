import { useState } from 'react';
import type { CategoryId, Character } from '../../types';
import { gameData, getUi } from '../../i18n';
import { useGameStore } from '../../store/gameStore';
import { StickerItem } from './StickerItem';
import { CharacterModal } from '../../components/CharacterModal';
import { ScoreChip } from '../../components/ScoreChip';

const CATEGORY_ORDER: CategoryId[] = ['inventors', 'leaders', 'athletes'];

const HEADER_BY_CATEGORY: Record<CategoryId, string> = {
  inventors: 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950',
  leaders: 'bg-gradient-to-r from-sky-400 to-blue-400 text-sky-950',
  athletes: 'bg-gradient-to-r from-lime-400 to-emerald-400 text-lime-950',
};

/** The permanent sticker album: categorised grid of every hero in the game. */
export function AlbumView() {
  const language = useGameStore((s) => s.language);
  const navigate = useGameStore((s) => s.navigate);
  const unlockedStickers = useGameStore((s) => s.unlockedStickers);
  const completedCollections = useGameStore((s) => s.completedCollections);
  const ui = getUi(language);
  const [openCharacter, setOpenCharacter] = useState<Character | null>(null);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-indigo-950 via-grape-800 to-grape-700 p-4 pb-10">
      <header className="mx-auto flex max-w-xl items-center justify-between pb-3">
        <button
          aria-label={ui.backToMap}
          onClick={() => navigate({ name: 'map' })}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl ring-2 ring-white/20 active:scale-95"
        >
          🗺️
        </button>
        <h1 className="text-2xl font-extrabold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
          📔 {ui.stickerAlbum}
        </h1>
        <div className="flex items-center gap-2">
          <ScoreChip />
          <div className="rounded-2xl bg-amber-300 px-3 py-1.5 text-sm font-extrabold text-amber-950 shadow-[0_3px_0_#b45309]">
            {unlockedStickers.length}/{gameData.characters.length}
          </div>
        </div>
      </header>
      <p className="pb-4 text-center text-sm font-bold text-white/60">
        ⭐ {unlockedStickers.length} {ui.albumProgress} ⭐
      </p>
      {completedCollections.includes('women') && (
        <p
          data-testid="women-collection-badge"
          className="pb-4 text-center text-sm font-extrabold text-amber-300"
        >
          🏆 {ui.womenHeroes}
        </p>
      )}

      <div className="mx-auto flex max-w-xl flex-col gap-6">
        {CATEGORY_ORDER.map((categoryId) => (
          <section key={categoryId}>
            <h2
              className={`mb-3 flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-lg font-extrabold shadow-[0_3px_0_rgba(0,0,0,0.3)] ${HEADER_BY_CATEGORY[categoryId]}`}
            >
              <span aria-hidden="true">{gameData.categories[categoryId].emoji}</span>
              <span>{gameData.categories[categoryId][language]}</span>
              {completedCollections.includes(categoryId) && (
                <span data-testid={`collection-badge-${categoryId}`}>🏆</span>
              )}
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
