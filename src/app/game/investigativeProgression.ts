import {
  CASE_STATEMENTS,
  checkEvidence,
  isObserverConclusionAvailable,
} from "./campaign";
import {
  CaseQuestionId,
  InsightId,
  ProgressStateV5,
  PuzzleId,
  PUZZLE_ORDER,
} from "./progress";

export type CaseFindingState = "hidden" | "available" | "retained";

export interface CaseFindingDefinition {
  id: CaseQuestionId;
  /** A narrative milestone may still withhold a finding whose records exist. */
  milestone: "initial" | "lead" | "observer";
}

export const CASE_FINDING_DEFINITIONS: readonly CaseFindingDefinition[] =
  CASE_STATEMENTS.map((statement) => ({
    id: statement.id,
    milestone:
      statement.act === 3 ? "observer" : statement.act === 1 ? "initial" : "lead",
  }));

const milestoneReached = (
  state: ProgressStateV5,
  questionId: CaseQuestionId
): boolean => {
  const statement = CASE_STATEMENTS.find((candidate) => candidate.id === questionId);
  if (!statement) return false;
  if (statement.act === 3) {
    return isObserverConclusionAvailable(state, questionId as Extract<CaseQuestionId,
      "future_displacement" | "relay_observer" | "chapter_ritual">);
  }
  return statement.act === 1 || state.leadsUnlocked.includes(statement.leadId);
};

export const caseFindingState = (
  state: ProgressStateV5,
  questionId: CaseQuestionId
): CaseFindingState => {
  if (state.caseAnswers[questionId]?.solvedAt) return "retained";
  const statement = CASE_STATEMENTS.find((candidate) => candidate.id === questionId);
  if (!statement || !milestoneReached(state, questionId)) return "hidden";
  return checkEvidence(statement.evidence, state.discoveredEvidenceIds) === "ok"
    ? "available"
    : "hidden";
};

export const availableCaseFindingIds = (
  state: ProgressStateV5
): CaseQuestionId[] =>
  CASE_FINDING_DEFINITIONS.map(({ id }) => id).filter(
    (id) => caseFindingState(state, id) !== "hidden"
  );

export const caseFindingAvailableFlag = (id: CaseQuestionId): string =>
  `case_finding_available_${id}`;
export const caseFindingAnnouncedFlag = (id: CaseQuestionId): string =>
  `case_finding_announced_${id}`;

export const syncCaseFindingAvailability = (
  state: ProgressStateV5
): ProgressStateV5 => {
  const flags = { ...state.flags };
  let changed = false;
  for (const id of availableCaseFindingIds(state)) {
    const flag = caseFindingAvailableFlag(id);
    if (!flags[flag]) {
      flags[flag] = true;
      changed = true;
    }
  }
  return changed ? { ...state, flags } : state;
};

export type PuzzleGateRequirement =
  | { kind: "finding"; findingId: CaseQuestionId }
  | { kind: "insight"; insightId: InsightId };

export type PuzzleGateReason =
  | "casefile_required"
  | "previous_puzzle_required";

export const PUZZLE_CASEFILE_GATES: Partial<
  Record<PuzzleId, PuzzleGateRequirement>
> = {
  palimpsest: { kind: "insight", insightId: "second_volume" },
  counting_audio: { kind: "finding", findingId: "volume_return" },
  lineage: { kind: "finding", findingId: "lineage_ledger" },
  future_log: { kind: "finding", findingId: "future_displacement" },
  index_name: { kind: "finding", findingId: "chapter_ritual" },
};

export interface PuzzleGateResult {
  allowed: boolean;
  reason?: PuzzleGateReason;
  requirement?: PuzzleGateRequirement;
  previousPuzzleId?: PuzzleId;
}

export const puzzleCasefileGate = (
  state: ProgressStateV5,
  puzzleId: PuzzleId
): PuzzleGateResult => {
  const requirement = PUZZLE_CASEFILE_GATES[puzzleId];
  if (!requirement) return { allowed: true };
  const allowed =
    requirement.kind === "finding"
      ? Boolean(state.caseAnswers[requirement.findingId]?.solvedAt)
      : state.insightsUnlocked.includes(requirement.insightId);
  return { allowed, requirement, ...(allowed ? {} : { reason: "casefile_required" }) };
};

/**
 * The main investigation is linear by design: each recovered artifact changes
 * the meaning of the next one. Enforce that relationship in the reducer as
 * well as in the UI unlocks, so an old callback, imported state, or future
 * surface cannot skip a recovery. The Casefile requirement is checked only
 * after the prior artifact is solved; it never asks for optional evidence.
 */
export const puzzleProgressGate = (
  state: ProgressStateV5,
  puzzleId: PuzzleId
): PuzzleGateResult => {
  const index = PUZZLE_ORDER.indexOf(puzzleId);
  const previousPuzzleId = index > 0 ? PUZZLE_ORDER[index - 1] : undefined;
  if (previousPuzzleId && !state.puzzles[previousPuzzleId]?.solvedAt) {
    return {
      allowed: false,
      reason: "previous_puzzle_required",
      previousPuzzleId,
    };
  }
  return puzzleCasefileGate(state, puzzleId);
};

/** One persisted prompt per blocked lead keeps the correction durable but quiet. */
export const puzzleGatePromptRequestedFlag = (puzzleId: PuzzleId): string =>
  `puzzle_gate_prompt_requested_${puzzleId}`;
export const puzzleGatePromptShownFlag = (puzzleId: PuzzleId): string =>
  `puzzle_gate_prompt_shown_${puzzleId}`;
