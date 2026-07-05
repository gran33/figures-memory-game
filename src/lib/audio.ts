import type { Character, Language } from '../types';
import { gameData } from '../i18n';

let watchdogTimer: ReturnType<typeof setTimeout> | undefined;
// Chrome garbage-collects in-flight utterances that lose their last reference,
// which silently stops playback — keep the active one referenced.
let activeUtterance: SpeechSynthesisUtterance | null = null;

// Chrome populates the voice list asynchronously; touching it early warms it up
// so a matching voice is available by the time the first character speaks.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    window.speechSynthesis.getVoices();
  });
}

/** Best voice for a BCP-47 tag: exact match first, then language prefix; prefer local voices (Chrome's remote ones cut long text off). */
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

/**
 * Narrates the character's localized first-person bio on the fly with the
 * browser's speech synthesis — no audio assets to download.
 */
export function playVoiceover(character: Character, language: Language): void {
  stopVoiceover();
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

  // speak synchronously so Safari still sees the user's tap (its first-ever
  // utterance must start inside a gesture); resume() first because Chrome can
  // be stuck in a paused state after a cancel(), which mutes queued speech
  synth.cancel();
  synth.resume();
  synth.speak(utterance);

  // Chrome watchdog: a speak() issued right after cancel() is occasionally
  // dropped — if nothing is audible shortly after, kick it exactly once
  watchdogTimer = setTimeout(() => {
    if (activeUtterance === utterance && !synth.speaking) {
      synth.resume();
      synth.speak(utterance);
    }
  }, 400);
}

export function stopVoiceover(): void {
  clearTimeout(watchdogTimer);
  activeUtterance = null;
  window.speechSynthesis?.cancel();
}

/** Short joyful victory chime, synthesized so no asset download is needed. */
export function playChime(): void {
  try {
    const Ctor = window.AudioContext ?? (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
