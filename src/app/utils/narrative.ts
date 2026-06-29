// Narrative runtime helpers. The whole game rests on one impossible detail —
// "the computer remembers the future" — so the dates the player reads must be
// computed from THEIR real clock, not hardcoded. That way DO_NOT_OPEN.txt and
// the finale always say literally tomorrow's date, for every player, forever.

const DAY_MS = 24 * 60 * 60 * 1000;

/** A Date 24h ahead of `now`. The state the manuscript calls "tomorrow". */
export const tomorrow = (now: Date = new Date()): Date =>
  new Date(now.getTime() + DAY_MS);

/** Matches the Clock's M/D/YYYY format so in-file dates read like the taskbar. */
export const formatGameDate = (date: Date): string =>
  `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

export interface TokenContext {
  playerName?: string | null;
  /** Real wall-clock anchor; defaults to now. */
  now?: Date;
  /** Hours the player was away since last visit, for the "while you were gone" beat. */
  absenceHours?: number;
}

/**
 * Resolves narrative tokens in file/email text at render time:
 *   {TOMORROW} {TODAY} {PLAYER} {ELAPSED_HOURS}
 * Kept deliberately small — content stays readable in the data files, the
 * impossible parts get filled in from the player's own machine.
 */
export const resolveTokens = (text: string, ctx: TokenContext = {}): string => {
  const now = ctx.now ?? new Date();
  const player = ctx.playerName?.trim() || "NEXT USER";
  const elapsed =
    ctx.absenceHours != null ? String(Math.round(ctx.absenceHours)) : "—";

  return text
    .replace(/\{TOMORROW\}/g, formatGameDate(tomorrow(now)))
    .replace(/\{TODAY\}/g, formatGameDate(now))
    .replace(/\{PLAYER\}/g, player)
    .replace(/\{ELAPSED_HOURS\}/g, elapsed);
};

// --- Corruption scale -------------------------------------------------------
// Single source of truth for how far the desktop has "remembered" things that
// haven't happened. Stages escalate the horror from one glitching window to the
// whole machine being wrong. See styles/_corruption.scss for the visuals.

export const MAX_CORRUPTION_STAGE = 4;

/** Real-time absence (ms) past which the "while you were gone" beat fires. */
export const ABSENCE_THRESHOLD_MS = 60 * 1000; // 1 min — tune up for release.

/** Stage at/after which Sarah's live email "arrives" mid-session. */
export const SARAH_EMAIL_STAGE = 2;

/** Stage at/after which the user folder takes the player's name. */
export const IDENTITY_REVEAL_STAGE = 4;
