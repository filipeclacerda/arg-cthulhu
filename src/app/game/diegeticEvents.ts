import {
  CaseQuestionId,
  ProgressStateV3,
  PuzzleId,
  PUZZLE_ORDER,
} from "./progress";
import { isUnlocked, UnlockCondition, UnlockContext } from "./unlock";
import {
  CASE_FINDING_DEFINITIONS,
  caseFindingAnnouncedFlag,
  caseFindingAvailableFlag,
} from "./investigativeProgression";

/**
 * Central registry for every diegetic desktop event — the dialogs, toasts and
 * takeovers that used to fire from independent effects in `desktop/page.tsx`.
 *
 * The coordinator drains this registry as a priority queue:
 *  - priority 1: mandatory set pieces (narrative reveals of the puzzle chain,
 *    the 1998 desktop takeover, the Finale trigger);
 *  - priority 2: Sarah's live Messenger contact;
 *  - priority 3: human rewards and world manifestations;
 *  - priority 4: optional recoveries (always discreet toasts, never windows).
 *
 * Rules enforced by the coordinator (see desktop/page.tsx):
 *  - never two focal windows at once — the previous one must be closed or
 *    minimized before the next presents;
 *  - a variable 1.2–2.4s pause between consecutive events (some events carry
 *    their own narrative delay range);
 *  - `seenFlag` is persisted the moment the event presents, so events never
 *    repeat and imported/hydrated saves drain only what is still pending.
 */

export type DiegeticPresentation =
  /** A small focal alert window that asks for interaction. */
  | { kind: "window"; windowId: string }
  /** Full-desktop takeover (the 1998 session flash). */
  | { kind: "overlay" }
  /** Starts a multi-app incident; the name and controller remain invisible. */
  | { kind: "sequence" }
  /**
   * Auto-opens the app window itself. Reserved — with the overlay — for the
   * three sanctioned auto-open moments (1998 desktop, post-4:11 audio set
   * piece, Sarah live). Everything else asks first.
   */
  | { kind: "autoApp"; windowId: string }
  /** Non-modal taskbar toast with an action button. */
  | { kind: "toast" };

export type DiegeticSound =
  | "disk"
  | "wet"
  | "future"
  | "chime"
  | "glitch"
  | "harmonized"
  | "mechanicalMoan"
  | "metalResonance"
  | "clock"
  | "deepMoan";

export interface DiegeticEventDefinition {
  id: string;
  priority: 1 | 2 | 3 | 4;
  presentation: DiegeticPresentation;
  /** Prerequisites, evaluated against the persisted save. */
  when: UnlockCondition;
  /** If this ever holds, the event is stale and must never present. */
  obsoleteWhen?: UnlockCondition;
  /** Persisted the moment the event presents; a set flag never re-enters. */
  seenFlag: string;
  /** Optional: silent incidents deliberately begin without a sting. */
  sound?: DiegeticSound;
  /** Narrative delay range in ms; defaults to the standard 1.2–2.4s pause. */
  delayRangeMs?: [number, number];
  /** Present only for a Casefile availability notification. */
  caseFindingId?: CaseQuestionId;
}

export const DIEGETIC_GAP_MIN_MS = 1_200;
export const DIEGETIC_GAP_MAX_MS = 2_400;

export const diegeticEventDelayMs = (
  definition: DiegeticEventDefinition,
  random: number = Math.random()
): number => {
  const [min, max] = definition.delayRangeMs ?? [
    DIEGETIC_GAP_MIN_MS,
    DIEGETIC_GAP_MAX_MS,
  ];
  return Math.round(min + (max - min) * Math.min(1, Math.max(0, random)));
};

const CASE_FINDING_EVENTS: DiegeticEventDefinition[] =
  CASE_FINDING_DEFINITIONS.map(({ id }) => ({
    id: `case_finding_${id}`,
    priority: 3 as const,
    presentation: { kind: "toast" as const },
    when: { type: "flag" as const, flag: caseFindingAvailableFlag(id) },
    obsoleteWhen: { type: "flag" as const, flag: caseFindingAnnouncedFlag(id) },
    seenFlag: caseFindingAnnouncedFlag(id),
    sound: "chime" as const,
    caseFindingId: id,
  }));

