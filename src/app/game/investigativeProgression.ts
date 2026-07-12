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
  requirement?: PuzzleGateRequirement;
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
  return { allowed, requirement };
};
