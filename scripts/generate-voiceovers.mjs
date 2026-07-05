#!/usr/bin/env node
/**
 * Generates the localized character voiceover files referenced by
 * `audioUrl` in src/data/gameData.json, using macOS's built-in `say`
 * text-to-speech (macOS only). Safe to re-run; overwrites existing clips.
 *
 *   npm run gen:audio
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gameData = JSON.parse(readFileSync(join(root, 'src/data/gameData.json'), 'utf8'));

/** macOS voice per language — both ship with macOS. */
const VOICES = { en: 'Samantha', he: 'Carmit' };
const RATE = 165; // slightly slower than default, friendlier for kids

let generated = 0;
for (const character of gameData.characters) {
  for (const [lang, voice] of Object.entries(VOICES)) {
    const locale = character.languages[lang];
    if (!locale) continue;
    const outPath = join(root, 'public', locale.audioUrl);
    mkdirSync(dirname(outPath), { recursive: true });
    const text = `${locale.name}. ${locale.bio}`;
    execFileSync('say', ['-v', voice, '-r', String(RATE), '-o', outPath, '--data-format=aac', text]);
    generated++;
  }
}
console.log(`Generated ${generated} voiceover clips into public/audio/`);
