import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { GameBoard, FLIP_BACK_MS } from '../GameBoard';
import { useGameStore } from '../../../store/gameStore';

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

describe('GameBoard — completion & free exploration loop', () => {
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
