import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { GameBoard, FLIP_BACK_MS } from '../GameBoard';
import { useGameStore, collectionMembers, COLLECTION_BONUS } from '../../../store/gameStore';
import { TIER_POINTS, LEVEL_BONUS_PER_PAIR } from '../useMemoryGame';

/**
 * Deterministic board (identity shuffle, Stage 1 / level 1, 3×3):
 *   index:      0         1        2       3       4        5        6        7         8
 *   card:   einstein  einstein  curie   curie   [LOGO]  edison   edison   davinci   davinci
 */
const identityShuffle = <T,>(arr: T[]): T[] => [...arr];

function renderStage1() {
  return render(<GameBoard levelId={1} shuffle={identityShuffle} />);
}

function card(index: number) {
  return screen.getByTestId(`card-${index}`);
}

function closeModal() {
  fireEvent.click(within(screen.getByRole('dialog')).getByTestId('modal-close'));
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useGameStore.setState(useGameStore.getInitialState(), true);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('GameBoard — Stage 1 (3×3) grid matrix', () => {
  it('renders exactly 8 active flippable cards plus a blocked logo cell at the center', () => {
    renderStage1();
    const flippable = screen.getAllByTestId(/^card-\d+$/);
    expect(flippable).toHaveLength(8);
    flippable.forEach((c) => expect(c.tagName).toBe('BUTTON'));

    // the absolute center grid position (index 4 of 9) holds the static logo
    const logo = screen.getByTestId('logo-card');
    const cells = screen.getByTestId('game-grid').children;
    expect(cells).toHaveLength(9);
    expect(cells[4]).toContainElement(logo);
    expect(logo.tagName).not.toBe('BUTTON');
  });

  it('ignores clicks on the logo cell', () => {
    renderStage1();
    fireEvent.click(screen.getByTestId('logo-card'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    screen.getAllByTestId(/^card-\d+$/).forEach((c) => {
      expect(c).toHaveAttribute('data-status', 'down');
    });
  });

  it('flips a clicked card face up', () => {
    renderStage1();
    expect(card(0)).toHaveAttribute('data-status', 'down');
    fireEvent.click(card(0));
    expect(card(0)).toHaveAttribute('data-status', 'up');
  });

  it('flips non-matching cards back face-down after a brief interactive pause', () => {
    renderStage1();
    fireEvent.click(card(0)); // einstein
    fireEvent.click(card(2)); // curie — no match
    expect(card(0)).toHaveAttribute('data-status', 'up');
    expect(card(2)).toHaveAttribute('data-status', 'up');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(FLIP_BACK_MS));
    expect(card(0)).toHaveAttribute('data-status', 'down');
    expect(card(2)).toHaveAttribute('data-status', 'down');
  });

  it('ignores extra clicks while two non-matching cards are showing', () => {
    renderStage1();
    fireEvent.click(card(0));
    fireEvent.click(card(2));
    fireEvent.click(card(5)); // third click during the pause — ignored
    expect(card(5)).toHaveAttribute('data-status', 'down');
  });

  it('keeps matching cards permanently face-up and triggers the reward modal', () => {
    renderStage1();
    fireEvent.click(card(0));
    fireEvent.click(card(1)); // einstein + einstein
    expect(card(0)).toHaveAttribute('data-status', 'matched');
    expect(card(1)).toHaveAttribute('data-status', 'matched');

    const modal = screen.getByRole('dialog');
    expect(within(modal).getByText('Albert Einstein')).toBeInTheDocument();
    expect(within(modal).getByText(/I am Albert Einstein/)).toBeInTheDocument();
    expect(within(modal).getByTestId('replay-audio')).toBeInTheDocument();
    expect(within(modal).getByTestId('share-button')).toBeInTheDocument();

    // matched cards never flip back
    act(() => vi.advanceTimersByTime(FLIP_BACK_MS * 3));
    expect(card(0)).toHaveAttribute('data-status', 'matched');
  });

  it('permanently unlocks the matched character sticker in the store', () => {
    renderStage1();
    fireEvent.click(card(0));
    fireEvent.click(card(1));
    expect(useGameStore.getState().unlockedStickers).toContain('einstein');
  });
});

function solveBoard() {
  for (const [a, b] of [
    [0, 1],
    [2, 3],
    [5, 6],
    [7, 8],
  ]) {
    fireEvent.click(card(a));
    fireEvent.click(card(b));
    closeModal();
  }
}

describe('GameBoard — positive-only scoring', () => {
  function totalScore() {
    return useGameStore.getState().totalScore;
  }

  function failTurn(a: number, b: number) {
    fireEvent.click(card(a));
    fireEvent.click(card(b));
    act(() => vi.advanceTimersByTime(FLIP_BACK_MS));
  }

  it('scores a first-sight match as Lucky (+150) with a ribbon in the reward modal', () => {
    renderStage1();
    fireEvent.click(card(0));
    fireEvent.click(card(1)); // einstein pair, second card never seen
    expect(totalScore()).toBe(TIER_POINTS.lucky);

    const banner = within(screen.getByRole('dialog')).getByTestId('match-banner');
    expect(banner).toHaveTextContent('Lucky find!');
    expect(banner).toHaveTextContent('+150');
  });

  it('stays Lucky when the second card is unseen, even if the first was seen', () => {
    renderStage1();
    failTurn(0, 2); // einstein + curie revealed, flip back
    fireEvent.click(card(0)); // seen einstein first…
    fireEvent.click(card(1)); // …but B was never seen: pure luck
    expect(totalScore()).toBe(TIER_POINTS.lucky);
  });

  it('scores a remembered match as Memory (+100) when the pair was never squandered', () => {
    renderStage1();
    failTurn(0, 2); // reveals einstein(0) and curie(2); partners unseen → no missed chance
    fireEvent.click(card(1)); // fresh einstein…
    fireEvent.click(card(0)); // …completed with the seen one: real memory
    expect(totalScore()).toBe(TIER_POINTS.memory);

    const banner = within(screen.getByRole('dialog')).getByTestId('match-banner');
    expect(banner).toHaveTextContent('Amazing memory!');
    expect(banner).toHaveTextContent('+100');
  });

  it('downgrades to the base tier (+50) after a missed chance was silently recorded', () => {
    renderStage1();
    failTurn(0, 2); // einstein(0) and curie(2) now seen
    failTurn(1, 3); // both partners were seen → missed chances for both pairs
    fireEvent.click(card(0));
    fireEvent.click(card(1)); // einstein finally matched
    expect(totalScore()).toBe(TIER_POINTS.match);

    const banner = within(screen.getByRole('dialog')).getByTestId('match-banner');
    expect(banner).toHaveTextContent('You got it!');
    expect(banner).toHaveTextContent('+50');
  });

  it('shows no scoring UI on a failed turn', () => {
    renderStage1();
    fireEvent.click(card(0));
    fireEvent.click(card(2));
    expect(screen.queryByTestId('match-banner')).not.toBeInTheDocument();
    expect(totalScore()).toBe(0);
    act(() => vi.advanceTimersByTime(FLIP_BACK_MS));
  });

  it('shows no tier ribbon when re-opening a matched card in exploration mode', () => {
    renderStage1();
    fireEvent.click(card(0));
    fireEvent.click(card(1));
    closeModal();

    fireEvent.click(card(0)); // free exploration re-opens the hero…
    const modal = screen.getByRole('dialog');
    expect(within(modal).getByText('Albert Einstein')).toBeInTheDocument();
    expect(within(modal).queryByTestId('match-banner')).not.toBeInTheDocument(); // …without a celebration
  });

  it('adds the pairs×25 level bonus on completion and reports the run total', () => {
    renderStage1();
    solveBoard(); // 4 first-sight matches, all Lucky
    const expected = 4 * TIER_POINTS.lucky + 4 * LEVEL_BONUS_PER_PAIR; // 600 + 100
    expect(totalScore()).toBe(expected);
    expect(screen.getByTestId('points-earned')).toHaveTextContent(`You earned +${expected} points!`);
    expect(screen.getByTestId('celebration')).toHaveTextContent(`Total points: ⭐ ${expected}`);
  });

  it('pays match points and the bonus again on a replay — points only ever grow', () => {
    const { unmount } = renderStage1();
    solveBoard();
    const firstRun = totalScore();
    unmount();

    renderStage1();
    solveBoard();
    expect(totalScore()).toBe(firstRun * 2);
  });

  it('celebrates a completed collection with the trophy moment after the reward modal', () => {
    // every inventor except einstein is already in the album
    for (const id of collectionMembers('inventors')) {
      if (id !== 'einstein') useGameStore.getState().unlockSticker(id);
    }
    renderStage1();
    fireEvent.click(card(0));
    fireEvent.click(card(1)); // einstein match completes the Inventors collection
    expect(useGameStore.getState().totalScore).toBe(TIER_POINTS.lucky + COLLECTION_BONUS);

    // the trophy waits behind the regular reward modal
    expect(screen.queryByTestId('collection-celebration')).not.toBeInTheDocument();
    closeModal();
    const celebration = screen.getByTestId('collection-celebration');
    expect(celebration).toHaveTextContent('You collected all the Inventors & Scientists! 🏆');
    expect(celebration).toHaveTextContent('+500');

    fireEvent.click(within(celebration).getByRole('button'));
    expect(screen.queryByTestId('collection-celebration')).not.toBeInTheDocument();
  });
});

describe('GameBoard — completion & free exploration loop', () => {

  it('fires the celebration with a Next Level button when all pairs are resolved', () => {
    renderStage1();
    solveBoard();
    expect(screen.getByTestId('celebration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next level/i })).toBeInTheDocument();
    expect(useGameStore.getState().completedLevels).toContain(1);
  });

  it('keeps the finished board live: tapping any open card re-triggers its modal', () => {
    renderStage1();
    solveBoard();
    fireEvent.click(card(2)); // curie, already matched
    const modal = screen.getByRole('dialog');
    expect(within(modal).getByText('Marie Curie')).toBeInTheDocument();
  });

  it('returns to the map when Next Level is pressed', () => {
    renderStage1();
    solveBoard();
    fireEvent.click(screen.getByRole('button', { name: /next level/i }));
    expect(useGameStore.getState().screen).toEqual({ name: 'map' });
  });
});
