import type { Character, Language } from '../types';
import { gameData } from '../i18n';

let activeAudio: HTMLAudioElement | null = null;
let speakTimer: ReturnType<typeof setTimeout> | undefined;
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

function speakBio(character: Character, language: Language): void {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const locale = character.languages[language];
  const speechLang = gameData.languages[language].speechLang;
  const utterance = new SpeechSynthesisUtterance(`${locale.name}. ${locale.bio}`);
  utterance.lang = speechLang;
  const langPrefix = speechLang.split('-')[0];
  const voice = synth
    .getVoices()
    .find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(langPrefix));
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.onend = () => {
    if (activeUtterance === utterance) activeUtterance = null;
  };
  activeUtterance = utterance;
  synth.cancel();
  // Chrome silently drops a speak() issued in the same tick as cancel() —
  // defer it slightly so the queue is actually clear.
  speakTimer = setTimeout(() => synth.speak(utterance), 80);
}

/**
 * Plays the character's localized voiceover file. If the mp3 asset is missing
 * (dev servers even answer with index.html, which fails audio decoding) the
 * narration gracefully falls back to speech synthesis reading the bio in the
 * active language — exactly once, no matter how many error signals fire.
 */
export function playVoiceover(character: Character, language: Language): void {
  stopVoiceover();
  const locale = character.languages[language];
  const audio = new Audio(locale.audioUrl);
  activeAudio = audio;

  // a broken source fires BOTH the error event and the play() rejection —
  // collapse them into a single fallback
  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    speakBio(character, language);
  };
  audio.onerror = fallback;
  audio.play?.()?.catch?.(fallback);
}

export function stopVoiceover(): void {
  clearTimeout(speakTimer);
  activeAudio?.pause();
  activeAudio = null;
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
