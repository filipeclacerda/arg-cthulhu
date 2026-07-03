# Playtest telemetry

Telemetry is disabled unless the player explicitly opts in and
`NEXT_PUBLIC_POSTHOG_KEY` is configured.

Use a PostHog Cloud EU project with IP capture disabled. The client sends
curated events directly to the EU ingestion endpoint. Autocapture, person
profiles and session recording are not used.

Permitted properties are stable resource IDs, puzzle IDs, attempt categories,
timings, hint levels, theory outcomes, locale and ending. Never add player
names, Case Notes, raw searches, raw commands, message contents or Case Codes.

