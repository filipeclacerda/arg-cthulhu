import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  caseFindingAvailableFlag,
  caseFindingState,
  puzzleCasefileGate,
  syncCaseFindingAvailability,
} from "./investigativeProgression";
import { reduceGameEvent } from "./puzzles";

describe("investigative progression gates", () => {
  it("moves a finding from hidden to available to retained", () => {
    let state = createInitialProgress(1_700_000_000_000, "finding-state");
    expect(caseFindingState(state, "sarah_intent")).toBe("hidden");

    state.discoveredEvidenceIds = ["chat_em_archive", "todo"];
    state = syncCaseFindingAvailability(state);
    expect(caseFindingState(state, "sarah_intent")).toBe("available");
    expect(state.flags[caseFindingAvailableFlag("sarah_intent")]).toBe(true);

    state = reduceGameEvent(state, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "sarah_intent",
      slotSelections: { time: "time-six-thirty", intent: "intent-go-home" },
      evidenceIds: ["chat_em_archive", "todo"],
    }).state;
    expect(caseFindingState(state, "sarah_intent")).toBe("retained");
  });

  it("rejects direct puzzle completion until the Casefile requirement holds", () => {
    let state = createInitialProgress(1_700_000_000_000, "puzzle-gate");
    const blocked = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "palimpsest",
    });
    expect(blocked.puzzleBlocked).toEqual({
      puzzleId: "palimpsest",
      reason: "casefile_required",
      insightId: "second_volume",
    });
    expect(blocked.state.puzzles.palimpsest.solvedAt).toBeNull();

    state.insightsUnlocked.push("second_volume");
    expect(puzzleCasefileGate(state, "palimpsest").allowed).toBe(true);
    const accepted = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "palimpsest",
    });
    expect(accepted.solvedPuzzle).toBe("palimpsest");
  });

  it("persists announced and viewed findings independently", () => {
    let state = createInitialProgress(1_700_000_000_000, "finding-notices");
    state = reduceGameEvent(state, {
      type: "MARK_CASE_FINDING_ANNOUNCED",
      findingId: "sarah_intent",
    }).state;
    expect(state.announcedCaseFindingIds).toEqual(["sarah_intent"]);
    expect(state.viewedCaseFindingIds).toEqual([]);
    state = reduceGameEvent(state, {
      type: "MARK_CASE_FINDING_VIEWED",
      findingId: "sarah_intent",
    }).state;
    expect(state.viewedCaseFindingIds).toEqual(["sarah_intent"]);
  });
});
