import type { Character, Language } from '../types';
import { gameData } from '../i18n';

let activeAudio: HTMLAudioElement | null = null;

/**
 * Plays the character's localized voiceover file. If the mp3 asset is missing
 * (or fails to load), gracefully falls back to speech synthesis reading the bio
 * in the active language, so narration always works.
 */
export function playVoiceover(character: Character, language: Language): void {
  stopVoiceover();
  const locale = character.languages[language];
  const audio = new Audio(locale.audioUrl);
  activeAudio = audio;
  const speakFallback = () => {
    if (typeof window.speechSynthesis === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${locale.name}. ${locale.bio}`);
    utterance.lang = gameData.languages[language].speechLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };
  audio.onerror = speakFallback;
  audio.play?.()?.catch?.(speakFallback);
}

export function stopVoiceover(): void {
  activeAudio?.pause();
  activeAudio = null;
  if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
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
