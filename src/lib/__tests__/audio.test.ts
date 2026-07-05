import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { playVoiceover, stopVoiceover } from '../audio';
import { getCharacter } from '../../i18n';

/**
 * Regression: a missing mp3 (dev servers even answer it with index.html + 200)
 * fires BOTH the <audio> error event and the play() rejection. The fallback
 * must speak exactly once — a doubled cancel()+speak() is silently dropped by
 * Chrome, which made the speaker button mute.
 */
class BrokenAudio {
  src: string;
  onerror: (() => void) | null = null;
  constructor(src?: string) {
    this.src = src ?? '';
  }
  play() {
    this.onerror?.(); // error event
    return Promise.reject(new Error('NotSupportedError')); // and rejected play()
  }
  pause() {}
}

const einstein = getCharacter('einstein');
const synth = () => window.speechSynthesis as unknown as { speak: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('Audio', BrokenAudio);
  synth().speak.mockClear();
  synth().cancel.mockClear();
});

afterEach(() => {
  stopVoiceover();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('playVoiceover — speech synthesis fallback', () => {
  it('speaks the localized bio exactly once when the audio asset fails twice over', async () => {
    playVoiceover(einstein, 'en');
    await vi.advanceTimersByTimeAsync(500);
    expect(synth().speak).toHaveBeenCalledTimes(1);
    const utterance = synth().speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('en-US');
    expect(utterance.text).toContain('I am Albert Einstein');
  });

  it('defers speak() until after cancel() so Chrome does not drop it', async () => {
    playVoiceover(einstein, 'en');
    // cancel() ran, but speak() must NOT fire in the same tick
    await vi.advanceTimersByTimeAsync(0);
    expect(synth().cancel).toHaveBeenCalled();
    expect(synth().speak).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(synth().speak).toHaveBeenCalledTimes(1);
  });

  it('uses the Hebrew speech language for Hebrew narration', async () => {
    playVoiceover(einstein, 'he');
    await vi.advanceTimersByTimeAsync(500);
    const utterance = synth().speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('he-IL');
  });

  it('replaying restarts narration instead of stacking utterances', async () => {
    playVoiceover(einstein, 'en');
    await vi.advanceTimersByTimeAsync(500);
    playVoiceover(einstein, 'en'); // speaker button pressed again
    await vi.advanceTimersByTimeAsync(500);
    expect(synth().speak).toHaveBeenCalledTimes(2);
    expect(synth().cancel).toHaveBeenCalled();
  });
});
