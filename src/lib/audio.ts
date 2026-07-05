import type { Character, Language } from '../types';
import { gameData } from '../i18n';

/**
 * Narration: each character has a pre-generated warm, gender-matched neural
 * clip at /audio/<lang>/<id>.mp3 (~115KB, fetched lazily like an image and
 * runtime-cached for offline replays). Regenerate clips with `npm run
 * gen:audio`. If a clip is missing or fails to load, narration falls back to
 * the platform's Web Speech voices so it never goes silent.
 */

const clipUrl = (character: Character, language: Language) =>
  `/audio/${language}/${character.id}.mp3`;

/** Increments on every play/stop; async work checks it before touching audio. */
let session = 0;
let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let watchdogTimer: ReturnType<typeof setTimeout> | undefined;

/** Once a clip fails it is remembered, so every later tap can speak
 *  synchronously inside the user gesture (required by Safari). */
const brokenClips = new Set<string>();

/**
 * Narrates the character's localized first-person bio. Resolves when playback
 * has started (or the fallback was dispatched), so callers can show a spinner
 * while the clip loads.
 */
export async function playVoiceover(character: Character, language: Language): Promise<void> {
  const mySession = ++session;
  haltPlayback();
  const url = clipUrl(character, language);

  if (brokenClips.has(url)) {
    speakWithWebSpeech(character, language); // synchronous — still inside the tap
    return;
  }

  const audio = new Audio(url);
  activeAudio = audio;

  // a broken source fires BOTH the error event and the play() rejection —
  // collapse them into a single fallback
  let fellBack = false;
  const fallback = () => {
    if (fellBack || session !== mySession) return;
    fellBack = true;
    brokenClips.add(url);
    speakWithWebSpeech(character, language);
  };
  audio.onerror = fallback;
  try {
    await audio.play?.();
  } catch {
    fallback();
  }
}

export function stopVoiceover(): void {
  session++;
  haltPlayback();
}

function haltPlayback(): void {
  clearTimeout(watchdogTimer);
  activeAudio?.pause();
  activeAudio = null;
  activeUtterance = null;
  window.speechSynthesis?.cancel();
}

// ---------------------------------------------------------------------------
// Web Speech fallback (platform voices) — only used if a clip fails to load
// ---------------------------------------------------------------------------

function pickVoice(synth: SpeechSynthesis, speechLang: string): SpeechSynthesisVoice | undefined {
  const norm = (l: string) => l.replace('_', '-').toLowerCase();
  const target = norm(speechLang);
  const prefix = target.split('-')[0];
  const candidates = synth
    .getVoices()
    .filter((v) => norm(v.lang) === target || norm(v.lang).startsWith(prefix));
  return (
    candidates.find((v) => norm(v.lang) === target && v.localService) ??
    candidates.find((v) => norm(v.lang) === target) ??
    candidates.find((v) => v.localService) ??
    candidates[0]
  );
}

function speakWithWebSpeech(character: Character, language: Language): void {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
  const locale = character.languages[language];
  const speechLang = gameData.languages[language].speechLang;
  const utterance = new SpeechSynthesisUtterance(`${locale.name}. ${locale.bio}`);
  utterance.lang = speechLang;
  const voice = pickVoice(synth, speechLang);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.onend = () => {
    if (activeUtterance === utterance) activeUtterance = null;
  };
  activeUtterance = utterance;
  // resume() first: Chrome can be stuck paused after cancel(); then a watchdog
  // re-kicks once because Chrome occasionally drops a speak() after cancel()
  synth.cancel();
  synth.resume();
  synth.speak(utterance);
  watchdogTimer = setTimeout(() => {
    if (activeUtterance === utterance && !synth.speaking) {
      synth.resume();
      synth.speak(utterance);
    }
  }, 400);
}

/** Short joyful victory chime, synthesized so no asset download is needed. */
export function playChime(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as never as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  } catch {
    // audio is a bonus, never break gameplay
  }
}
