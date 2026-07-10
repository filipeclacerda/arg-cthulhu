import { describe, expect, it } from "vitest";
import { files, folders } from "../data/filesystem";
import { isUnlocked, UnlockCondition } from "./unlock";
import {
  createInitialProgress,
  currentChapter,
  investigationStage,
  progressChapterSnapshot,
  puzzleCorruptionStage,
  PUZZLE_IDS,
} from "./progress";
import {
  OBSERVER_CONCLUSION_LABELS,
  isObserverConclusionAvailable,
  pendingObserverConclusions,
} from "./campaign";
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

  it("derives investigation stages exclusively from the main puzzle chain", () => {
    let state = createInitialProgress(1_700_000_000_000, "chapters");
    const chapterOf = () => currentChapter(progressChapterSnapshot(state));

    expect(chapterOf()).toBe("chapter_1");
    expect(investigationStage(state.puzzles)).toBe(1);
    expect(
      isUnlocked(
        { type: "chapter", chapterId: "chapter_2" },
        { flags: state.flags, discoveredEvidenceIds: state.discoveredEvidenceIds, solvedPuzzleIds: [] }
      )
    ).toBe(false);
    expect(
      currentChapter({
        flags: state.flags,
        discoveredEvidenceIds: ["catalogue_lot_114", "miriam_1998", "lot_114_order"],
        solvedPuzzleIds: [],
      })
    ).toBe("chapter_1");

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "lot_114" }).state;
    expect(chapterOf()).toBe("chapter_2");

    // Casefile findings color the case but never advance the stage.
    state = reduceGameEvent(state, { type: "SUBMIT_CASE_ANSWER", questionId: "sarah_intent", slotSelections: { time: "time-six-thirty", intent: "intent-go-home" }, evidenceIds: ["chat_em_archive", "todo"] }).state;
    state = reduceGameEvent(state, { type: "SUBMIT_CASE_ANSWER", questionId: "locked_room_source", slotSelections: { place: "place-under-workstation", object: "object-pipe" }, evidenceIds: ["incident_report", "maintenance_record"] }).state;
    expect(state.flags.act1_recovered_partial).toBe(true);
    expect(chapterOf()).toBe("chapter_2");

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "palimpsest" }).state;
    expect(chapterOf()).toBe("chapter_3");

    // margin_cipher happens inside stage 3 — it does not create a new stage.
    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "margin_cipher" }).state;
    expect(chapterOf()).toBe("chapter_3");

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "counting_audio" }).state;
    expect(chapterOf()).toBe("chapter_4");

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "lineage" }).state;
    expect(chapterOf()).toBe("chapter_5");

    // future_log happens inside stage 5.
    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "future_log" }).state;
    expect(chapterOf()).toBe("chapter_5");

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "index_name" }).state;
    expect(chapterOf()).toBe("chapter_6");
    expect(investigationStage(state.puzzles)).toBe(6);
  });

  it("keeps lot_114 ahead of palimpsest in the stage derivation", () => {
    let state = createInitialProgress(1_700_000_000_000, "stage-order");
    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "palimpsest" }).state;
    // Without the first milestone the stage cannot move at all.
    expect(investigationStage(state.puzzles)).toBe(1);

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "lot_114" }).state;
    expect(investigationStage(state.puzzles)).toBe(3);
  });

  it("never skips a stage because of secondary flags", () => {
    let state = createInitialProgress(1_700_000_000_000, "stage-flags");
    for (const flag of [
      "act1_recovered_partial",
      "act1_reconstruction_complete",
      "sarah_email_arrived",
      "sarah_msn_live",
      "endgame_available",
    ]) {
      state = reduceGameEvent(state, { type: "SET_FLAG", flag }).state;
    }
    expect(currentChapter(progressChapterSnapshot(state))).toBe("chapter_1");
    expect(investigationStage(state.puzzles)).toBe(1);
  });

  it("reveals personal and mythos files in narrative layers", () => {
    let state = createInitialProgress(1_700_000_000_000, "layered-files");
    const fileUnlocked = (fileId: string) => {
      const file = files.find((candidate) => candidate.id === fileId);
      expect(file, `missing fixture ${fileId}`).toBeDefined();
      return isUnlocked(file!.unlock, {
        flags: state.flags,
        discoveredEvidenceIds: state.discoveredEvidenceIds,
        solvedPuzzleIds: PUZZLE_IDS.filter(
          (puzzleId) => Boolean(state.puzzles[puzzleId].solvedAt)
        ),
      });
    };

    expect(fileUnlocked("photo_sarah_em_coast")).toBe(false);
    expect(fileUnlocked("miriam_notebook_scan")).toBe(false);
    expect(fileUnlocked("directory_comparison")).toBe(false);
    expect(fileUnlocked("office_1998_overlay")).toBe(false);
    expect(fileUnlocked("silent_call")).toBe(false);
    expect(fileUnlocked("observer_outbox")).toBe(false);

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "lot_114",
    }).state;
    expect(fileUnlocked("photo_sarah_em_coast")).toBe(true);
    expect(fileUnlocked("miriam_notebook_scan")).toBe(false);

    state = retainSarahFindings(state);
    expect(fileUnlocked("miriam_notebook_scan")).toBe(true);

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "margin_cipher",
    }).state;
    expect(fileUnlocked("directory_comparison")).toBe(true);

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "counting_audio",
    }).state;
    expect(fileUnlocked("office_1998_overlay")).toBe(true);

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "lineage",
    }).state;
    expect(fileUnlocked("silent_call")).toBe(true);

    state = solveThroughFutureLog();
    expect(fileUnlocked("observer_outbox")).toBe(true);
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

    // The three observer conclusions alone open the final operation — no
    // act-one finding is technically required.
    state = retainObserverFindings(state);
    expect(state.caseAnswers.sarah_intent?.solvedAt ?? null).toBeNull();
    expect(state.caseAnswers.volume_return?.solvedAt ?? null).toBeNull();
    expect(state.caseAnswers.locked_room_source?.solvedAt ?? null).toBeNull();
    const accepted = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "  index   /join e7-a1-c4-b9 ",
    });
    expect(accepted.commandAccepted).toBe(true);
    expect(accepted.state.flags.endgame_available).toBe(true);
  });

  it("names the pending observer conclusion when the index refuses", () => {
    let state = solveThroughFutureLog();
    for (const reference of ["E7", "A1", "C4", "B9"]) {
      state = reduceGameEvent(state, {
        type: "COLLECT_REFERENCE",
        reference,
      }).state;
    }
    expect(pendingObserverConclusions(state)).toEqual([
      "future_displacement",
      "relay_observer",
      "chapter_ritual",
    ]);

    state = reduceGameEvent(state, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "future_displacement",
      slotSelections: { status: "status-tomorrow", time: "time-one-day" },
      evidenceIds: ["sarah_live_email", "future_access_log"],
    }).state;
    state = reduceGameEvent(state, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "relay_observer",
      slotSelections: {
        person: "person-observer",
        object: "object-archive-field",
      },
      evidenceIds: ["tom_last_message", "index_help"],
    }).state;

    const refused = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "INDEX /JOIN E7-A1-C4-B9",
    });
    expect(refused.commandError).toBe("case_incomplete");
    const pending = pendingObserverConclusions(refused.state);
    expect(pending).toEqual(["chapter_ritual"]);
    // The refusal copy can name the pendency in both locales.
    for (const id of pending) {
      expect(OBSERVER_CONCLUSION_LABELS[id].en.trim().length).toBeGreaterThan(0);
      expect(
        OBSERVER_CONCLUSION_LABELS[id]["pt-BR"].trim().length
      ).toBeGreaterThan(0);
    }
    expect(OBSERVER_CONCLUSION_LABELS.chapter_ritual.en).toContain(
      "Chapter Seven"
    );
    expect(OBSERVER_CONCLUSION_LABELS.chapter_ritual["pt-BR"]).toContain(
      "Capítulo Sete"
    );
  });

  it("surfaces each observer conclusion at its own milestone", () => {
    let state = createInitialProgress(1_700_000_000_000, "conclusion-gates");
    const available = () =>
      (["future_displacement", "relay_observer", "chapter_ritual"] as const).filter(
        (id) => isObserverConclusionAvailable(state, id)
      );

    expect(available()).toEqual([]);

    for (const puzzleId of PUZZLE_IDS.slice(0, 5)) {
      state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId }).state;
    }
    expect(available()).toEqual(["future_displacement"]);

    for (const action of FUTURE_SEQUENCE) {
      state = reduceGameEvent(state, {
        type: "FUTURE_SEQUENCE_ACTION",
        action,
      }).state;
    }
    expect(available()).toEqual(["future_displacement", "relay_observer"]);

    state = reduceGameEvent(state, {
      type: "DISCOVER_EVIDENCE",
      evidenceId: "the_name",
      resourceId: "the_name",
    }).state;
    expect(available()).toEqual([
      "future_displacement",
      "relay_observer",
      "chapter_ritual",
    ]);
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

  it("rewards two corroborated act-one findings without opening RECOVERED", () => {
    let state = createInitialProgress(1_700_000_000_000, "reconstruction");
    const recoveredFolder = folders.find((folder) => folder.id === "restricted");
    const recoveredUnlocked = () =>
      isUnlocked(recoveredFolder!.unlock, {
        flags: state.flags,
        discoveredEvidenceIds: state.discoveredEvidenceIds,
        solvedPuzzleIds: PUZZLE_IDS.filter((puzzleId) =>
          Boolean(state.puzzles[puzzleId].solvedAt)
        ),
      });

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
    state = second.state;
    expect(second.caseAnswerResult?.accepted).toBe(true);
    expect(state.flags.act1_recovered_partial).toBe(true);
    expect(state.leadsUnlocked).toContain("manuscript");

    // The findings reward is optional context; the recovered directory and
    // the investigation stage still answer only to the first puzzle.
    expect(recoveredUnlocked()).toBe(false);
    expect(currentChapter(progressChapterSnapshot(state))).toBe("chapter_1");

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "lot_114",
    }).state;
    expect(recoveredUnlocked()).toBe(true);
  });

  it("withholds MIRIAM_DRAFT.PRN until three findings AND lot_114 are in", () => {
    let state = createInitialProgress(1_700_000_000_000, "tier-two-reward");
    const answers = [
      {
        questionId: "sarah_intent" as const,
        slotSelections: {
          time: "time-six-thirty",
          intent: "intent-go-home",
        } as Record<string, string>,
        evidenceIds: ["chat_em_archive", "todo"],
      },
      {
        questionId: "volume_return" as const,
        slotSelections: {
          cause: "cause-deliberately-sent",
          family: "family-bishop",
        } as Record<string, string>,
        evidenceIds: ["miriam_1998", "lot_114_order"],
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
    for (const answer of answers) {
      state = reduceGameEvent(state, {
        type: "SUBMIT_CASE_ANSWER",
        ...answer,
      }).state;
    }
    // Three retained findings alone do not print the draft.
    expect(state.flags.act1_reconstruction_complete).toBeUndefined();
    expect(state.flags.miriam_draft_arrived).toBeUndefined();
    expect(state.worldReactionsSeen).not.toContain("printer_wake");

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "lot_114",
    }).state;
    expect(state.flags.act1_reconstruction_complete).toBe(true);
    expect(state.flags.miriam_draft_arrived).toBe(true);
    expect(state.worldReactionsSeen).toContain("printer_wake");
    expect(state.leadsUnlocked).toEqual(
      expect.arrayContaining(["historical", "acoustic"])
    );
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
    const immutableRestore = reduceGameEvent(restore, {
      type: "CHOOSE_ENDING",
      ending: "shutdown",
    }).state;
    expect(immutableRestore.ending).toBe("restore");
    expect(immutableRestore.flags.ending_shutdown).not.toBe(true);

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

  it("stages incomplete restore only after all optional work and the note are retained", () => {
    let state = createInitialProgress(1_700_000_000_000, "incomplete-restore");
    const rejected = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "INDEX /RESTORE /INCOMPLETE",
    });
    expect(rejected.commandAccepted).not.toBe(true);

    for (const flag of [
      "directory_gap_solved",
      "three_times_solved",
      "silent_call_solved",
    ]) {
      state = reduceGameEvent(state, { type: "SET_FLAG", flag }).state;
    }
    state = reduceGameEvent(state, {
      type: "MARK_FILE_READ",
      fileId: "counter_index_note",
    }).state;
    const accepted = reduceGameEvent(state, {
      type: "RUN_COMMAND",
      command: "index   /restore   /incomplete",
    });
    expect(accepted.commandAccepted).toBe(true);
    expect(accepted.state.flags.incomplete_restore_prepared).toBe(true);
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

describe("live contact record", () => {
  it("moves unseen -> active -> closed alongside the messenger choices", () => {
    let state = createInitialProgress(1_700_000_000_000, "live-contact");
    expect(state.liveContact).toEqual({ status: "unseen", activeMs: 0 });

    state = reduceGameEvent(state, {
      type: "RECORD_CHOICE",
      choiceId: "sarah_live_seen",
      optionId: "opened",
    }).state;
    expect(state.liveContact.status).toBe("active");

    state = reduceGameEvent(state, {
      type: "RECORD_CHOICE",
      choiceId: "sarah_live_question",
      optionId: "break",
    }).state;
    expect(state.liveContact).toEqual({ status: "closed", activeMs: 120000 });
  });

  it("closes the record when the window expires unanswered", () => {
    let state = createInitialProgress(1_700_000_000_000, "live-contact-missed");
    state = reduceGameEvent(state, {
      type: "RECORD_CHOICE",
      choiceId: "sarah_live_seen",
      optionId: "opened",
    }).state;
    state = reduceGameEvent(state, {
      type: "RECORD_CHOICE",
      choiceId: "sarah_live_question",
      optionId: "missed",
    }).state;
    expect(state.liveContact).toEqual({ status: "closed", activeMs: 120000 });
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
