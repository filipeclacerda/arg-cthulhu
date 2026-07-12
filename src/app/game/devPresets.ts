import { CASE_STATEMENTS } from "./campaign";
import {
  DIEGETIC_EVENTS,
  diegeticContext,
  pendingDiegeticEvents,
} from "./diegeticEvents";
import { PUZZLE_CASEFILE_GATES } from "./investigativeProgression";
import {
  CHAPTER_IDS,
  CaseQuestionId,
  GameEvent,
  InsightId,
  ProgressStateV5,
  PUZZLE_IDS,
  PuzzleId,
  createInitialProgress,
} from "./progress";
import { reduceGameEvent } from "./puzzles";
import { UnlockCondition, isUnlocked } from "./unlock";

export const INSIGHT_SOLUTIONS: Record<InsightId, string[]> = {
  second_volume: ["miriam_1998", "diary", "lot_114_order"],
  miriam_break: ["miriam_1998", "miriam_letter_1998", "catalogue_lot_114"],
  institutional_suppression: ["incident_report", "maintenance_record", "whitfield_memo"],
  cataloguer_lineage: ["person-miriam", "person-sarah", "lineage_pattern"],
  observer_relay: ["person-sarah", "person-tom", "future_access_log"],
  self_index: ["future_access_log", "index_help", "record_2014"],
};

export const FINDING_SOLUTIONS: Record<
  CaseQuestionId,
  { slots: Record<string, string>; evidence: string[] }
> = {
  sarah_intent: { slots: { time: "time-six-thirty", intent: "intent-go-home" }, evidence: ["lecture_draft", "chat_em_archive"] },
  volume_return: { slots: { cause: "cause-deliberately-sent", family: "family-bishop" }, evidence: ["miriam_1998", "diary"] },
  locked_room_source: { slots: { place: "place-under-workstation", object: "object-pipe" }, evidence: ["incident_report", "maintenance_record"] },
  lineage_ledger: { slots: { year: "year-1977", family: "family-bishop", detail: "detail-incomplete-ledger" }, evidence: ["lineage_1977", "lineage_1912", "lineage_1949"] },
  future_displacement: { slots: { status: "status-tomorrow", time: "time-one-day" }, evidence: ["sarah_live_email", "future_access_log"] },
  relay_observer: { slots: { person: "person-observer", object: "object-archive-field" }, evidence: ["tom_last_message", "future_access_log"] },
  chapter_ritual: { slots: { cause: "cause-act-of-reconstruction", person: "person-observer" }, evidence: ["the_name", "future_access_log"] },
};

export const applyEvents = (state: ProgressStateV5, events: GameEvent[]): ProgressStateV5 =>
  events.reduce((current, event) => reduceGameEvent(current, event).state, state);

export const eventsForInsight = (id: InsightId): GameEvent[] => {
  const evidenceIds = INSIGHT_SOLUTIONS[id];
  return [
    ...evidenceIds.map((evidenceId): GameEvent => ({ type: "DISCOVER_EVIDENCE", evidenceId })),
    { type: "TEST_THEORY", evidenceIds, targetInsightId: id },
  ];
};

export const eventsForFinding = (id: CaseQuestionId): GameEvent[] => {
  const solution = FINDING_SOLUTIONS[id];
  return [
    ...solution.evidence.map((evidenceId): GameEvent => ({ type: "DISCOVER_EVIDENCE", evidenceId })),
    ...Object.values(solution.slots).map((tokenId): GameEvent => ({ type: "COLLECT_TOKEN", tokenId })),
    { type: "SUBMIT_CASE_ANSWER", questionId: id, slotSelections: solution.slots, evidenceIds: solution.evidence },
  ];
};

