import { describe, expect, it } from "vitest";
import { isUnlocked, UnlockCondition } from "../data/filesystem";
import {
  createInitialProgress,
  currentChapter,
  progressChapterSnapshot,
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

const retainObserverFindings = (
  state: ReturnType<typeof createInitialProgress>
) => {
  const answers = [
    {
      questionId: "future_displacement" as const,
      slotSelections: {
        status: "status-tomorrow",
        time: "time-one-day",
      } as Record<string, string>,
      evidenceIds: ["sarah_live_email", "future_access_log"],
    },
    {
      questionId: "relay_observer" as const,
      slotSelections: {
        person: "person-observer",
        object: "object-archive-field",
      } as Record<string, string>,
      evidenceIds: ["tom_last_message", "index_help"],
    },
    {
      questionId: "chapter_ritual" as const,
      slotSelections: {
        cause: "cause-act-of-reconstruction",
        person: "person-observer",
      } as Record<string, string>,
      evidenceIds: ["the_name", "margin_ciphertext"],
    },
  ];
  return answers.reduce(
    (current, answer) =>
      reduceGameEvent(current, {
        type: "SUBMIT_CASE_ANSWER",
        ...answer,
      }).state,
    state
  );
};

const retainSarahFindings = (
  state: ReturnType<typeof createInitialProgress>
) => {
  const answers = [
    {
      questionId: "sarah_intent" as const,
      slotSelections: {
        time: "time-six-thirty",
        intent: "intent-go-home",
      } as Record<string, string>,
      evidenceIds: ["lecture_draft", "dad_email"],
    },
    {
      questionId: "locked_room_source" as const,
      slotSelections: {
        place: "place-under-workstation",
        object: "object-pipe",
      } as Record<string, string>,
      evidenceIds: ["incident_report", "maintenance_record"],
    },
  ];
  return answers.reduce(
    (current, answer) =>
      reduceGameEvent(current, {
        type: "SUBMIT_CASE_ANSWER",
        ...answer,
      }).state,
    state
  );
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

  it("derives soft-gated chapters from existing progress", () => {
    let state = createInitialProgress(1_700_000_000_000, "chapters");
    const chapterOf = () => currentChapter(progressChapterSnapshot(state));

    expect(chapterOf()).toBe("chapter_1");
    expect(
      isUnlocked(
        { type: "chapter", chapterId: "chapter_2" },
        { flags: state.flags, discoveredEvidenceIds: state.discoveredEvidenceIds, solvedPuzzleIds: [] }
      )
    ).toBe(false);

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "lot_114" }).state;
    expect(chapterOf()).toBe("chapter_2");

    state = reduceGameEvent(state, { type: "SUBMIT_CASE_ANSWER", questionId: "sarah_intent", slotSelections: { time: "time-six-thirty", intent: "intent-go-home" }, evidenceIds: ["chat_em_archive", "todo"] }).state;
    state = reduceGameEvent(state, { type: "SUBMIT_CASE_ANSWER", questionId: "locked_room_source", slotSelections: { place: "place-under-workstation", object: "object-pipe" }, evidenceIds: ["incident_report", "maintenance_record"] }).state;
    expect(chapterOf()).toBe("chapter_3");

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "counting_audio" }).state;
    expect(chapterOf()).toBe("chapter_4");

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "lineage" }).state;
    expect(chapterOf()).toBe("chapter_5");

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "index_name" }).state;
    expect(chapterOf()).toBe("chapter_6");
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

  it("ignores future-log sequence actions before lineage is solved", () => {
    const initial = createInitialProgress(1_700_000_000_000, "legacy-order");
    const result = reduceGameEvent(initial, {
      type: "FUTURE_SEQUENCE_ACTION",
      action: FUTURE_SEQUENCE[0],
    });
    expect(result.sequenceFault).toBeUndefined();
    expect(result.state.futureSequenceStep).toBe(0);
    expect(result.state.puzzles.future_log.solvedAt).toBeNull();
    expect(result.state).toBe(initial);
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
    const withoutFindings = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "INDEX /JOIN E7-A1-C4-B9",
    });
    expect(withoutFindings.commandError).toBe("case_incomplete");

    state = retainSarahFindings(retainObserverFindings(state));
    const accepted = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "  index   /join e7-a1-c4-b9 ",
    });
    expect(accepted.commandAccepted).toBe(true);
    expect(accepted.state.flags.endgame_available).toBe(true);
  });

  it("normalizes command syntax while preserving required puzzle gates", () => {
    let state = solveThroughFutureLog();
    state = retainSarahFindings(retainObserverFindings(state));
    state = ["E7", "A1", "C4", "B9"].reduce(
      (acc, reference) => reduceGameEvent(acc, { type: "COLLECT_REFERENCE", reference }).state,
      state
    );
    const accepted = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "  InDeX   /jOiN   e7 - a1 - c4 - b9 ",
    });
    expect(accepted.commandAccepted).toBe(true);
    expect(accepted.state.puzzles.index_name.solvedAt).not.toBeNull();
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

  it("sets solved flags used by desktop progression notices", () => {
    let state = createInitialProgress(1_700_000_000_000, "notice-flags");
    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "palimpsest",
    }).state;
    expect(state.flags.puzzle_palimpsest_solved).toBe(true);

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "margin_cipher",
    }).state;
    expect(state.flags.puzzle_margin_cipher_solved).toBe(true);
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

  it("unlocks the recovered folder after two corroborated act-one findings", () => {
    let state = createInitialProgress(1_700_000_000_000, "reconstruction");
    state = reduceGameEvent(state, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "sarah_intent",
      slotSelections: {
        time: "time-six-thirty",
        intent: "intent-go-home",
      },
      evidenceIds: ["chat_em_archive", "todo"],
    }).state;
    expect(state.flags.act1_recovered_partial).toBeUndefined();

    const second = reduceGameEvent(state, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "volume_return",
      slotSelections: {
        cause: "cause-deliberately-sent",
        family: "family-bishop",
      },
      evidenceIds: ["miriam_1998", "lot_114_order"],
    });
    expect(second.caseAnswerResult?.accepted).toBe(true);
    expect(second.state.flags.act1_recovered_partial).toBe(true);
    expect(second.state.leadsUnlocked).toContain("manuscript");
  });

  it("rejects a plausible conclusion without corroborating evidence", () => {
    const initial = createInitialProgress(1_700_000_000_000, "weak-case");
    const result = reduceGameEvent(initial, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "sarah_intent",
      slotSelections: {
        time: "time-six-thirty",
        intent: "intent-go-home",
      },
      evidenceIds: ["todo"],
    });
    expect(result.caseAnswerResult).toMatchObject({
      accepted: false,
      reason: "not_enough_evidence",
    });
    expect(result.state.caseAnswers.sarah_intent?.solvedAt).toBeNull();
  });

  it("keeps correct statement slots and clears wrong ones between attempts", () => {
    const initial = createInitialProgress(1_700_000_000_000, "partial-case");
    const result = reduceGameEvent(initial, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "volume_return",
      slotSelections: {
        cause: "cause-deliberately-sent",
        family: "family-whateley",
      },
      evidenceIds: ["miriam_1998", "lot_114_order"],
    });

    expect(result.caseAnswerResult?.reason).toBe("partial_lock");
    expect(result.state.caseAnswers.volume_return).toMatchObject({
      slots: { cause: "cause-deliberately-sent" },
      lockedSlots: ["cause"],
      nearMisses: { statement_slot: 1 },
      solvedAt: null,
    });
  });

  it("collects clue tokens idempotently", () => {
    const initial = createInitialProgress(1_700_000_000_000, "tokens");
    const first = reduceGameEvent(initial, {
      type: "COLLECT_TOKEN",
      tokenId: "time-six-thirty",
    }).state;
    const duplicate = reduceGameEvent(first, {
      type: "COLLECT_TOKEN",
      tokenId: "time-six-thirty",
    }).state;

    expect(first.collectedTokens).toEqual(["time-six-thirty"]);
    expect(duplicate).toBe(first);
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

  it("requires all six correlations before enabling relay containment", () => {
    let state = retainSarahFindings(retainObserverFindings(solveThroughFutureLog()));
    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "index_name",
    }).state;
    const theorySets = [
      ["miriam_1998", "diary", "lot_114_order"],
      ["person-miriam", "person-sarah", "lineage_pattern"],
      ["person-sarah", "person-tom", "future_access_log"],
      ["incident_report", "maintenance_record", "whitfield_memo"],
      ["miriam_1998", "miriam_letter_1998", "miriam_notebook"],
      ["future_access_log", "index_help", "record_2014"],
    ];
    for (const evidenceIds of theorySets) {
      state = reduceGameEvent(state, {
        type: "TEST_THEORY",
        evidenceIds,
      }).state;
    }
    expect(state.insightsUnlocked).toHaveLength(6);
    const result = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "INDEX /SEAL RELAY-07 /WITNESS ARCHIVE",
    });
    expect(result.commandAccepted).toBe(true);
    expect(result.state.flags.secret_ending_available).toBe(true);
  });

  it("supports the expanded ending set without regressing the original endings", () => {
    let state = retainSarahFindings(retainObserverFindings(solveThroughFutureLog()));
    state = ["E7", "A1", "C4", "B9"].reduce(
      (acc, reference) =>
        reduceGameEvent(acc, { type: "COLLECT_REFERENCE", reference }).state,
      state
    );
    state = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "INDEX /JOIN E7-A1-C4-B9",
    }).state;

    const restore = reduceGameEvent(state, {
      type: "CHOOSE_ENDING",
      ending: "restore",
    }).state;
    expect(restore.ending).toBe("restore");
    expect(restore.flags.ending_restore).toBe(true);

    const shutdown = reduceGameEvent(state, {
      type: "CHOOSE_ENDING",
      ending: "shutdown",
    }).state;
    expect(shutdown.ending).toBe("shutdown");
    expect(shutdown.flags.ending_shutdown).toBe(true);

    const leaveBlank = reduceGameEvent(state, {
      type: "CHOOSE_ENDING",
      ending: "leave_blank",
    }).state;
    expect(leaveBlank.ending).toBe("leave_blank");
    expect(leaveBlank.flags.ending_leave_blank).toBe(true);
    expect(leaveBlank.narrativeBeatsSeen).toContain("blank_left");
  });

  it("gates archive yourself behind secret containment, hash manifest and Sarah's break answer", () => {
    let state = retainSarahFindings(retainObserverFindings(solveThroughFutureLog()));
    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "index_name",
    }).state;
    const theorySets = [
      ["miriam_1998", "diary", "lot_114_order"],
      ["person-miriam", "person-sarah", "lineage_pattern"],
      ["person-sarah", "person-tom", "future_access_log"],
      ["incident_report", "maintenance_record", "whitfield_memo"],
      ["miriam_1998", "miriam_letter_1998", "miriam_notebook"],
      ["future_access_log", "index_help", "record_2014"],
    ];
    for (const evidenceIds of theorySets) {
      state = reduceGameEvent(state, {
        type: "TEST_THEORY",
        evidenceIds,
      }).state;
    }
    state = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "INDEX /SEAL RELAY-07 /WITNESS ARCHIVE",
    }).state;

    const missingManifest = reduceGameEvent(state, {
      type: "CHOOSE_ENDING",
      ending: "archive_self",
    }).state;
    expect(missingManifest).toBe(state);

    state = reduceGameEvent(state, {
      type: "DISCOVER_EVIDENCE",
      evidenceId: "hash_manifest",
      resourceId: "hash_manifest",
    }).state;
    const missingBreak = reduceGameEvent(state, {
      type: "CHOOSE_ENDING",
      ending: "archive_self",
    }).state;
    expect(missingBreak).toBe(state);

    state = reduceGameEvent(state, {
      type: "RECORD_CHOICE",
      choiceId: "sarah_live_question",
      optionId: "break",
    }).state;
    const accepted = reduceGameEvent(state, {
      type: "CHOOSE_ENDING",
      ending: "archive_self",
    }).state;
    expect(accepted.ending).toBe("archive_self");
    expect(accepted.flags.ending_archive_self).toBe(true);
    expect(accepted.worldReactionsSeen).toContain("observer_filed");
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
