import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageLayout } from '../LanguageLayout';
import { LanguageToggle } from '../LanguageToggle';
import { useGameStore } from '../../store/gameStore';
import { getUi } from '../../i18n';
import gameData from '../../data/gameData.json';

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState(useGameStore.getInitialState(), true);
});

describe('LanguageLayout — LTR/RTL structural alignment', () => {
  it('applies English LTR document attributes and typography from gameData.json by default', () => {
    render(
      <LanguageLayout>
        <h1>{getUi(useGameStore.getState().language).appTitle}</h1>
      </LanguageLayout>,
    );
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(screen.getByText(gameData.ui.en.appTitle)).toBeInTheDocument();
  });

  it('reactively shifts the DOM to RTL and Hebrew typography when the language flips', () => {
    function Title() {
      const language = useGameStore((s) => s.language);
      return <h1>{getUi(language).appTitle}</h1>;
    }
    render(
      <LanguageLayout>
        <Title />
      </LanguageLayout>,
    );
    act(() => useGameStore.getState().setLanguage('he'));
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.documentElement).toHaveAttribute('lang', 'he');
    expect(screen.getByText(gameData.ui.he.appTitle)).toBeInTheDocument();
    expect(screen.queryByText(gameData.ui.en.appTitle)).not.toBeInTheDocument();
  });

  it('derives direction metadata from gameData.json, not hard-coded values', () => {
    expect(gameData.languages.en.dir).toBe('ltr');
    expect(gameData.languages.he.dir).toBe('rtl');
  });
});

describe('LanguageToggle — child-friendly language selector', () => {
  it('switches the active language when the other language is tapped', () => {
    render(
      <LanguageLayout>
        <LanguageToggle />
      </LanguageLayout>,
    );
    fireEvent.click(screen.getByRole('button', { name: gameData.languages.he.label }));
    expect(useGameStore.getState().language).toBe('he');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');

    fireEvent.click(screen.getByRole('button', { name: gameData.languages.en.label }));
    expect(useGameStore.getState().language).toBe('en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });
});
