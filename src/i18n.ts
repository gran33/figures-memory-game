import raw from './data/gameData.json';
import type { Character, GameData, Language, UiStrings } from './types';

/** The single, standalone content repository. Add a language by extending this JSON only. */
export const gameData = raw as unknown as GameData;

export const LANGUAGES = Object.keys(gameData.languages) as Language[];

export function getUi(language: Language): UiStrings {
  return gameData.ui[language];
}

export function getDirection(language: Language) {
  return gameData.languages[language].dir;
}

export function getCharacter(id: string): Character {
  const character = gameData.characters.find((c) => c.id === id);
  if (!character) throw new Error(`Unknown character id: ${id}`);
  return character;
}

/** Fill {placeholders} in a localized template string. */
export function format(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}
