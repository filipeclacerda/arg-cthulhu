import { describe, expect, it } from "vitest";
import { isUnlocked, UnlockCondition } from "../data/filesystem";
import {
  createInitialProgress,
  puzzleCorruptionStage,
  PUZZLE_IDS,
} from "./progress";
import { FUTURE_SEQUENCE, reduceGameEvent } from "./puzzles";

const solveThroughFutureLog = () => {
  let state = createInitialProgress(1_700_000_000_000, "test-case");
  for (const puzzleId of PUZZLE_IDS.slice(0, 5)) {
    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId }).state;
  }
  for (const action of FUTURE_SEQUENCE) {
    state = reduceGameEvent(state, {
      type: "FUTURE_SEQUENCE_ACTION",
      action,
    }).state;
  }
  return state;
};

describe("ARG progression reducer", () => {
  it("derives corruption only from solved investigation milestones", () => {
    let state = createInitialProgress(1_700_000_000_000, "test-case");
    expect(puzzleCorruptionStage(state.puzzles)).toBe(0);

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "palimpsest",
    }).state;
    expect(puzzleCorruptionStage(state.puzzles)).toBe(1);

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "lineage",
    }).state;
    expect(puzzleCorruptionStage(state.puzzles)).toBe(2);
  });

  it("resets only the future-log sequence after a recognized wrong action", () => {
    let state = createInitialProgress(1_700_000_000_000, "test-case");
    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "lineage",
    }).state;
    state = reduceGameEvent(state, {
      type: "FUTURE_SEQUENCE_ACTION",
      action: FUTURE_SEQUENCE[0],
    }).state;

    const result = reduceGameEvent(state, {
      type: "FUTURE_SEQUENCE_ACTION",
      action: "file:the_name",
    });
    expect(result.sequenceFault).toBe(true);
    expect(result.state.futureSequenceStep).toBe(0);
    expect(result.state.futureSequenceFaults).toBe(1);
    expect(result.state.puzzles.lineage.solvedAt).not.toBeNull();
  });

  it("rejects INDEX /JOIN until all four object references were collected", () => {
    let state = solveThroughFutureLog();
    const premature = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "INDEX /JOIN E7-A1-C4-B9",
    });
    expect(premature.commandAccepted).toBeUndefined();
    expect(premature.state.puzzles.index_name.solvedAt).toBeNull();

    for (const reference of ["E7", "A1", "C4", "B9"]) {
      state = reduceGameEvent(state, {
        type: "COLLECT_REFERENCE",
        reference,
      }).state;
    }
    const accepted = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "  index   /join e7-a1-c4-b9 ",
    });
    expect(accepted.commandAccepted).toBe(true);
    expect(accepted.state.flags.endgame_available).toBe(true);
  });
});

describe("compound unlock conditions", () => {
  const condition: UnlockCondition = {
    type: "allOf",
    conditions: [
      { type: "puzzleSolved", puzzleId: "lot_114" },
      {
        type: "anyOf",
        conditions: [
          { type: "evidenceOpened", evidenceId: "miriam_1998" },
          { type: "flag", flag: "legacy_override" },
        ],
      },
    ],
  };

  it("supports nested allOf and anyOf gates", () => {
    expect(
      isUnlocked(condition, {
        flags: {},
        solvedPuzzleIds: ["lot_114"],
        discoveredEvidenceIds: ["miriam_1998"],
      })
    ).toBe(true);
    expect(
      isUnlocked(condition, {
        flags: {},
        solvedPuzzleIds: ["lot_114"],
        discoveredEvidenceIds: [],
      })
    ).toBe(false);
  });
});