export const DIEGETIC_EVENTS: DiegeticEventDefinition[] = [
  // --- Priority 1: mandatory set pieces -----------------------------------
  {
    // Internal name only. The incident manifests through the existing Clock,
    // Date/Time Properties, Messenger, Browser and Image Viewer surfaces.
    id: "recall_0314",
    priority: 1,
    presentation: { kind: "sequence" },
    when: {
      type: "allOf",
      conditions: [
        { type: "puzzleSolved", puzzleId: "future_log" },
        { type: "flag", flag: "post_end_transcript_seen" },
        { type: "liveContactClosed" },
        {
          type: "anyOf",
          conditions: [
            { type: "flag", flag: "next_user_1998_complete" },
            { type: "not", condition: { type: "flag", flag: "next_user_handshake_sent" } },
          ],
        },
      ],
    },
    obsoleteWhen: {
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "recall_0314_complete" },
        { type: "flag", flag: "recall_0314_skipped" },
      ],
    },
    seenFlag: "recall_0314_started",
    delayRangeMs: [14_000, 20_000],
  },
  {
    // Sarah's mail from tomorrow (lineage reveal). Precedes the live MSN
    // window by construction: same trigger, lower queue position.
    id: "mail_from_tomorrow",
    priority: 1,
    presentation: { kind: "window", windowId: "new-mail-alert" },
    when: { type: "flag", flag: "sarah_email_arrived" },
    seenFlag: "sarah_email_notice_shown",
    sound: "harmonized",
  },
  {
    // RECOVERED appears under My Documents (lot_114 reveal).
    id: "restricted_folder",
    priority: 1,
    presentation: { kind: "window", windowId: "restricted-folder-alert" },
    when: { type: "flag", flag: "puzzle_lot_114_solved" },
    seenFlag: "restricted_folder_notice_shown",
    sound: "disk",
  },
  {
    // The machine becomes Miriam's 1998 desktop for ~7s. First chance.
    id: "flash_1998_attempt_1",
    priority: 1,
    presentation: { kind: "overlay" },
    when: { type: "puzzleSolved", puzzleId: "palimpsest" },
    obsoleteWhen: { type: "flag", flag: "miriam_1998_file_recovered" },
    seenFlag: "flash_1998_attempt_1_shown",
    sound: "disk",
    delayRangeMs: [1_600, 2_400],
  },
  {
    // counting.wav recovered (margin_cipher reveal). Keep this immediately
    // after the cipher result: the optional second 1998 session must not hold
    // the file alert (and its sound cue) behind an open-ended overlay.
    id: "counting_file",
    priority: 1,
    presentation: { kind: "window", windowId: "counting-file-alert" },
    when: { type: "flag", flag: "puzzle_margin_cipher_solved" },
    seenFlag: "counting_file_notice_shown",
    sound: "mechanicalMoan",
    delayRangeMs: [250, 500],
  },
  {
    // Second chance at the 1998 desktop, after margin_cipher.
    id: "flash_1998_attempt_2",
    priority: 1,
    presentation: { kind: "overlay" },
    when: {
      type: "allOf",
      conditions: [
        { type: "puzzleSolved", puzzleId: "margin_cipher" },
        { type: "flag", flag: "flash_1998_attempt_1_shown" },
      ],
    },
    obsoleteWhen: { type: "flag", flag: "miriam_1998_file_recovered" },
    seenFlag: "flash_1998_attempt_2_shown",
    sound: "disk",
    delayRangeMs: [1_600, 2_400],
  },
  {
    // The modern NEXT_USER reply wakes the same text session in 1998.
    id: "next_user_1998_session",
    priority: 1,
    presentation: { kind: "overlay" },
    when: { type: "flag", flag: "next_user_handshake_sent" },
    obsoleteWhen: { type: "flag", flag: "next_user_1998_complete" },
    seenFlag: "next_user_1998_session_shown",
    sound: "harmonized",
    delayRangeMs: [1_800, 2_600],
  },
  {
    // margin_ch7.enc recovered (palimpsest reveal, next link in the chain).
    id: "margin_file",
    priority: 1,
    presentation: { kind: "window", windowId: "margin-file-alert" },
    when: { type: "flag", flag: "puzzle_palimpsest_solved" },
    obsoleteWhen: { type: "flag", flag: "puzzle_margin_cipher_solved" },
    seenFlag: "margin_file_notice_shown",
    sound: "disk",
  },
  {
    // CHAPTER_SEVEN appears inside RECOVERED (counting_audio reveal).
    id: "chapter_seven",
    priority: 1,
    presentation: { kind: "window", windowId: "chapter-seven-alert" },
    when: { type: "flag", flag: "puzzle_counting_audio_solved" },
    seenFlag: "chapter_seven_notice_shown",
    sound: "metalResonance",
  },
  {
    // The recovered program finishes installing — the Finale trigger.
    id: "endgame_program",
    priority: 1,
    presentation: { kind: "window", windowId: "recovered-program-alert" },
    when: {
      type: "allOf",
      conditions: [
        { type: "flag", flag: "endgame_available" },
        { type: "flag", flag: "indexer_sequence_seen" },
      ],
    },
    seenFlag: "endgame_notice_shown",
    sound: "deepMoan",
  },

  // --- Priority 2: Sarah live ----------------------------------------------
  {
    // Sarah's live MSN window. One of the three sanctioned auto-opens.
    id: "sarah_msn_live",
    priority: 2,
    presentation: { kind: "autoApp", windowId: "msn-messenger" },
    when: { type: "flag", flag: "sarah_msn_live" },
    seenFlag: "sarah_msn_notice_shown",
    sound: "future",
  },

  // --- Priority 3: human rewards & manifestations ---------------------------
  {
    // A printer removed in 2004 acknowledges MIRIAM_DRAFT.PRN.
    id: "printer_miriam_draft",
    priority: 3,
    presentation: { kind: "window", windowId: "printer-recovery-alert" },
    when: { type: "worldReaction", reactionId: "printer_wake" },
    seenFlag: "printer_reaction_shown",
    sound: "disk",
  },
  {
    // The printer wakes on its own 3–6s after lot_114 and answers a query
    // nobody typed (PRESENT -> DUPLICATED happens live in the alert).
    id: "status_sheet",
    priority: 3,
    presentation: { kind: "window", windowId: "status-sheet-alert" },
    when: { type: "worldReaction", reactionId: "status_sheet" },
    seenFlag: "status_sheet_notice_shown",
    sound: "disk",
    delayRangeMs: [3_000, 6_000],
  },
  {
    // The everyday reward: a banal voicemail, a beat after the counting.wav
    // set piece has had time to fade. Simple alert -> discreet toast.
    id: "voicemail_to_em",
    priority: 3,
    presentation: { kind: "toast" },
    when: { type: "flag", flag: "post_end_transcript_seen" },
    seenFlag: "voicemail_notice_shown",
    sound: "chime",
    delayRangeMs: [26_000, 26_000],
  },

  ...CASE_FINDING_EVENTS,

  // --- Priority 4: optional recoveries (discreet toasts) --------------------
  {
    id: "optional_directory_comparison",
    priority: 4,
    presentation: { kind: "toast" },
    when: { type: "puzzleSolved", puzzleId: "margin_cipher" },
    seenFlag: "directory_comparison_notice_shown",
    sound: "disk",
  },
  {
    id: "optional_office_1998",
    priority: 4,
    presentation: { kind: "toast" },
    when: { type: "puzzleSolved", puzzleId: "counting_audio" },
    seenFlag: "temporal_photos_notice_shown",
    sound: "disk",
  },
  {
    id: "optional_silent_call",
    priority: 4,
    presentation: { kind: "toast" },
    when: { type: "puzzleSolved", puzzleId: "lineage" },
    seenFlag: "silent_call_notice_shown",
    sound: "future",
  },
  {
    // Technical fallback for the break protocol: only if the live contact is
    // spent and the `break` question was never asked. Gated on the solved
    // future log plus Tom's opened hash manifest (the same artifact the
    // ARCHIVE YOURSELF gate verifies).
    id: "sarah_break_cache",
    priority: 4,
    presentation: { kind: "toast" },
    when: {
      type: "allOf",
      conditions: [
        { type: "puzzleSolved", puzzleId: "future_log" },
        { type: "evidenceOpened", evidenceId: "hash_manifest" },
        { type: "liveContactClosed" },
        {
          type: "not",
          condition: {
            type: "choiceMade",
            choiceId: "sarah_live_question",
            optionId: "break",
          },
        },
      ],
    },
    seenFlag: "sarah_break_cache_materialized",
    sound: "disk",
  },
  {
    id: "micro_two_days_out",
    priority: 4,
    presentation: { kind: "toast" },
    when: { type: "worldReaction", reactionId: "unindexed_interval" },
    seenFlag: "two_days_out_notice_shown",
    sound: "clock",
  },
  {
    id: "micro_tom_held_block",
    priority: 4,
    presentation: { kind: "toast" },
    when: { type: "worldReaction", reactionId: "tom_hold_seek" },
    seenFlag: "tom_held_block_notice_shown",
    sound: "disk",
  },
  {
    id: "micro_eleanor_record",
    priority: 4,
    presentation: { kind: "toast" },
    when: {
      type: "worldReaction",
      reactionId: "eleanor_owner_reconciled",
    },
    seenFlag: "eleanor_record_notice_shown",
    sound: "future",
  },
  {
    // The 1998 reply leaves a persistent residue once the future log is solved.
    // A discreet toast points at whichever artifact the chosen reply changed
    // (DIALUP.LOG / USERMAP.DAT / the returned EMPTY.TMP). See
    // messengerConsequences.legacyReplyResidue for the per-reply target.
    id: "legacy_reply_echo",
    priority: 4,
    presentation: { kind: "toast" },
    when: {
      type: "allOf",
      conditions: [
        { type: "flag", flag: "next_user_1998_complete" },
        { type: "puzzleSolved", puzzleId: "future_log" },
        { type: "flag", flag: "recall_0314_complete" },
      ],
    },
    seenFlag: "legacy_reply_echo_shown",
    sound: "future",
  },
];

