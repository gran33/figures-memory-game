import { describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';
import { playVoiceover, stopVoiceover, warmVoices } from '../audio';
import { getCharacter } from '../../i18n';
import { KokoroTTS } from 'kokoro-js';
import { pipeline } from '@huggingface/transformers';

/**
 * Narration is generated on-device: Kokoro (English, gender-matched voices)
 * and MMS Hebrew (single speaker, gender via pitch). Both are mocked globally
 * in setupTests; WebAudio buffer sources are recorded on __audioSources.
 */
const einstein = getCharacter('einstein'); // male inventor
const curie = getCharacter('curie'); // female inventor

const fromPretrained = KokoroTTS.from_pretrained as unknown as Mock;
const hePipeline = pipeline as unknown as Mock;

interface RecordedSource {
  playbackRate: { value: number };
  start: Mock;
  stop: Mock;
}
const sources = () => (globalThis as never as { __audioSources: RecordedSource[] }).__audioSources;

async function kokoroGenerate(): Promise<Mock> {
  const instance = await fromPretrained.mock.results[0].value;
  return instance.generate as Mock;
}

beforeEach(() => {
  sources().length = 0;
});

afterEach(async () => {
  stopVoiceover();
  const generate = fromPretrained.mock.results[0] ? await kokoroGenerate() : null;
  generate?.mockClear();
});

describe('playVoiceover — on-device neural narration', () => {
  it('narrates English male heroes with the warm male Kokoro voice', async () => {
    await playVoiceover(einstein, 'en');
    const generate = await kokoroGenerate();
    expect(generate).toHaveBeenCalledWith(
      expect.stringContaining('I am Albert Einstein'),
      { voice: 'am_michael' },
    );
    expect(sources()).toHaveLength(1);
    expect(sources()[0].start).toHaveBeenCalled();
  });

  it('narrates English female heroes with the warm female Kokoro voice', async () => {
    await playVoiceover(curie, 'en');
    const generate = await kokoroGenerate();
    expect(generate).toHaveBeenCalledWith(expect.stringContaining('Marie Curie'), {
      voice: 'af_heart',
    });
  });

  it('narrates Hebrew with the on-device MMS Hebrew model, pitch-shifted by gender', async () => {
    await playVoiceover(einstein, 'he');
    expect(hePipeline).toHaveBeenCalledWith('text-to-speech', 'mms-tts-heb', expect.anything());
    const male = sources().at(-1)!;
    expect(male.playbackRate.value).toBeLessThan(1);

    await playVoiceover(curie, 'he');
    const female = sources().at(-1)!;
    expect(female.playbackRate.value).toBeGreaterThan(1);
  });

  it('loads each voice model only once across plays and warm-ups', async () => {
    warmVoices('en');
    await playVoiceover(einstein, 'en');
    await playVoiceover(curie, 'en');
    expect(fromPretrained).toHaveBeenCalledTimes(1);
  });

  it('stops the active narration when stopVoiceover is called', async () => {
    await playVoiceover(einstein, 'en');
    const source = sources().at(-1)!;
    stopVoiceover();
    expect(source.stop).toHaveBeenCalled();
  });

  it('replaying stops the previous narration instead of stacking voices', async () => {
    await playVoiceover(einstein, 'en');
    const first = sources().at(-1)!;
    await playVoiceover(einstein, 'en');
    expect(first.stop).toHaveBeenCalled();
    expect(sources()).toHaveLength(2);
  });

  it('falls back to Web Speech if the neural engine fails, so narration never goes silent', async () => {
    const generate = await (async () => {
      await playVoiceover(einstein, 'en'); // ensure engine exists
      return kokoroGenerate();
    })();
    const synth = window.speechSynthesis as unknown as { speak: Mock };
    synth.speak.mockClear();
    generate.mockRejectedValueOnce(new Error('model exploded'));
    await playVoiceover(einstein, 'en');
    expect(synth.speak).toHaveBeenCalledTimes(1);
    const utterance = synth.speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toContain('I am Albert Einstein');
  });
});
