import { describe, expect, it } from "vitest";
import { DIEGETIC_EVENTS, diegeticContext, pendingDiegeticEvents } from "./diegeticEvents";
import { applyEvents, buildStageState, eventsForPreset, eventsToSatisfy, eventsToSolvePuzzle, STAGE_PRESETS, suppressPendingEvents } from "./devPresets";
import { createInitialProgress, investigationStage, PUZZLE_IDS } from "./progress";
import { reduceGameEvent } from "./puzzles";
import { isUnlocked } from "./unlock";

describe("dev presets", () => {
  it.each([
    ["stage2_lot114", 2], ["stage3_palimpsest", 3], ["stage3b_margin_cipher", 3],
    ["stage4_counting_audio", 4], ["stage5_lineage", 5], ["stage6_future_log", 5], ["endgame_index", 6],
  ] as const)("builds %s at stage %i", (preset, expected) => {
    expect(investigationStage(buildStageState(preset, createInitialProgress()).puzzles)).toBe(expected);
  });

  it.each(STAGE_PRESETS)("replays %s without rejected gates or answers", (preset) => {
    let state = createInitialProgress();
    for (const event of eventsForPreset(preset)) {
      const result = reduceGameEvent(state, event); state = result.state;
      if (event.type === "SOLVE_PUZZLE") expect(result.puzzleBlocked).toBeUndefined();
      if (event.type === "SUBMIT_CASE_ANSWER") expect(result.caseAnswerResult?.accepted).toBe(true);
      if (event.type === "TEST_THEORY") expect(result.theoryResult?.insightId).not.toBeNull();
    }
  });

  it("solves the complete puzzle chain from an initial save", () => {
    let state = createInitialProgress();
    for (const puzzleId of PUZZLE_IDS) state = applyEvents(state, eventsToSolvePuzzle(state, puzzleId));
    expect(PUZZLE_IDS.every((id) => Boolean(state.puzzles[id].solvedAt))).toBe(true);
    expect(state.flags.endgame_available).toBe(true);
  });

  it("quiet mode drains the endgame queue", () => {
    const state = suppressPendingEvents(buildStageState("endgame_index", createInitialProgress()));
    expect(pendingDiegeticEvents(diegeticContext(state))).toHaveLength(0);
    expect(state.flags.recall_0314_started && !state.flags.recall_0314_complete && !state.flags.recall_0314_skipped).toBeFalsy();
  });

  it("can satisfy every satisfiable event condition", () => {
    for (const definition of DIEGETIC_EVENTS) {
      const initial = createInitialProgress(); const events = eventsToSatisfy(initial, definition.when);
      if (events === null) continue;
      const state = applyEvents(initial, events);
      expect(isUnlocked(definition.when, { ...diegeticContext(state), readFileIds: state.readFileIds }), definition.id).toBe(true);
    }
  });

  it("can choose restore from the armed endgame", () => {
    const state = applyEvents(buildStageState("endgame_index", createInitialProgress()), [{ type: "CHOOSE_ENDING", ending: "restore" }]);
    expect(state.ending).toBe("restore");
  });
});
