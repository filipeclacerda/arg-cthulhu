# Asset sources

- Windows 98 interface icons: [Windows 98 Icon Viewer by Alex Meub](https://win98icons.alexmeub.com/).
  Files used: Internet Explorer, Outlook Express, Notepad, Multimedia, Help,
  Recycle Bin, My Documents, Favorites, Internet Options and Computer Sound.
- `public/artifacts/counting.wav` is generated locally by
  `scripts/generate-counting-audio.mjs` from the project-owned recovered voice
  buffer. It is a 4:11 stereo PCM recording; the reversed buffer exists only in
  the left channel.
- `public/artifacts/voicemail-to-em.wav` is generated locally by
  `scripts/generate-voicemail-audio.mjs` — procedural tape/line hiss, two
  answering-machine beeps and noise modulated to suggest muffled, unintelligible
  speech and one laugh-like stretch, ending in four seconds of plain room tone.
  No real or synthesized voice; nothing in it is transcribable beyond the
  in-game diegetic transcript.
- `public/artifacts/call-without-voice.wav` and its recovered channel-difference
  variant are generated locally by `scripts/generate-silent-call-audio.mjs`.
  They contain procedural room tone, phase-opposed formant-like signals and
  noise; no recorded or synthesized intelligible voice is used.
- Sarah Bishop personal photographs under `public/photos/` were generated for
  this project with the built-in image generation workflow. They depict Sarah
  at the archive in 2026, Sarah with Miriam in 1998, and Sarah with Em on the
  coast in 2025, Sarah with Tom after a 2024 symposium, the Bishop family
  birthday in 2025, and the archive office after Sarah's disappearance.
  `office_1998_overlay.png` and `office_tomorrow_overlay.png` were generated
  with the same built-in workflow from the existing 2026 office photograph,
  preserving its framing for the three-time alignment puzzle.
- `public/sounds/*.wav` (click, error, chime, glitch, disk-seek, wet-click,
  future-chime, room-tone, room-tone-wet, ambient-hum and ambient-void) are
  generated locally by `scripts/generate-ui-sounds.mjs` — procedural PCM tones
  and noise, no external recordings. Used for window open/close, rejected Run
  commands, system notifications and corruption-stage escalation. Four ambient
  layers move from fluorescent CRT room tone to wet pipe resonance, electrical
  beating and finally a sparse sub-bass void. Muted entirely by the taskbar
  sound toggle.
- `public/sounds/radio-static.wav`, `harmonized-tone.wav`,
  `mechanical-moan.wav`, `metal-resonance.wav`, `clock.wav` and
  `deep-moaning-tone.wav` originate from the locally supplied `Horror SFX
  Free` package. Original file names and folders: `Ambient/Radio_static.wav`,
  `Stingers and Spooky Triggers/Harmonized Tone_Pleasant but Spooky.wav`,
  `Ambient/Mechanical Moan and Creaking.wav`, `Stingers and Spooky
  Triggers/Metal_resonance.wav`, `House & Office/Clock.wav`, and `Monsters &
  Ghosts/Tone_Moaning_Deep_3.wav`. The supplied package contains no license
  document; verify its distribution terms before a public release.
