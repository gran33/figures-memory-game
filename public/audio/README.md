# Voiceover audio assets

Localized narration clips matching the `audioUrl` paths in
`src/data/gameData.json`:

```
public/audio/en/<characterId>.m4a   (Samantha, en-US)
public/audio/he/<characterId>.m4a   (Carmit, he-IL)
```

Regenerate them anytime (macOS only — uses the built-in `say` TTS):

```bash
npm run gen:audio
```

To use professional recordings instead, just drop files at the same
paths. If a clip is missing or fails to load, the game falls back to
the browser's speech synthesis reading the character's localized
first-person bio aloud, so narration always works.
