export const PUZZLE_IDS = [
  "lot_114",
  "palimpsest",
  "margin_cipher",
  "counting_audio",
  "lineage",
  "future_log",
  "index_name",
] as const;

export type PuzzleId = (typeof PUZZLE_IDS)[number];
export type EndingId = "restore" | "shutdown" | "seal";
export type Locale = "en" | "pt-BR";
export type LeadId =
  | "sarah_last_day"
  | "lot_provenance"
  | "locked_room"
  | "manuscript"
  | "historical"
  | "acoustic"
  | "observer";
export type CaseQuestionId =
  | "sarah_intent"
  | "volume_return"
  | "locked_room_source"
  | "future_displacement"
  | "relay_observer"
  | "chapter_ritual";
export type HypothesisId =
  | "tom_forged_image"
  | "sarah_fled"
  | "innsmouth_theft";
export type NarrativeBeatId =
  | "relay_referrer_lost"
  | "act1_partial_recovery"
  | "act1_reconstructed"
  | "miriam_draft_printed"
  | "sarah_msn_live"
  | "observer_reconstructed"
  | "relay_sealed";
export type WorldReactionId =
  | "printer_wake"
  | "monitor_condensation"
  | "clock_lost_second"
  | "future_search"
  | "photo_changed"
  | "minimized_audio"
  | "cursor_hesitation"
  | "empty_chair"
  | "contact_typing"
  | "tom_page_changed"
  | "case_code_drift"
  | "self_indexed";
export type OptionalDiscoveryId =
  | "paint_doodles"
  | "dad_recipe"
  | "midi_collection"
  | "lecture_draft"
  | "library_humor"
  | "solitaire_save"
  | "tom_homepage"
  | "containment_utility";
export type InsightId =
  | "second_volume"
  | "cataloguer_lineage"
  | "observer_relay"
  | "institutional_suppression"
  | "miriam_break"
  | "self_index";
export type AttemptKind =
  | "catalog_partial"
  | "palimpsest_partial"
  | "cipher_method"
  | "cipher_key"
  | "audio_channel"
  | "audio_reverse"
  | "lineage_near_year"
  | "future_sequence_fault"
  | "index_missing_references"
  | "index_wrong_order";
export type HintTrigger = "time" | "near_miss" | "manual";
export type HintChannel =
  | "help"
  | "search"
  | "metadata"
  | "draft"
  | "log"
  | "system";
export type TelemetryEventName =
  | "session_start"
  | "session_end"
  | "resource_open"
  | "puzzle_attempt"
  | "puzzle_near_miss"
  | "hint_unlocked"
  | "puzzle_solved"
  | "theory_tested"
  | "ending_chosen";

export interface TelemetryEvent {
  name: TelemetryEventName;
  properties?: Record<string, string | number | boolean | null>;
}

export interface HintHistoryEntry {
  level: number;
  trigger: HintTrigger;
  channel: HintChannel;
  unlockedAt: number;
}

export interface PuzzleProgress {
  attempts: number;
  activeMs: number;
  hintsUnlocked: number;
  availableAt: number | null;
  solvedAt: number | null;
  nearMisses: Partial<Record<AttemptKind, number>>;
  lastMeaningfulProgressAt: number | null;
  hintHistory: HintHistoryEntry[];
}

export interface TheoryAttempt {
  evidenceIds: string[];
  attemptedAt: number;
  insightId: InsightId | null;
}

export interface CaseAnswer {
  answerId: string;
  evidenceIds: string[];
  attempts: number;
  solvedAt: number;
}

export interface HypothesisRecord {
  status: "open" | "supported" | "refuted";
  evidenceIds: string[];
  updatedAt: number;
}

export interface PlayerChoice {
  choiceId: string;
  optionId: string;
  chosenAt: number;
}

export interface ProgressStateV5 {
  version: 5;
  caseId: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
  flags: Record<string, boolean>;
  readFileIds: string[];
  readEmailIds: string[];
  discoveredEvidenceIds: string[];
  visitedPageIds: string[];
  collectedReferences: string[];
  puzzles: Record<PuzzleId, PuzzleProgress>;
  corruptionStage: number;
  playerName: string | null;
  firstSeenAt: number | null;
  lastSeenAt: number | null;
  absenceMs: number;
  caseNotes: string;
  lastResourceId: string | null;
  futureSequenceStep: number;
  futureSequenceFaults: number;
  ending: EndingId | null;
  boardPositions: Record<string, { x: number; y: number }>;
  boardConnections: string[];
  confirmedConnections: string[];
  locale: Locale;
  insightsUnlocked: InsightId[];
  theoryAttempts: TheoryAttempt[];
  leadsUnlocked: LeadId[];
  caseAnswers: Partial<Record<CaseQuestionId, CaseAnswer>>;
  hypotheses: Partial<Record<HypothesisId, HypothesisRecord>>;
  narrativeBeatsSeen: NarrativeBeatId[];
  worldReactionsSeen: WorldReactionId[];
  playerChoices: PlayerChoice[];
  optionalDiscoveries: OptionalDiscoveryId[];
  assetVariantsSeen: string[];
}

/** Source-compatible aliases keep the existing UI incremental while saves move to v5. */
export type ProgressStateV4 = ProgressStateV5;
export type ProgressStateV3 = ProgressStateV5;

