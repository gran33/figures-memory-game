import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { playVoiceover, stopVoiceover } from '../audio';
import { getCharacter } from '../../i18n';

/**
 * Narration plays pre-generated per-character clips (/audio/<lang>/<id>.mp3),
 * with Web Speech only as a fallback. Regressions covered: a broken clip
 * fires BOTH the error event and the play() rejection (must fall back exactly
 * once); Safari needs post-failure taps to speak synchronously in-gesture;
 * Chrome needs resume() after cancel() plus a watchdog re-kick.
 */
const instances: Array<{ src: string; play: Mock; pause: Mock }> = [];
let failPlayback = false;

class RecordingAudio {
  src: string;
  onerror: (() => void) | null = null;
  play: Mock;
  pause = vi.fn();
  constructor(src?: string) {
    this.src = src ?? '';
    this.play = vi.fn(() => {
      if (failPlayback) {
        this.onerror?.(); // error event
        return Promise.reject(new Error('NotSupportedError')); // and rejected play()
      }
      return Promise.resolve();
    });
    instances.push(this as never);
  }
}

const einstein = getCharacter('einstein');
const curie = getCharacter('curie');

interface SynthMock {
  speaking: boolean;
  speak: Mock;
  cancel: Mock;
  resume: Mock;
}
const synth = () => window.speechSynthesis as unknown as SynthMock;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('Audio', RecordingAudio);
  instances.length = 0;
  failPlayback = false;
  synth().speaking = false;
  synth().speak.mockClear();
  synth().cancel.mockClear();
  synth().resume.mockClear();
  synth().speak.mockImplementation(() => {
    synth().speaking = true;
  });
  synth().cancel.mockImplementation(() => {
    synth().speaking = false;
  });
});

afterEach(() => {
  stopVoiceover();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('playVoiceover — pre-generated narration clips', () => {
  it('plays the localized clip for the character, without any speech synthesis', async () => {
    await playVoiceover(einstein, 'en');
    expect(instances).toHaveLength(1);
    expect(instances[0].src).toBe('/audio/en/einstein.mp3');
    expect(instances[0].play).toHaveBeenCalled();
    expect(synth().speak).not.toHaveBeenCalled();
  });

  it('plays the Hebrew clip when the active language is Hebrew', async () => {
    await playVoiceover(curie, 'he');
    expect(instances[0].src).toBe('/audio/he/curie.mp3');
  });

  it('replaying pauses the previous clip instead of stacking narrations', async () => {
    await playVoiceover(einstein, 'en');
    await playVoiceover(einstein, 'en');
    expect(instances).toHaveLength(2);
    expect(instances[0].pause).toHaveBeenCalled();
  });

  it('stops the active clip when stopVoiceover is called', async () => {
    await playVoiceover(einstein, 'en');
    stopVoiceover();
    expect(instances[0].pause).toHaveBeenCalled();
  });
});

describe('playVoiceover — Web Speech fallback for broken clips', () => {
  it('falls back exactly once when a clip fails twice over (error event + rejection)', async () => {
    failPlayback = true;
    await playVoiceover(einstein, 'en');
    await vi.advanceTimersByTimeAsync(1000);
    expect(synth().speak).toHaveBeenCalledTimes(1);
    const utterance = synth().speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('en-US');
    expect(utterance.text).toContain('I am Albert Einstein');
  });

  it('speaks synchronously in-gesture once a clip is known broken (Safari requirement)', async () => {
    failPlayback = true;
    await playVoiceover(einstein, 'en'); // learns the clip is broken
    await vi.advanceTimersByTimeAsync(1000);
    synth().speak.mockClear();
    void playVoiceover(einstein, 'en'); // next tap — note: not awaited
    expect(synth().speak).toHaveBeenCalledTimes(1);
  });

  it('resumes a stuck synthesizer before speaking (Chrome)', async () => {
    failPlayback = true;
    await playVoiceover(einstein, 'en');
    const cancelOrder = synth().cancel.mock.invocationCallOrder.at(-1)!;
    const resumeOrder = synth().resume.mock.invocationCallOrder.at(-1)!;
    const speakOrder = synth().speak.mock.invocationCallOrder.at(-1)!;
    expect(resumeOrder).toBeGreaterThan(cancelOrder);
    expect(speakOrder).toBeGreaterThan(resumeOrder);
  });

  it('re-kicks speech once if Chrome silently dropped the speak()', async () => {
    failPlayback = true;
    synth().speak.mockImplementation(() => {}); // dropped: speaking stays false
    await playVoiceover(einstein, 'en');
    expect(synth().speak).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(synth().speak).toHaveBeenCalledTimes(2); // watchdog retry, same utterance
    expect(synth().speak.mock.calls[1][0]).toBe(synth().speak.mock.calls[0][0]);
  });
});
