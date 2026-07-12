import { describe, expect, it } from "vitest";
import { createInitialProgress, PUZZLE_IDS } from "./progress";
import { reduceGameEvent } from "./puzzles";
import {
  completedOptionalMissionCount,
  OPTIONAL_MISSIONS,
  optionalMissionCodaLines,
} from "./optionalMissions";

const satisfyGate = (
  state: ReturnType<typeof createInitialProgress>,
  puzzleId: (typeof PUZZLE_IDS)[number]
) => {
  if (puzzleId === "palimpsest") state.insightsUnlocked = ["second_volume"];
  const findingByPuzzle = {
    counting_audio: "volume_return",
    lineage: "lineage_ledger",
    future_log: "future_displacement",
    index_name: "chapter_ritual",
  } as const;
  const findingId = findingByPuzzle[puzzleId as keyof typeof findingByPuzzle];
  if (findingId) {
    state.caseAnswers[findingId] = {
      slots: {}, lockedSlots: [], evidenceIds: [], attempts: 1, nearMisses: {}, solvedAt: Date.now(),
    };
  }
  return state;
};

const solveThrough = (lastPuzzle: (typeof PUZZLE_IDS)[number]) => {
  let state = createInitialProgress(1_700_000_000_000, `mission-${lastPuzzle}`);
  for (const puzzleId of PUZZLE_IDS) {
    state = satisfyGate(state, puzzleId);
    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId }).state;
    if (puzzleId === lastPuzzle) break;
  }
  return state;
};

const discover = (
  state: ReturnType<typeof createInitialProgress>,
  evidenceId: string
) =>
  reduceGameEvent(state, {
    type: "DISCOVER_EVIDENCE",
    evidenceId,
    resourceId: evidenceId,
  }).state;

describe("optional micro-mission registry", () => {
  it("registers the three additive stories without adding main puzzles", () => {
    expect(OPTIONAL_MISSIONS.map((mission) => mission.id)).toEqual([
      "two_days_out",
      "tom_held_block",
      "eleanor_record",
    ]);
    expect(PUZZLE_IDS).toHaveLength(7);
  });

  it("completes Sarah's story only after the final return receipt is opened", () => {
    let state = solveThrough("lot_114");
    const premature = reduceGameEvent(state, {
      type: "COMPLETE_OPTIONAL_MISSION",
      missionId: "two_days_out",
    });
    expect(premature.state).toBe(state);

    state = discover(state, "graymoor_return_receipt");
    const completed = reduceGameEvent(state, {
      type: "COMPLETE_OPTIONAL_MISSION",
      missionId: "two_days_out",
    }).state;
    expect(completed.optionalDiscoveries).toContain("two_days_out");
    expect(completed.worldReactionsSeen).toContain("unindexed_interval");
    expect(completed.puzzles.palimpsest.solvedAt).toBeNull();

    const replayed = reduceGameEvent(completed, {
      type: "COMPLETE_OPTIONAL_MISSION",
      missionId: "two_days_out",
    }).state;
    expect(replayed).toBe(completed);
    expect(
      replayed.worldReactionsSeen.filter((id) => id === "unindexed_interval")
    ).toHaveLength(1);
  });

  it("accepts Tom's VERIFY command only with both recovered fragments", () => {
    let state = solveThrough("lineage");
    const early = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "VERIFY SB-0316 /HOLD 04",
    });
    expect(early.commandError).toBe("hold_unavailable");
    expect(early.state).toBe(state);

    state = discover(state, "tom_hold_fragment");
    state = discover(state, "hash_manifest");
    const accepted = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: " verify   sb-0316   /hold 04 ",
    });
    expect(accepted.commandAccepted).toBe(true);
    expect(accepted.state.optionalDiscoveries).toContain("tom_held_block");
    expect(accepted.state.worldReactionsSeen).toContain("tom_hold_seek");
    expect(accepted.state.puzzles.future_log.solvedAt).toBeNull();
  });

  it("keeps Eleanor unresolved until the browser reconciliation is retained", () => {
    let state = solveThrough("future_log");
    state = discover(state, "victim_2014");
    state = discover(state, "record_2014");
    const premature = reduceGameEvent(state, {
      type: "COMPLETE_OPTIONAL_MISSION",
      missionId: "eleanor_record",
    });
    expect(premature.state).toBe(state);

    state = discover(state, "eleanor_reconciliation");
    const completed = reduceGameEvent(state, {
      type: "COMPLETE_OPTIONAL_MISSION",
      missionId: "eleanor_record",
    }).state;
    expect(completed.optionalDiscoveries).toContain("eleanor_record");
    expect(completed.worldReactionsSeen).toContain(
      "eleanor_owner_reconciled"
    );
    expect(completed.ending).toBeNull();
  });

  it("counts and localizes only the three mission codas", () => {
    const discoveries = [
      "dad_recipe",
      "two_days_out",
      "tom_held_block",
      "eleanor_record",
    ] as const;
    expect(completedOptionalMissionCount([...discoveries])).toBe(3);
    expect(optionalMissionCodaLines([...discoveries], "en")).toHaveLength(3);
    expect(optionalMissionCodaLines([...discoveries], "pt-BR")[2]).toContain(
      "checksum"
    );
  });
});
