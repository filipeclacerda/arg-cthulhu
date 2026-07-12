import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  caseFindingAvailableFlag,
  caseFindingState,
  puzzleCasefileGate,
  puzzleProgressGate,
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
    state.puzzles.lot_114.solvedAt = 1;
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

  it("never lets an imported callback skip an earlier main recovery", () => {
    const state = createInitialProgress(1_700_000_000_000, "ordered-chain");
    const gate = puzzleProgressGate(state, "counting_audio");

    expect(gate).toEqual({
      allowed: false,
      reason: "previous_puzzle_required",
      previousPuzzleId: "margin_cipher",
    });

    const blocked = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "counting_audio",
    });
    expect(blocked.puzzleBlocked).toEqual({
      puzzleId: "counting_audio",
      reason: "previous_puzzle_required",
      previousPuzzleId: "margin_cipher",
    });
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
