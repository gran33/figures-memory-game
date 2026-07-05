import type { Character, Gender, Language } from '../types';
import { gameData } from '../i18n';

/**
 * Narration engine — warm neural voices generated fully on-device:
 *
 *  - English: Kokoro-82M (WASM) with gender-matched voices
 *  - Hebrew:  Facebook MMS Hebrew (transformers.js); single-speaker model,
 *             so gender is differentiated with a gentle pitch shift
 *
 * Models are downloaded once, cached by the browser, then work offline.
 * No per-utterance network requests. If the neural engine is unavailable
 * (very old browser, storage cleared mid-flight), narration falls back to
 * the platform's Web Speech voices so it never goes silent.
 */

const EN_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
/** Shipped with the app in public/models/ (converted from facebook/mms-tts-heb). */
const HE_MODEL = 'mms-tts-heb';
const EN_VOICES = { male: 'am_michael', female: 'af_heart' } as const;
/** MMS Hebrew is single-speaker; shift pitch slightly per gender. */
const HE_PLAYBACK_RATE: Record<Gender, number> = { male: 0.95, female: 1.12 };

interface GeneratedAudio {
  audio: Float32Array;
  sampling_rate: number;
}

/** Increments on every play/stop; async work checks it before touching audio. */
let session = 0;
let activeSource: AudioBufferSourceNode | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let watchdogTimer: ReturnType<typeof setTimeout> | undefined;

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  const Ctor =
    window.AudioContext ??
    (window as never as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx ??= new Ctor();
  // resume synchronously while we are still inside the user's tap
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

interface EnglishEngine {
  generate: (
    text: string,
    opts: { voice: (typeof EN_VOICES)[Gender] },
  ) => Promise<GeneratedAudio>;
}
type HebrewEngine = (text: string) => Promise<GeneratedAudio>;

let englishEngine: Promise<EnglishEngine> | null = null;
let hebrewEngine: Promise<HebrewEngine> | null = null;

function loadEnglishEngine(): Promise<EnglishEngine> {
  if (englishEngine) return englishEngine;
  const created: Promise<EnglishEngine> = import('kokoro-js')
    .then(({ KokoroTTS }) => KokoroTTS.from_pretrained(EN_MODEL, { dtype: 'q8', device: 'wasm' }))
    .catch((err) => {
      englishEngine = null; // allow retry (e.g. flaky first download)
      throw err;
    });
  englishEngine = created;
  return created;
}

function loadHebrewEngine(): Promise<HebrewEngine> {
  if (hebrewEngine) return hebrewEngine;
  const created: Promise<HebrewEngine> = import('@huggingface/transformers')
    .then(({ pipeline, env }) => {
      // the Hebrew model is bundled as a static asset — no remote fetches
      env.allowLocalModels = true;
      env.localModelPath = '/models/';
      return pipeline('text-to-speech', HE_MODEL, { dtype: 'q8' });
    })
    .then((synth) => (text: string) => synth(text) as Promise<GeneratedAudio>)
    .catch((err) => {
      hebrewEngine = null;
      throw err;
    });
  hebrewEngine = created;
  return created;
}

/** Kick off the model download early (e.g. when a level starts) so the first
 *  match modal doesn't wait for it. Errors are ignored — playback retries. */
export function warmVoices(language: Language): void {
  const load = language === 'he' ? loadHebrewEngine : loadEnglishEngine;
  load().catch(() => {});
}

function playWave(data: Float32Array, samplingRate: number, playbackRate: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  const buffer = ctx.createBuffer(1, data.length, samplingRate);
  buffer.copyToChannel(Float32Array.from(data), 0);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  source.connect(ctx.destination);
  source.start();
  source.onended = () => {
    if (activeSource === source) activeSource = null;
  };
  activeSource = source;
}

/**
 * Narrates the character's localized first-person bio. Resolves when playback
 * has started (or the fallback was dispatched), so callers can show a spinner
 * while the voice is being prepared.
 */
export async function playVoiceover(character: Character, language: Language): Promise<void> {
  const mySession = ++session;
  haltPlayback();
  getCtx(); // resume the AudioContext while still inside the tap
  const locale = character.languages[language];
  const text = `${locale.name}. ${locale.bio}`;

  try {
    if (language === 'he') {
      const synthesize = await loadHebrewEngine();
      const wave = await synthesize(text);
      if (session !== mySession) return; // user closed / replayed meanwhile
      playWave(wave.audio, wave.sampling_rate, HE_PLAYBACK_RATE[character.gender]);
    } else {
      const engine = await loadEnglishEngine();
      const wave = await engine.generate(text, { voice: EN_VOICES[character.gender] });
      if (session !== mySession) return;
      playWave(wave.audio, wave.sampling_rate, 1);
    }
  } catch {
    if (session === mySession) speakWithWebSpeech(character, language);
  }
}

export function stopVoiceover(): void {
  session++;
  haltPlayback();
}

function haltPlayback(): void {
  clearTimeout(watchdogTimer);
  try {
    activeSource?.stop();
  } catch {
    // already stopped
  }
  activeSource = null;
  activeUtterance = null;
  window.speechSynthesis?.cancel();
}

// ---------------------------------------------------------------------------
// Web Speech fallback (platform voices) — only used if the neural engine fails
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
    const ctx = getCtx();
    if (!ctx) return;
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
