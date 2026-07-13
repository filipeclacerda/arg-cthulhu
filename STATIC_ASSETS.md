# Static asset optimization

Run `npm run optimize:assets` after changing source media. The script uses
Sharp to encode photographic PNGs over 100 KiB as WebP (quality 86) and
ffmpeg-static to encode every WAV as Ogg Vorbis (quality 4). Large PNGs are
removed only after all repository references are rewritten to WebP.

Audio keeps the original WAV files as a compatibility fallback. `MediaPlayer`
and `SoundContext` select Ogg when the browser advertises Vorbis support and
otherwise use the original WAV, so the existing MediaPlayer state, puzzle
branches, transcripts, and haunted-loop processing remain unchanged.

Measure the published static payload with:

```powershell
(Get-ChildItem public -Recurse -File | Measure-Object Length -Sum).Sum
```

The generated WebP/Ogg files are checked in because the desktop export serves
`public` directly. Do not optimize the tiny 48px icon PNGs or the font.
