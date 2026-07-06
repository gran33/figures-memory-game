---
name: verify
description: Build, launch and drive History Heroes (Vite + React memory game) in a browser to verify changes end-to-end.
---

# Verifying History Heroes

## Launch

```bash
npm install                     # worktrees start without node_modules
npx vite --port 5271 --strictPort   # background; 5199 may be taken by another project
```

App title must be "History Heroes — Memory Match" (`curl -s localhost:5271 | grep title`) —
other sessions run other Vite apps on nearby ports.

## Drive (Playwright)

No chromium in the Playwright cache; **webkit works**: `npm i playwright && npx playwright install webkit`
in a scratch dir.

- Menu → map: click the "Play" button. Map → level: `data-testid="map-node-<id>"`,
  but the active node **pulses forever** — click with `{ force: true }`.
- Cards: `data-testid="card-<index>"`, `data-status` is `down|up|matched`; face-up cards
  expose the character name as `aria-label`, so a solver can learn the board by flipping.
- A match opens the character reward modal — close via `data-testid="modal-close"` before
  the next turn. Failed turns flip back after 900ms (`FLIP_BACK_MS`).
- Score UI: `score-chip` (game/map/album headers), `score-pop` (per-match), `celebration`
  (level-complete footer), `collection-celebration` (trophy overlay), `points-earned`.
- Persisted state lives in `localStorage["history-heroes-storage"]` (`{ state, version }`);
  seeding it + reload is the fast way to reach album badges, Hebrew (`state.language='he'`),
  or near-complete collections.
- Screens fade in — `waitForTimeout(600-800)` before screenshots or they capture mid-transition.

## Gotchas

- Narration needs real audio clips; Web Speech is silent in this Chrome (see memory).
- Board draw is random per level; tests inject `shuffle` for determinism, the browser can't.
