# 🏛️ History Heroes — Memory Match

An educational, mobile-first memory match game for kids. Flip cards, match
historical heroes, and hear each one introduce themselves — in English or
Hebrew (עברית), with full RTL support.

Built strictly test-first (TDD) with **Vite + React + TypeScript + Zustand +
Tailwind CSS + Framer Motion + Vitest**, and PWA-ready via `vite-plugin-pwa`.

## Quick start

```bash
npm install
npm run dev        # local dev server
npm test           # full Vitest suite (34 tests)
npm run build      # typecheck + production build + service worker
```

## Gameplay

- **Journey map** — 22 matches across 8 grid stages (3×3 → 6×6), Candy-Crush
  style: completed nodes are starred, the active node pulses, future nodes are
  padlocked but browsable.
- **Stage 1 special rule** — the exact center of the 3×3 board is a static,
  unclickable logo card; the remaining 8 cards form 4 pairs.
- **Match reward** — a first-person pop-up: the hero introduces themselves in
  the active language, a voiceover auto-plays (🔊 replays it), and a Share
  button posts the card via the native Web Share API.
- **Free exploration** — finished boards stay live; tap any card to revisit
  its hero before moving on.
- **Sticker album** — every matched hero is permanently unlocked as a sticker,
  categorised (Inventors & Scientists / Leaders / Athletes); locked heroes are
  gray mystery silhouettes.

## Architecture

```
src/
├── components/      # Shared atoms: Button, Modal, CharacterModal, LanguageLayout, LanguageToggle, MainMenu
├── data/            # gameData.json (all content, fully decoupled) + levels.ts (22-match progression)
├── features/
│   ├── map/         # LevelMap, MapNode
│   ├── game/        # GameBoard, MemoryCard, Confetti, useMemoryGame engine
│   └── album/       # AlbumView, StickerItem
├── lib/             # audio (voiceover + synth fallback + victory chime), native share
├── store/           # Zustand store with persist → localStorage
├── types/           # Rigid TypeScript contracts
└── i18n.ts          # Typed accessors over gameData.json
```

### Adding a language

Everything lives in `src/data/gameData.json`. Add a language code under
`languages` (with `dir: "ltr" | "rtl"` and a `speechLang` BCP-47 tag), a block
under `ui`, per-category labels, and a `languages.<code>` entry per character —
then add the code to the `Language` union in `src/types/index.ts`. The layout,
text direction, share text, and narration all follow automatically.

### Voiceover audio

Place clips at `public/audio/<lang>/<characterId>.mp3`. Missing clips fall
back to speech synthesis reading the localized first-person bio.
