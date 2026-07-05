# Voiceover audio assets

Drop localized narration clips here, matching the `audioUrl` paths in
`src/data/gameData.json`:

```
public/audio/en/<characterId>.mp3
public/audio/he/<characterId>.mp3
```

Until a clip exists, the game gracefully falls back to the browser's
speech synthesis (`speechSynthesis`) reading the character's localized
first-person bio aloud, so narration always works.