/** Window ids the coordinator may hold open; used for the focal-busy gate. */
export const DIEGETIC_FOCAL_WINDOW_IDS: ReadonlySet<string> = new Set(
  DIEGETIC_EVENTS.flatMap((definition) =>
    definition.presentation.kind === "window"
      ? [definition.presentation.windowId]
      : []
  )
);

/** Priority-1 window ids — the set pieces that pause the live-contact timer. */
export const DIEGETIC_SET_PIECE_WINDOW_IDS: ReadonlySet<string> = new Set(
  DIEGETIC_EVENTS.flatMap((definition) =>
    definition.priority === 1 && definition.presentation.kind === "window"
      ? [definition.presentation.windowId]
      : []
  )
);

export const isFocalPresentation = (
  presentation: DiegeticPresentation
): boolean => presentation.kind !== "toast";

/** Builds the unlock context the registry conditions are evaluated against. */
export const diegeticContext = (state: ProgressStateV3): UnlockContext => ({
  flags: state.flags,
  discoveredEvidenceIds: state.discoveredEvidenceIds,
  solvedPuzzleIds: PUZZLE_ORDER.filter((id: PuzzleId) =>
    Boolean(state.puzzles[id]?.solvedAt)
  ),
  insightsUnlocked: state.insightsUnlocked,
  worldReactionsSeen: state.worldReactionsSeen,
  playerChoices: state.playerChoices,
  liveContactStatus: state.liveContact.status,
});

