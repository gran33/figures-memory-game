import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { playVoiceover, stopVoiceover } from '../audio';
import { getCharacter } from '../../i18n';

/**
 * Regression tests for the speaker button.
 *
 * Narration is synthesized on the fly. Chrome can be stuck paused after
 * cancel() (needs resume()), occasionally drops a speak() issued right after
 * cancel() (needs a watchdog), and Safari requires the first speak() to happen
 * synchronously inside the user's tap.
 */
interface SynthMock {
  speaking: boolean;
  speak: Mock;
  cancel: Mock;
  resume: Mock;
  getVoices: Mock;
}

const einstein = getCharacter('einstein');
const synth = () => window.speechSynthesis as unknown as SynthMock;

beforeEach(() => {
  vi.useFakeTimers();
  synth().speaking = false;
  synth().speak.mockClear();
  synth().cancel.mockClear();
  synth().resume.mockClear();
  // restore the realistic state machine (a test below overrides speak with a no-op)
  synth().speak.mockImplementation(() => {
    synth().speaking = true;
  });
  synth().cancel.mockImplementation(() => {
    synth().speaking = false;
  });
});

afterEach(() => {
  stopVoiceover();
  vi.useRealTimers();
});

describe('playVoiceover — on-the-fly speech synthesis', () => {
  it('speaks the localized bio exactly once', async () => {
    playVoiceover(einstein, 'en');
    await vi.advanceTimersByTimeAsync(1000);
    expect(synth().speak).toHaveBeenCalledTimes(1);
    const utterance = synth().speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('en-US');
    expect(utterance.text).toContain('I am Albert Einstein');
  });

  it('speaks synchronously within the tap (Safari) and resumes a stuck synthesizer (Chrome)', () => {
    playVoiceover(einstein, 'en');
    // speech must be requested before the tap handler returns — no timers
    expect(synth().speak).toHaveBeenCalledTimes(1);
    const cancelOrder = synth().cancel.mock.invocationCallOrder.at(-1)!;
    const resumeOrder = synth().resume.mock.invocationCallOrder.at(-1)!;
    const speakOrder = synth().speak.mock.invocationCallOrder.at(-1)!;
    expect(resumeOrder).toBeGreaterThan(cancelOrder);
    expect(speakOrder).toBeGreaterThan(resumeOrder);
  });

  it('re-kicks speech once if Chrome silently dropped the speak()', async () => {
    synth().speak.mockImplementation(() => {}); // dropped: speaking stays false
    playVoiceover(einstein, 'en');
    expect(synth().speak).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(synth().speak).toHaveBeenCalledTimes(2); // watchdog retry, same utterance
    expect(synth().speak.mock.calls[1][0]).toBe(synth().speak.mock.calls[0][0]);
  });

  it('does not re-kick when speech is audibly playing', async () => {
    playVoiceover(einstein, 'en'); // mock sets speaking = true
    await vi.advanceTimersByTimeAsync(1000);
    expect(synth().speak).toHaveBeenCalledTimes(1);
  });

  it('uses the Hebrew speech language for Hebrew narration', () => {
    playVoiceover(einstein, 'he');
    const utterance = synth().speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('he-IL');
    expect(utterance.text).toContain('איינשטיין');
  });

  it('replaying restarts narration instead of stacking utterances', async () => {
    playVoiceover(einstein, 'en');
    await vi.advanceTimersByTimeAsync(1000);
    playVoiceover(einstein, 'en'); // speaker button pressed again
    await vi.advanceTimersByTimeAsync(1000);
    expect(synth().speak).toHaveBeenCalledTimes(2);
    expect(synth().cancel).toHaveBeenCalled();
  });
});
