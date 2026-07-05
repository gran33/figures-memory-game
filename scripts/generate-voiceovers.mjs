#!/usr/bin/env node
/**
 * Generates one narration clip per character per language into
 * public/audio/<lang>/<characterId>.mp3 (~130KB each, loaded lazily by the
 * game). Safe to re-run; overwrites clips. Run after adding characters:
 *
 *   npm run gen:audio
 *
 * Primary engine: edge-tts (free Microsoft neural voices, gender-matched,
 * warm). Install once with:
 *   python3 -m pip install --user edge-tts
 * Fallback engine: macOS built-in `say` (robotic, but always available).
 */
import { execFileSync, execFile } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gameData = JSON.parse(readFileSync(join(root, 'src/data/gameData.json'), 'utf8'));

/** Gender-matched neural voices: each hero introduces themselves with a fitting voice. */
const EDGE_VOICES = {
  en: { male: 'en-US-AndrewNeural', female: 'en-US-AvaNeural' },
  he: { male: 'he-IL-AvriNeural', female: 'he-IL-HilaNeural' },
};
const EDGE_RATE = '-10%'; // a touch slower for young listeners
const SAY_VOICES = {
  en: { male: 'Daniel', female: 'Samantha' },
  he: { male: 'Carmit', female: 'Carmit' }, // macOS ships a single Hebrew voice
};

function hasEdgeTts() {
  try {
    execFileSync('python3', ['-m', 'edge_tts', '--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function generateEdge(voice, text, outPath) {
  await execFileAsync('python3', [
    '-m', 'edge_tts',
    '--voice', voice,
    `--rate=${EDGE_RATE}`,
    '--text', text,
    '--write-media', outPath,
  ]);
}

async function generateSay(voice, text, outPath) {
  // `say` cannot write mp3 — emit AAC into the same filename; browsers sniff
  // the real codec from content, not the extension.
  await execFileAsync('say', ['-v', voice, '-r', '165', '-o', outPath, '--data-format=aac', text]);
}

const useEdge = hasEdgeTts();
if (!useEdge) {
  console.warn('edge-tts not found (python3 -m pip install --user edge-tts) — falling back to macOS `say`.');
}

const jobs = [];
for (const character of gameData.characters) {
  for (const lang of Object.keys(EDGE_VOICES)) {
    const locale = character.languages[lang];
    if (!locale) continue;
    const outPath = join(root, 'public', 'audio', lang, `${character.id}.mp3`);
    mkdirSync(dirname(outPath), { recursive: true });
    const text = `${locale.name}. ${locale.bio}`;
    const gender = character.gender ?? 'male';
    jobs.push(() =>
      useEdge
        ? generateEdge(EDGE_VOICES[lang][gender], text, outPath)
        : generateSay(SAY_VOICES[lang][gender], text, outPath),
    );
  }
}

// generate with modest parallelism (edge-tts is a network service)
const CONCURRENCY = 5;
let done = 0;
async function worker() {
  while (jobs.length > 0) {
    const job = jobs.shift();
    await job();
    done++;
    process.stdout.write(`\r${done} clips generated…`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`\nDone: voiceovers written to public/audio/ (engine: ${useEdge ? 'edge-tts' : 'say'})`);