export const isDiegeticEventPending = (
  definition: DiegeticEventDefinition,
  context: UnlockContext
): boolean =>
  !context.flags[definition.seenFlag] &&
  isUnlocked(definition.when, context) &&
  !(definition.obsoleteWhen && isUnlocked(definition.obsoleteWhen, context));

/**
 * Every event still owed to this save, in presentation order: priority
 * first, then registry order. Advanced (imported/hydrated) saves rebuild
 * their queue through this exact call — seen flags keep presented events
 * out, obsolete conditions drop stale ones.
 */
export const pendingDiegeticEvents = (
  context: UnlockContext,
  definitions: DiegeticEventDefinition[] = DIEGETIC_EVENTS
): DiegeticEventDefinition[] =>
  definitions
    .map((definition, index) => ({ definition, index }))
    .filter(({ definition }) => isDiegeticEventPending(definition, context))
    .sort(
      (a, b) =>
        a.definition.priority - b.definition.priority || a.index - b.index
    )
    .map(({ definition }) => definition);

export interface DiegeticGate {
  /** A focal presentation (window / overlay / auto-opened app) is on screen. */
  focalBusy: boolean;
  /** A coordinator toast is still visible. */
  toastBusy: boolean;
  /**
   * The player deliberately opened the closed-case archive. It remains a
   * readable desktop snapshot, so no deferred campaign events may drain.
   */
  aftermathReview?: boolean;
}

/**
 * The single event the coordinator may present right now, or null. Nothing
 * presents over an open focal set piece — it must be closed or minimized
 * first — and toasts additionally wait for the previous toast to clear.
 */
export const selectNextDiegeticEvent = (
  context: UnlockContext,
  gate: DiegeticGate,
  definitions: DiegeticEventDefinition[] = DIEGETIC_EVENTS
): DiegeticEventDefinition | null => {
  if (gate.aftermathReview) return null;
  if (gate.focalBusy) return null;
  const next = pendingDiegeticEvents(context, definitions)[0] ?? null;
  if (!next) return null;
  if (gate.toastBusy && next.presentation.kind === "toast") return null;
  return next;
};
