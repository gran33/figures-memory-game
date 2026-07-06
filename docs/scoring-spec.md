# Scoring Spec — Positive-Only Memory Points

Status: **Draft — approved for design, not yet implemented**

## 1. Goals

- Reward the player for **remembering** card locations, and for **lucky finds**.
- Every match earns points. Points **only ever go up** — across the whole app, forever.
- **Zero pressure**: no timers, no visible move counters, no penalties, no grading.
- All feedback is **positive**. Weaker outcomes get a *smaller celebration*, never a
  negative or neutral message.

## 2. Non-goals

- No time-based scoring or countdowns of any kind.
- No star ratings per level (1-star vs 3-star reads as a judgment to a child).
- No display of misses, attempts, efficiency, or comparisons.
- No score deduction API. The store must not expose any way to lower the total.

## 3. Definitions

These apply **per level session** (state resets when a level starts or restarts):

- **Seen card** — a specific card (by `uid`, not `characterId` — the two cards of a
  pair are tracked separately) that has been face-up at any moment during this level,
  even if it flipped back down. Tracked in `seenUids: Set<string>`.
- **Missed chance** — recorded for a pair (`characterId`) when a failed turn ends and
  at least one of the two flipped cards has a partner that was already *seen* before
  that turn began. In plain words: the player had seen where the match was, but
  didn't take it. Tracked in `missedPairs: Set<string>`. Recording is **silent** —
  nothing negative is shown; it only decides which celebration a later match gets.

## 4. Match tiers

When the second card of a turn completes a match, classify the match by looking at
that **second card** (call it `B`) *before* marking it seen:

| Tier | Condition | Points | Feedback (en) |
|---|---|---|---|
| **Lucky** | `B` was never seen before this turn | **150** | "Lucky find!" |
| **Memory** | `B` was seen before **and** the pair has no missed chance | **100** | "Amazing memory!" |
| **Match** | the pair had a missed chance earlier | **50** | "You got it!" |

Rationale:

- `B` is the card the player "went looking for". If it had never been revealed, the
  player couldn't have known where it was — pure luck, biggest delight (per design:
  lucky first-sight matches score highest).
- If `B` was seen before and the player never squandered a known match for this pair,
  they genuinely remembered — the second-highest reward.
- If they previously saw the partner and missed it, the eventual match still pays —
  smaller, but always positive and always celebrated.

### Turn resolution (pseudocode)

```
flip second card B (first card was A):
  if A.characterId == B.characterId:            // MATCH
    if B.uid not in seenUids:            tier = LUCKY   (150)
    else if characterId not in missedPairs: tier = MEMORY (100)
    else:                                tier = MATCH  (50)
    addPoints(tier.points)
  else:                                          // NO MATCH — no message, cards flip back
    for card in [A, B]:
      partner = the other card with card.characterId
      if partner.uid in seenUids:
        missedPairs.add(card.characterId)        // silent
  seenUids.add(A.uid); seenUids.add(B.uid)
```

Notes:

- Failed turns produce **no scoring UI at all** — the cards simply flip back
  (existing `FLIP_BACK_MS` behavior unchanged).
- Tapping an already-matched card (free exploration mode) never affects scoring.
- The static logo card is ignored entirely.

## 5. Level completion bonus

Scaled by level size: **`pairs × 25`** bonus points when the board is cleared.

| Stage | Pairs | Bonus |
|---|---|---|
| 1 | 4 | 100 |
| 2 | 6 | 150 |
| 3 | 8 | 200 |
| 4 | 10 | 250 |
| 5 | 12 | 300 |
| 6 | 14 | 350 |
| 7 | 15 | 375 |
| 8 | 18 | 450 |

The bonus is unconditional — every completion gets the full bonus regardless of how
the matches were made. **Replaying a completed level earns match points and the bonus
again** (points never stop flowing; the lifetime total only grows).

## 6. Collection bonuses