export const eventsToSolvePuzzle = (state: ProgressStateV5, puzzleId: PuzzleId): GameEvent[] => {
  const gate = PUZZLE_CASEFILE_GATES[puzzleId];
  const prefix = gate?.kind === "insight" && !state.insightsUnlocked.includes(gate.insightId)
    ? eventsForInsight(gate.insightId)
    : gate?.kind === "finding" && !state.caseAnswers[gate.findingId]?.solvedAt
      ? eventsForFinding(gate.findingId)
      : [];
  return [...prefix, { type: "SOLVE_PUZZLE", puzzleId }];
};

export const STAGE_PRESETS = [
  "stage2_lot114", "stage3_palimpsest", "stage3b_margin_cipher",
  "stage4_counting_audio", "stage5_lineage", "stage6_future_log", "endgame_index",
] as const;
export type StagePresetId = (typeof STAGE_PRESETS)[number];

const stageScripts: Record<StagePresetId, GameEvent[]> = {
  stage2_lot114: [{ type: "SOLVE_PUZZLE", puzzleId: "lot_114" }],
  stage3_palimpsest: [
    { type: "SET_FLAG", flag: "miriam_1998_file_recovered" }, { type: "SET_FLAG", flag: "1998_flash_seen" },
    ...eventsForInsight("second_volume"), { type: "SOLVE_PUZZLE", puzzleId: "palimpsest" },
  ],
  stage3b_margin_cipher: [{ type: "SOLVE_PUZZLE", puzzleId: "margin_cipher" }],
  stage4_counting_audio: [
    ...eventsForFinding("sarah_intent"), ...eventsForFinding("locked_room_source"), ...eventsForFinding("volume_return"),
    { type: "SOLVE_PUZZLE", puzzleId: "counting_audio" }, { type: "SET_FLAG", flag: "post_end_transcript_seen" },
  ],
  stage5_lineage: [
    ...eventsForFinding("lineage_ledger"), { type: "SOLVE_PUZZLE", puzzleId: "lineage" },
    { type: "RECORD_CHOICE", choiceId: "sarah_live_seen", optionId: "opened" },
    { type: "RECORD_CHOICE", choiceId: "sarah_live_question", optionId: "alive" },
  ],
  stage6_future_log: [
    ...eventsForFinding("future_displacement"), { type: "SOLVE_PUZZLE", puzzleId: "future_log" },
    ...eventsForFinding("relay_observer"), ...eventsForFinding("chapter_ritual"),
  ],
  endgame_index: [
    ...["E7", "A1", "C4", "B9"].map((reference): GameEvent => ({ type: "COLLECT_REFERENCE", reference })),
    { type: "SOLVE_PUZZLE", puzzleId: "index_name" }, { type: "SET_FLAG", flag: "indexer_sequence_seen" },
  ],
};

export const eventsForPreset = (id: StagePresetId): GameEvent[] =>
  STAGE_PRESETS.slice(0, STAGE_PRESETS.indexOf(id) + 1).flatMap((preset) => stageScripts[preset]);

export const buildStageState = (id: StagePresetId, base: ProgressStateV5): ProgressStateV5 => {
  const initial = { ...createInitialProgress(base.createdAt, base.caseId), locale: base.locale, playerName: base.playerName, createdAt: base.createdAt };
  return applyEvents(initial, eventsForPreset(id));
};

export const suppressPendingEvents = (input: ProgressStateV5): ProgressStateV5 => {
  let state = input.flags.recall_0314_started && !input.flags.recall_0314_complete
    ? applyEvents(input, [{ type: "SET_FLAG", flag: "recall_0314_skipped" }]) : input;
  state = applyEvents(state, [{ type: "SET_FLAG", flag: "initial_boot_windows_restored" }]);
  for (let pass = 0; pass < DIEGETIC_EVENTS.length; pass += 1) {
    const pending = pendingDiegeticEvents(diegeticContext(state));
    if (!pending.length) break;
    const events = pending.flatMap((definition): GameEvent[] => definition.id === "recall_0314"
      ? [{ type: "SET_FLAG", flag: definition.seenFlag }, { type: "SET_FLAG", flag: "recall_0314_skipped" }]
      : definition.caseFindingId
      ? [{ type: "MARK_CASE_FINDING_ANNOUNCED", findingId: definition.caseFindingId }]
      : [{ type: "SET_FLAG", flag: definition.seenFlag }]);
    const next = applyEvents(state, events);
    if (next === state) break;
    state = next;
  }
  return state;
};

