# Asset sources

- Windows 98 interface icons: [Windows 98 Icon Viewer by Alex Meub](https://win98icons.alexmeub.com/).
  Files used: Internet Explorer, Outlook Express, Notepad, Multimedia, Help,
  Recycle Bin, My Documents, Favorites, Internet Options and Computer Sound.
- `public/artifacts/counting.wav` is generated locally by
  `scripts/generate-counting-audio.mjs` from the project-owned recovered voice
  buffer. It is a 4:11 stereo PCM recording; the reversed buffer exists only in
  the left channel.
- Sarah Bishop personal photographs under `public/photos/` were generated for
  this project with the built-in image generation workflow. They depict Sarah
  at the archive in 2026, Sarah with Miriam in 1998, and Sarah with Em on the
  coast in 2025, Sarah with Tom after a 2024 symposium, the Bishop family
  birthday in 2025, and the archive office after Sarah's disappearance.
- `public/sounds/*.wav` (click, error, chime, glitch, ambient-hum) are
  generated locally by `scripts/generate-ui-sounds.mjs` — procedural PCM tones
  and noise, no external recordings. Used for window open/close, rejected Run
  commands, system notifications, corruption-stage escalation, and the
  stage-3+ ambient loop. Muted entirely by the taskbar sound toggle.
