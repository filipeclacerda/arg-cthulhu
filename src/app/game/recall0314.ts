import { ProgressStateV3 } from "./progress";
import { UnlockCondition, isUnlocked } from "./unlock";
import { diegeticContext } from "./diegeticEvents";
import { modernQuestionReceipt } from "./messengerConsequences";

/**
 * Pure controller for the RECALL_0314 set piece — the moment the archive stops
 * merely remembering the past and proves it has already catalogued the
 * observer's next gesture. This module owns only the logic: the trigger, the
 * ordered phases, the persisted flags and resume math. The React driver
 * (RecallSequence) reads these selectors and never re-implements the ordering.
 *
 * Persistence rules (idempotent, no save-format change):
 *  - each phase persists its own `seenFlag` when it completes;
 *  - a reload resumes at the first incomplete phase — it never re-runs a beat;
 *  - `recall_0314_skipped` ends the sequence as interrupted, granting nothing;
 *  - once `recall_0314_complete` (or skipped), the set piece never re-arms.
 */

export type RecallPhaseId =
  | "clock"
  | "receipt"
  | "history"
  | "photo"
  | "silence"
  | "closure";

export type RecallStatus = "idle" | "active" | "complete" | "skipped";

export interface RecallPhase {
  id: RecallPhaseId;
  /** Persisted the moment this phase completes. */
  seenFlag: string;
  /** Active-time duration of the phase, in ms (timers pause on a hidden tab). */
  durationMs: number;
  /**
   * Under reduced motion the beat holds statically for at least this long and
   * advances only on an explicit action — no flicker, no automatic movement.
   */
  reducedHoldMs: number;
}

export const RECALL_STARTED_FLAG = "recall_0314_started";
export const RECALL_COMPLETE_FLAG = "recall_0314_complete";
export const RECALL_SKIPPED_FLAG = "recall_0314_skipped";

/** The beats, in order. Total active time lands inside the 3–5 minute window. */
export const RECALL_PHASES: readonly RecallPhase[] = [
  // Ambient fades; the clock fixes at 03:14:00; the tray reports no time source.
  { id: "clock", seenFlag: "recall_0314_clock_seen", durationMs: 35_000, reducedHoldMs: 12_000 },
  // Date/Time Properties, then the MSN system receipt derived from the modern
  // question — a receipt, never a new line from Sarah.
  { id: "receipt", seenFlag: "recall_0314_receipt_seen", durationMs: 40_000, reducedHoldMs: 14_000 },
  // The browser history at cache://sb-archive-02/history/0314 — three future
  // actions listed PENDING.
  { id: "history", seenFlag: "recall_0314_history_seen", durationMs: 45_000, reducedHoldMs: 16_000 },
  // office_after.jpg opens normal, then settles into the existing variant; the
  // minimized Media Player reads 04:12.
  { id: "photo", seenFlag: "recall_0314_photo_seen", durationMs: 40_000, reducedHoldMs: 14_000 },
  // Audio and clock stop. Nothing answers, narratively, for ~20–25s.
  { id: "silence", seenFlag: "recall_0314_silence_seen", durationMs: 24_000, reducedHoldMs: 20_000 },
  // PENDING -> CONFIRMED, CLOCK SOURCE RESTORED / OFFSET +24:00:00, then the
  // ledger: 5 RECORDS RECONCILED / 1 SOURCE UNRESOLVED.
  { id: "closure", seenFlag: RECALL_COMPLETE_FLAG, durationMs: 22_000, reducedHoldMs: 18_000 },
];

/**
 * Persisted narrative prerequisites for the set piece. Runtime gates (no focal
 * set piece open, no ending chosen) are applied by `recallTriggerReady`.
 */
export const RECALL_0314_WHEN: UnlockCondition = {
  type: "allOf",
  conditions: [
    { type: "puzzleSolved", puzzleId: "future_log" },
    { type: "flag", flag: "post_end_transcript_seen" },
    { type: "liveContactClosed" },
    {
      // The 1998 session concluded, or the modern question was missed outright
      // (the live window closed before a handshake was ever sent).
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "next_user_1998_complete" },
        { type: "not", condition: { type: "flag", flag: "next_user_handshake_sent" } },
      ],
    },
  ],
};

export const recallStatus = (flags: Record<string, boolean>): RecallStatus => {
  if (flags[RECALL_COMPLETE_FLAG]) return "complete";
  if (flags[RECALL_SKIPPED_FLAG]) return "skipped";
  if (flags[RECALL_STARTED_FLAG]) return "active";
  return "idle";
};

/** A hydrated save needs a recovery affordance only if the incident predated this mount. */
export const shouldShowRecallRecoveryNotice = (
  flags: Record<string, boolean>
): boolean => recallStatus(flags) === "active";

/** Receipt progress is earned only while the player is actually viewing its live thread. */
export const shouldAcknowledgeRecallReceipt = ({
  hasReceipt,
  messengerFocused,
  liveThreadSelected,
  alreadySeen,
}: {
  hasReceipt: boolean;
  messengerFocused: boolean;
  liveThreadSelected: boolean;
  alreadySeen: boolean;
}): boolean =>
  hasReceipt && messengerFocused && liveThreadSelected && !alreadySeen;

/** The first phase whose flag is not yet set, or null when all are complete. */
export const firstIncompletePhase = (
  flags: Record<string, boolean>
): RecallPhase | null =>
  RECALL_PHASES.find((phase) => !flags[phase.seenFlag]) ?? null;

export const nextPhase = (id: RecallPhaseId): RecallPhase | null => {
  const index = RECALL_PHASES.findIndex((phase) => phase.id === id);
  if (index < 0 || index + 1 >= RECALL_PHASES.length) return null;
  return RECALL_PHASES[index + 1];
};

export const phaseHoldMs = (
  phase: RecallPhase,
  reducedMotion: boolean
): number => (reducedMotion ? phase.reducedHoldMs : phase.durationMs);

/**
 * Whether the set piece may START now. False while it is already active,
 * complete or skipped, while an ending exists, or while any focal set piece is
 * on screen — the machine waits for a quiet desktop before it begins.
 */
export const recallTriggerReady = (
  state: ProgressStateV3,
  gate: { focalBusy: boolean }
): boolean => {
  if (recallStatus(state.flags) !== "idle") return false;
  if (state.ending) return false;
  if (gate.focalBusy) return false;
  return isUnlocked(RECALL_0314_WHEN, diegeticContext(state));
};

/** The dry system receipt shown in the messenger beat (never a verdict). */
export const recallReceiptLine = (state: ProgressStateV3): string | null =>
  modernQuestionReceipt(state);