export type GameEvent =
  | { type: "SET_FLAG"; flag: string }
  | { type: "MARK_FILE_READ"; fileId: string }
  | { type: "MARK_EMAIL_READ"; emailId: string }
  | { type: "DISCOVER_EVIDENCE"; evidenceId: string; resourceId?: string }
  | { type: "VISIT_PAGE"; pageId: string }
  | { type: "ATTEMPT_PUZZLE"; puzzleId: PuzzleId }
  | {
      type: "RECORD_NEAR_MISS";
      puzzleId: PuzzleId;
      kind: AttemptKind;
      channel?: HintChannel;
    }
  | { type: "SOLVE_PUZZLE"; puzzleId: PuzzleId; solvedAt?: number }
  | {
      type: "UNLOCK_HINT";
      puzzleId: PuzzleId;
      level?: number;
      trigger?: HintTrigger;
      channel?: HintChannel;
    }
  | { type: "ADD_ACTIVE_TIME"; puzzleId: PuzzleId; elapsedMs: number }
  | { type: "COLLECT_REFERENCE"; reference: string }
  | { type: "SET_PLAYER_NAME"; name: string | null }
  | { type: "SET_CASE_NOTES"; notes: string }
  | { type: "SET_LAST_RESOURCE"; resourceId: string }
  | { type: "FUTURE_SEQUENCE_ACTION"; action: string }
  | { type: "RUN_COMMAND"; command: string }
  | { type: "CHOOSE_ENDING"; ending: EndingId }
  | { type: "MOVE_BOARD_CARD"; cardId: string; x: number; y: number }
  | { type: "TOGGLE_BOARD_CONNECTION"; fromId: string; toId: string }
  | { type: "TEST_THEORY"; evidenceIds: string[] }
  | {
      type: "SUBMIT_CASE_ANSWER";
      questionId: CaseQuestionId;
      answerId: string;
      evidenceIds: string[];
    }
  | {
      type: "SET_HYPOTHESIS";
      hypothesisId: HypothesisId;
      status: HypothesisRecord["status"];
      evidenceIds: string[];
    }
  | { type: "UNLOCK_LEAD"; leadId: LeadId }
  | { type: "SEE_NARRATIVE_BEAT"; beatId: NarrativeBeatId }
  | { type: "TRIGGER_WORLD_REACTION"; reactionId: WorldReactionId }
  | { type: "RECORD_CHOICE"; choiceId: string; optionId: string }
  | { type: "DISCOVER_OPTIONAL"; discoveryId: OptionalDiscoveryId }
  | { type: "SEE_ASSET_VARIANT"; variantId: string }
  | { type: "RESET_BOARD_LAYOUT" }
  | { type: "SET_LOCALE"; locale: Locale }
  | { type: "TOUCH_SEEN"; now: number }
  | { type: "HYDRATE"; state: ProgressStateV3 }
  | { type: "RESET"; state: ProgressStateV3 };

export const PUZZLE_ORDER: PuzzleId[] = [...PUZZLE_IDS];

export const createPuzzleState = (
  now = Date.now()
): Record<PuzzleId, PuzzleProgress> =>
  Object.fromEntries(
    PUZZLE_IDS.map((id, index) => [
      id,
      {
        attempts: 0,
        activeMs: 0,
        hintsUnlocked: 0,
        availableAt: index === 0 ? now : null,
        solvedAt: null,
        nearMisses: {},
        lastMeaningfulProgressAt: index === 0 ? now : null,
        hintHistory: [],
      },
    ])
  ) as unknown as Record<PuzzleId, PuzzleProgress>;

export const createInitialProgress = (
  now = Date.now(),
  caseId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `case-${now}-${Math.random().toString(36).slice(2)}`
): ProgressStateV5 => ({
  version: 5,
  caseId,
  revision: 0,
  createdAt: now,
  updatedAt: now,
  flags: {},
  readFileIds: [],
  readEmailIds: [],
  discoveredEvidenceIds: [],
  visitedPageIds: [],
  collectedReferences: [],
  puzzles: createPuzzleState(now),
  corruptionStage: 0,
  playerName: null,
  firstSeenAt: now,
  lastSeenAt: now,
  absenceMs: 0,
  caseNotes: "",
  lastResourceId: null,
  futureSequenceStep: 0,
  futureSequenceFaults: 0,
  ending: null,
  boardPositions: {},
  boardConnections: [],
  confirmedConnections: [],
  locale: "en",
  insightsUnlocked: [],
  theoryAttempts: [],
  leadsUnlocked: ["sarah_last_day", "lot_provenance", "locked_room"],
  caseAnswers: {},
  hypotheses: {},
  narrativeBeatsSeen: [],
  worldReactionsSeen: [],
  playerChoices: [],
  optionalDiscoveries: [],
  assetVariantsSeen: [],
});

export const puzzleCorruptionStage = (
  puzzles: Record<PuzzleId, PuzzleProgress>
): number => {
  if (puzzles.index_name.solvedAt) return 4;
  if (puzzles.future_log.solvedAt) return 3;
  if (puzzles.lineage.solvedAt) return 2;
  if (puzzles.palimpsest.solvedAt) return 1;
  return 0;
};

export const isPuzzleSolved = (
  state: ProgressStateV3,
  puzzleId: PuzzleId
): boolean => Boolean(state.puzzles[puzzleId]?.solvedAt);

export const firstUnsolvedPuzzle = (
  state: ProgressStateV3
): PuzzleId | null =>
  PUZZLE_ORDER.find((id) => !isPuzzleSolved(state, id)) ?? null;

export const puzzleAct = (state: ProgressStateV3): number => {
  if (state.ending) return 4;
  if (
    state.leadsUnlocked.includes("observer") ||
    isPuzzleSolved(state, "future_log")
  ) return 3;
  if (
    state.flags.act1_reconstruction_complete ||
    isPuzzleSolved(state, "counting_audio")
  ) return 2;
  return 1;
};
