import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AlbumView } from '../AlbumView';
import { useGameStore } from '../../../store/gameStore';
import gameData from '../../../data/gameData.json';

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState(useGameStore.getInitialState(), true);
});

describe('AlbumView — permanent sticker album', () => {
  it('renders every character as a locked mystery silhouette by default', () => {
    render(<AlbumView />);
    const lockedStickers = screen.getAllByTestId('sticker-locked');
    expect(lockedStickers).toHaveLength(gameData.characters.length);
    expect(within(lockedStickers[0]).getByText('?')).toBeInTheDocument();
  });

  it('shows discovered characters as vibrant named stickers, grouped by category', () => {
    useGameStore.getState().unlockSticker('einstein');
    render(<AlbumView />);
    expect(screen.getByText('Albert Einstein')).toBeInTheDocument();
    expect(screen.getAllByTestId('sticker-locked')).toHaveLength(gameData.characters.length - 1);
    // category section headers come from gameData.json
    expect(screen.getByText(gameData.categories.inventors.en)).toBeInTheDocument();
    expect(screen.getByText(gameData.categories.leaders.en)).toBeInTheDocument();
    expect(screen.getByText(gameData.categories.athletes.en)).toBeInTheDocument();
  });

  it('opens the first-person character modal when an unlocked sticker is tapped', () => {
    useGameStore.getState().unlockSticker('einstein');
    render(<AlbumView />);
    fireEvent.click(screen.getByTestId('sticker-einstein'));
    const modal = screen.getByRole('dialog');
    expect(within(modal).getByText(/I am Albert Einstein/)).toBeInTheDocument();
    expect(within(modal).getByTestId('share-button')).toBeInTheDocument();
  });

  it('does not open a modal for locked stickers', () => {
    render(<AlbumView />);
    fireEvent.click(screen.getAllByTestId('sticker-locked')[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