export const explainCondition = (condition: UnlockCondition, state: ProgressStateV5, depth = 0): string[] => {
  const ok = isUnlocked(condition, { ...diegeticContext(state), readFileIds: state.readFileIds });
  const prefix = `${"  ".repeat(depth)}${ok ? "✓" : "✗"}`;
  if (condition.type === "allOf" || condition.type === "anyOf") return [
    `${prefix} ${condition.type}`,
    ...condition.conditions.flatMap((child) => explainCondition(child, state, depth + 1)),
  ];
  if (condition.type === "not") return [`${prefix} not`, ...explainCondition(condition.condition, state, depth + 1)];
  const detail = Object.entries(condition).filter(([key]) => key !== "type").map(([, value]) => String(value)).join(":");
  return [`${prefix} ${condition.type}${detail ? `:${detail}` : ""}`];
};

export const eventsToSatisfy = (state: ProgressStateV5, condition: UnlockCondition): GameEvent[] | null => {
  if (isUnlocked(condition, { ...diegeticContext(state), readFileIds: state.readFileIds })) return [];
  switch (condition.type) {
    case "always": return [];
    case "flag": return [{ type: "SET_FLAG", flag: condition.flag }];
    case "puzzleSolved": {
      let current = state; const events: GameEvent[] = [];
      for (const id of PUZZLE_IDS.slice(0, PUZZLE_IDS.indexOf(condition.puzzleId) + 1)) {
        if (current.puzzles[id].solvedAt) continue;
        const next = eventsToSolvePuzzle(current, id); events.push(...next); current = applyEvents(current, next);
      }
      return events;
    }
    case "chapter": {
      const index = CHAPTER_IDS.indexOf(condition.chapterId);
      const target = (["lot_114", "palimpsest", "counting_audio", "lineage", "index_name"] as PuzzleId[])[index - 1];
      return target ? eventsToSatisfy(state, { type: "puzzleSolved", puzzleId: target }) : [];
    }
    case "evidenceOpened": return [{ type: "DISCOVER_EVIDENCE", evidenceId: condition.evidenceId }];
    case "fileRead": return [{ type: "MARK_FILE_READ", fileId: condition.fileId }];
    case "worldReaction": return [{ type: "TRIGGER_WORLD_REACTION", reactionId: condition.reactionId as never }];
    case "choiceMade": return [{ type: "RECORD_CHOICE", choiceId: condition.choiceId, optionId: condition.optionId ?? "dev" }];
    case "liveContactClosed": return [
      { type: "RECORD_CHOICE", choiceId: "sarah_live_seen", optionId: "opened" },
      { type: "RECORD_CHOICE", choiceId: "sarah_live_question", optionId: "alive" },
    ];
    case "not": return null;
    case "allOf": {
      let current = state; const events: GameEvent[] = [];
      for (const child of condition.conditions) { const next = eventsToSatisfy(current, child); if (next === null) return null; events.push(...next); current = applyEvents(current, next); }
      return events;
    }
    case "anyOf": {
      for (const child of condition.conditions) { const next = eventsToSatisfy(state, child); if (next !== null) return next; }
      return null;
    }
  }
};

export const ALL_EVIDENCE_IDS = Array.from(new Set([
  ...Object.values(INSIGHT_SOLUTIONS).flat(), ...Object.values(FINDING_SOLUTIONS).flatMap((item) => item.evidence),
]));
export const ALL_TOKEN_IDS = Array.from(new Set(CASE_STATEMENTS.flatMap((statement) => statement.slots.map((slot) => slot.correctTokenId))));
