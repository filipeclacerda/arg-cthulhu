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
export type EndingId = "restore" | "shutdown";

export interface PuzzleProgress {
  attempts: number;
  activeMs: number;
  hintsUnlocked: number;
  availableAt: number | null;
  solvedAt: number | null;
}

export interface ProgressStateV3 {
  version: 3;
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
}

export type GameEvent =
  | { type: "SET_FLAG"; flag: string }
  | { type: "MARK_FILE_READ"; fileId: string }
  | { type: "MARK_EMAIL_READ"; emailId: string }
  | { type: "DISCOVER_EVIDENCE"; evidenceId: string; resourceId?: string }
  | { type: "VISIT_PAGE"; pageId: string }
  | { type: "ATTEMPT_PUZZLE"; puzzleId: PuzzleId }
  | { type: "SOLVE_PUZZLE"; puzzleId: PuzzleId; solvedAt?: number }
  | { type: "UNLOCK_HINT"; puzzleId: PuzzleId; level?: number }
  | { type: "ADD_ACTIVE_TIME"; puzzleId: PuzzleId; elapsedMs: number }
  | { type: "COLLECT_REFERENCE"; reference: string }
  | { type: "SET_PLAYER_NAME"; name: string | null }
  | { type: "SET_CASE_NOTES"; notes: string }
  | { type: "SET_LAST_RESOURCE"; resourceId: string }
  | { type: "FUTURE_SEQUENCE_ACTION"; action: string }
  | { type: "RUN_COMMAND"; command: string }
  | { type: "CHOOSE_ENDING"; ending: EndingId }
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
      },
    ])
  ) as Record<PuzzleId, PuzzleProgress>;

export const createInitialProgress = (
  now = Date.now(),
  caseId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `case-${now}-${Math.random().toString(36).slice(2)}`
): ProgressStateV3 => ({
  version: 3,
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
  if (isPuzzleSolved(state, "future_log")) return 3;
  if (isPuzzleSolved(state, "counting_audio")) return 2;
  return 1;
};
