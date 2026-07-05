/** A language code supported by the game. Add new codes here + in gameData.json to add a language. */
export type Language = 'en' | 'he';

export type TextDirection = 'ltr' | 'rtl';

export type CategoryId = 'inventors' | 'leaders' | 'athletes';

/** Localized assets for a single character in one language. */
export interface CharacterLocale {
  name: string;
  /** First-person bio: the character introduces themselves to the child. */
  bio: string;
  audioUrl: string;
}

export type Gender = 'male' | 'female';

export interface Character {
  id: string;
  category: CategoryId;
  /** Drives the narration voice so each hero speaks with a fitting voice. */
  gender: Gender;
  emoji: string;
  languages: Record<Language, CharacterLocale>;
}

export interface LanguageMeta {
  label: string;
  dir: TextDirection;
  /** BCP-47 tag used for speech synthesis fallback, e.g. "en-US". */
  speechLang: string;
}

/** Localized UI strings. Keys are stable; values live in gameData.json per language. */
export interface UiStrings {
  appTitle: string;
  appTagline: string;
  play: string;
  stickerAlbum: string;
  level: string;
  stage: string;
  locked: string;
  matches: string;
  nextLevel: string;
  backToMap: string;
  levelComplete: string;
  unlockedHeroes: string;
  exploreHint: string;
  share: string;
  replayAudio: string;
  close: string;
  mysteryHero: string;
  albumProgress: string;
  /** Template: {name} and {emoji} placeholders. */
  shareText: string;
  newStickerUnlocked: string;
}

export interface GameData {
  languages: Record<Language, LanguageMeta>;
  ui: Record<Language, UiStrings>;
  categories: Record<CategoryId, { emoji: string } & Record<Language, string>>;
  characters: Character[];
}

/** One playable match (map node). 22 of these span 8 grid stages. */
export interface LevelConfig {
  /** 1-based map position. */
  id: number;
  /** 1-based grid stage (1..8). */
  stage: number;
  rows: number;
  cols: number;
  /** Number of matching pairs on the board. */
  pairs: number;
  /** Grid index of the static, un-flippable logo cell (3×3 boards only). */
  logoIndex?: number;
}

export type CardStatus = 'down' | 'up' | 'matched';

export interface Card {
  /** Unique per board cell. */
  uid: string;
  characterId: string;
  status: CardStatus;
  isLogo: boolean;
}

export type Screen =
  | { name: 'menu' }
  | { name: 'map' }
  | { name: 'album' }
  | { name: 'game'; levelId: number };
