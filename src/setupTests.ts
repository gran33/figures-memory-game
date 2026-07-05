import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Node 26 exposes an experimental `localStorage` global that is `undefined`
// unless --localstorage-file is set, shadowing jsdom's implementation.
if (typeof localStorage === 'undefined' || localStorage === undefined) {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (i) => [...store.keys()][i] ?? null,
    removeItem: (key) => void store.delete(key),
    setItem: (key, value) => void store.set(key, String(value)),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, writable: true });
  Object.defineProperty(window, 'localStorage', { value: memoryStorage, writable: true });
}

// jsdom does not implement matchMedia (used by framer-motion for reduced-motion checks)
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom does not implement media playback
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();

// jsdom does not implement speechSynthesis — mock mimics the real state machine
const speechSynthesisMock = {
  speaking: false,
  speak: vi.fn(() => {
    speechSynthesisMock.speaking = true;
  }),
  cancel: vi.fn(() => {
    speechSynthesisMock.speaking = false;
  }),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  addEventListener: vi.fn(),
};
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: speechSynthesisMock,
});

class MockUtterance {
  text: string;
  lang = '';
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  constructor(text?: string) {
    this.text = text ?? '';
  }
}
Object.defineProperty(window, 'SpeechSynthesisUtterance', { writable: true, value: MockUtterance });

class MockAudio {
  src: string;
  onerror: (() => void) | null = null;
  constructor(src?: string) {
    this.src = src ?? '';
  }
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}
Object.defineProperty(window, 'Audio', { writable: true, value: MockAudio });