Categories matter through the sticker album, not through per-match multipliers
(multipliers were considered and rejected: the deck is randomly drawn, so they'd
reward shuffle luck, and they'd implicitly rank the heroes).

Four collections, each a one-time **+500** bonus when the last sticker completes it:

| Collection | Members | Feedback (en) |
|---|---|---|
| Inventors | all 20 `inventors` | "You collected all the Inventors! 🏆" |
| Leaders | all 20 `leaders` | "You collected all the Leaders! 🏆" |
| Athletes | all 20 `athletes` | "You collected all the Athletes! 🏆" |
| Women | all 20 characters with `gender: 'female'` | "You collected all the Women Heroes! 🏆" |

Rules:

- Checked whenever a sticker unlocks (`unlockSticker`). A single unlock can complete
  **multiple collections at once** (e.g. the last woman is also the last inventor) —
  each completed collection pays its own bonus and gets its own celebration.
- One-time per collection, tracked in persisted store state
  (`completedCollections: string[]`). Never re-awarded.
- **Roster growth**: if characters are added later (as happened with athletes), an
  already-awarded bonus is *not* revoked (points never go down) and is not paid
  again when the enlarged collection is re-completed. Completion is always checked
  against the current full roster.
- Celebration: a distinct, extra-festive moment (confetti + trophy) layered after the
  regular match/reward flow — this is the rarest event in the game and should feel
  like it. The album shows a 🏆 badge on completed collections.

## 7. Persistence (store changes)

Extend `gameStore`:

```ts
totalScore: number;                 // lifetime, app-wide, starts at 0
addPoints: (points: number) => void; // the ONLY score mutation; ignores points <= 0
completedCollections: string[];      // collection ids already awarded, e.g. 'inventors', 'women'
```

- Included in `partialize` → persisted to localStorage with the existing
  `history-heroes-storage` key.
- Existing saves without `totalScore` / `completedCollections` default to `0` / `[]`
  (zustand merge handles this).
- Per-level session state (`seenUids`, `missedPairs`, per-level earned points) lives
  in `useMemoryGame`, **not** the store — it must reset on level entry/restart and
  never persist.

## 8. UI

Score is visible **everywhere**, always as a cumulative treasure — never as a grade:

1. **In-game header** — running lifetime total with a coin/star icon. On each match,
   a celebratory pop appears at the matched cards: tier label + `+150` (etc.),
   animating toward the counter (framer-motion, consistent with existing animations).
   Bigger tier ⇒ bigger/sparklier pop; the smallest tier still gets a cheerful pop.
2. **Level map** — lifetime total shown in the map header.
3. **Sticker album** — lifetime total shown alongside album progress.
4. **Level-complete modal** — "You earned +N points!" (match points + bonus for this
   run) plus the new lifetime total. No breakdown of tiers or misses is ever shown.

The reward modal (character intro) already interrupts play after each match; the
score pop should render *before/behind* it or briefly alongside it so the +points
moment isn't lost — exact choreography decided at implementation time.

## 9. Localization

New `UiStrings` keys (en + he values required in `gameData.json`):

- `luckyMatch` — "Lucky find!" / Hebrew equivalent
- `memoryMatch` — "Amazing memory!"
- `niceMatch` — "You got it!"
- `levelBonus` — "Level bonus!"
- `pointsEarned` — template with `{points}`, e.g. "You earned +{points} points!"
- `totalPoints` — label for the lifetime counter
- `collectionComplete` — template with `{collection}`, e.g. "You collected all the {collection}! 🏆"
- `womenHeroes` — display name for the cross-category Women collection (the three
  category collections reuse the existing localized names in `categories`)

All strings must be exclamatory/positive; RTL layout for Hebrew follows the existing
`LanguageLayout` handling.

## 10. Edge cases

- **Level restart / abandon mid-level**: points already awarded are kept (never
  clawed back); session tracking resets fresh.
- **First turn of a level**: any match is Lucky by definition (`B` unseen).
- **Same card can't be picked twice in one turn** (already enforced by `status === 'up'` guard).
- **Concurrent flip during flip-back delay**: existing `pendingPair.length === 2`
  guard prevents it; scoring inherits that safety.

## 11. Testing notes

- Unit-test tier classification with a seeded/deterministic `ShuffleFn` (the hook
  already accepts one): lucky on first-sight match, memory after seeing partner,
  downgrade to base tier after a recorded missed chance, missed chance only recorded
  when a partner was genuinely seen.
- Store: `addPoints` accumulates, persists, ignores non-positive input; legacy
  persisted state without `totalScore` loads as 0.
- Collections: bonus fires exactly once when the 20th sticker of a collection
  unlocks; one unlock completing two collections pays both; an already-awarded
  collection never pays again, including after roster growth re-completion.
- Assert no code path ever decreases `totalScore`.
