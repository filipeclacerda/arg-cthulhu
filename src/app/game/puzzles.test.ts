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

  it("does not create revisions for duplicate evidence events", () => {
    const initial = createInitialProgress(1_700_000_000_000, "test-case");
    const discovered = reduceGameEvent(initial, {
      type: "DISCOVER_EVIDENCE",
      evidenceId: "lot_114_scan",
      resourceId: "lot_114_scan",
    }).state;
    const duplicate = reduceGameEvent(discovered, {
      type: "DISCOVER_EVIDENCE",
      evidenceId: "lot_114_scan",
      resourceId: "lot_114_scan",
    }).state;

    expect(duplicate).toBe(discovered);
    expect(duplicate.revision).toBe(discovered.revision);
  });

  it("does not touch state for already solved puzzles or invalid commands", () => {
    const initial = createInitialProgress(1_700_000_000_000, "test-case");
    const solved = reduceGameEvent(initial, {
      type: "SOLVE_PUZZLE",
      puzzleId: "lot_114",
    }).state;

    expect(
      reduceGameEvent(solved, {
        type: "SOLVE_PUZZLE",
        puzzleId: "lot_114",
      }).state
    ).toBe(solved);
    expect(
      reduceGameEvent(solved, {
        type: "RUN_COMMAND",
        command: "NOT A VALID COMMAND",
      }).state
    ).toBe(solved);
  });

  it("resets custom evidence-board positions without removing connections", () => {
    let state = createInitialProgress(1_700_000_000_000, "test-case");
    state = reduceGameEvent(state, {
      type: "MOVE_BOARD_CARD",
      cardId: "person-sarah",
      x: 120,
      y: 80,
    }).state;
    state = reduceGameEvent(state, {
      type: "TOGGLE_BOARD_CONNECTION",
      fromId: "person-sarah",
      toId: "diary",
    }).state;

    const reset = reduceGameEvent(state, { type: "RESET_BOARD_LAYOUT" }).state;
    expect(reset.boardPositions).toEqual({});
    expect(reset.boardConnections).toEqual(["diary|person-sarah"]);
  });

  it("unlocks adaptive hints after repeated meaningful near misses", () => {
    let state = createInitialProgress(1_700_000_000_000, "near-miss");
    state = reduceGameEvent(state, {
      type: "RECORD_NEAR_MISS",
      puzzleId: "lot_114",
      kind: "catalog_partial",
    }).state;
    expect(state.puzzles.lot_114.hintsUnlocked).toBe(0);

    const result = reduceGameEvent(state, {
      type: "RECORD_NEAR_MISS",
      puzzleId: "lot_114",
      kind: "catalog_partial",
    });
    expect(result.state.puzzles.lot_114.hintsUnlocked).toBe(1);
    expect(result.hintUnlocked?.trigger).toBe("near_miss");
  });

  it("records optional theories without gating puzzle progression", () => {
    const initial = createInitialProgress(1_700_000_000_000, "theory");
    const result = reduceGameEvent(initial, {
      type: "TEST_THEORY",
      evidenceIds: ["lot_114_order", "diary", "miriam_1998"],
    });

    expect(result.theoryResult?.insightId).toBe("second_volume");
    expect(result.state.insightsUnlocked).toContain("second_volume");
    expect(result.state.puzzles.lot_114.solvedAt).toBeNull();
  });

  it("pins a confirmed thread between every card behind a validated theory", () => {
    const initial = createInitialProgress(1_700_000_000_000, "theory-thread");
    const result = reduceGameEvent(initial, {
      type: "TEST_THEORY",
      evidenceIds: ["lot_114_order", "diary", "miriam_1998"],
    });

    expect(result.state.confirmedConnections).toEqual(
      expect.arrayContaining([
        "diary|lot_114_order",
        "diary|miriam_1998",
        "lot_114_order|miriam_1998",
      ])
    );

    const unmatched = reduceGameEvent(result.state, {
      type: "TEST_THEORY",
      evidenceIds: ["person-sarah", "person-tom"],
    });
    expect(unmatched.theoryResult?.insightId).toBeNull();
    expect(unmatched.state.confirmedConnections).toBe(
      result.state.confirmedConnections
    );
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
