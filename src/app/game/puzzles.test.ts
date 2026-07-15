import { describe, expect, it } from "vitest";
import { files, folders } from "../data/filesystem";
import { isUnlocked, UnlockCondition } from "./unlock";
import {
  createInitialProgress,
  currentChapter,
  GameEvent,
  investigationStage,
  progressChapterSnapshot,
  puzzleCorruptionStage,
  PUZZLE_IDS,
} from "./progress";
import {
  CASE_STATEMENTS,
  OBSERVER_CONCLUSION_LABELS,
  evidenceIdsFromSlotSelections,
  isObserverConclusionAvailable,
  pendingObserverConclusions,
} from "./campaign";
import { FUTURE_SEQUENCE, reduceGameEvent } from "./puzzles";
import { theoryFor } from "./theories";

const deductionEvent = (
  targetInsightId: Exclude<Parameters<typeof theoryFor>[0], "second_volume">,
  evidenceIds: string[],
  selectedClaimId = theoryFor(targetInsightId)!.correctClaimId
): GameEvent => ({
  type: "TEST_THEORY",
  targetInsightId,
  selectedClaimId,
  evidenceIds,
});

const satisfyGate = (
  state: ReturnType<typeof createInitialProgress>,
  puzzleId: (typeof PUZZLE_IDS)[number]
) => {
  // Unit fixtures often jump directly to a later narrative surface. Mirror
  // the recovered chain here so those fixtures remain valid under the same
  // reducer rule that protects production callbacks from skipping ahead.
  const puzzleIndex = PUZZLE_IDS.indexOf(puzzleId);
  PUZZLE_IDS.slice(0, puzzleIndex).forEach((previousPuzzleId) => {
    if (!state.puzzles[previousPuzzleId].solvedAt) {
      state.puzzles[previousPuzzleId].solvedAt = Date.now();
    }
  });
  if (puzzleId === "palimpsest" && !state.insightsUnlocked.includes("second_volume")) {
    state.insightsUnlocked.push("second_volume");
  }
  const findingByPuzzle = {
    counting_audio: "volume_return",
    lineage: "lineage_ledger",
    future_log: "future_displacement",
    index_name: "chapter_ritual",
  } as const;
  const findingId = findingByPuzzle[puzzleId as keyof typeof findingByPuzzle];
  if (findingId && !state.caseAnswers[findingId]?.solvedAt) {
    state.caseAnswers[findingId] = {
      slots: {}, lockedSlots: [], evidenceIds: [], attempts: 1, nearMisses: {}, solvedAt: Date.now(),
    };
  }
  return state;
};

const solveForTest = (
  state: ReturnType<typeof createInitialProgress>,
  puzzleId: (typeof PUZZLE_IDS)[number]
) => reduceGameEvent(satisfyGate(state, puzzleId), { type: "SOLVE_PUZZLE", puzzleId }).state;

const completedCase = () => {
  const state = createInitialProgress(1_700_000_000_000, "completed-case");
  state.ending = "shutdown";
  state.flags.ending_shutdown = true;
  return state;
};

const solveThroughFutureLog = () => {
  let state = createInitialProgress(1_700_000_000_000, "test-case");
  for (const puzzleId of PUZZLE_IDS.slice(0, 5)) {
    state = solveForTest(state, puzzleId);
  }
  state = satisfyGate(state, "future_log");
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

    state = solveForTest(state, "palimpsest");
    expect(puzzleCorruptionStage(state.puzzles)).toBe(1);

    state = solveForTest(state, "lineage");
    state = satisfyGate(state, "future_log");
    expect(puzzleCorruptionStage(state.puzzles)).toBe(2);
  });

  it("holds chapter 3 until the first correlation is retained", () => {
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
    expect(chapterOf()).toBe("chapter_2");

    state = reduceGameEvent(state, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "volume_return",
      slotSelections: {
        cause: "cause-deliberately-sent",
        family: "family-bishop",
      },
      evidenceIds: ["diary", "miriam_1998"],
    }).state;
    state = solveForTest(state, "palimpsest");
    expect(chapterOf()).toBe("chapter_3");

    // margin_cipher happens inside stage 3 — it does not create a new stage.
    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "margin_cipher" }).state;
    expect(chapterOf()).toBe("chapter_3");

    state = solveForTest(state, "counting_audio");
    expect(chapterOf()).toBe("chapter_4");

    state = solveForTest(state, "lineage");
    expect(chapterOf()).toBe("chapter_5");

    // future_log happens inside stage 5.
    state = solveForTest(state, "future_log");
    expect(chapterOf()).toBe("chapter_5");

    state = solveForTest(state, "index_name");
    expect(chapterOf()).toBe("chapter_6");
    expect(investigationStage(state.puzzles)).toBe(6);
  });

  it("keeps lot_114 ahead of palimpsest in the stage derivation", () => {
    let state = createInitialProgress(1_700_000_000_000, "stage-order");
    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "palimpsest" }).state;
    // Without the first milestone the stage cannot move at all.
    expect(investigationStage(state.puzzles)).toBe(1);

    state = reduceGameEvent(state, { type: "SOLVE_PUZZLE", puzzleId: "lot_114" }).state;
    state = solveForTest(state, "palimpsest");
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
    expect(fileUnlocked("counting_audio")).toBe(false);

    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "lot_114",
    }).state;
    expect(fileUnlocked("photo_sarah_em_coast")).toBe(true);
    expect(fileUnlocked("miriam_notebook_scan")).toBe(false);

    state = retainSarahFindings(state);
    expect(fileUnlocked("miriam_notebook_scan")).toBe(true);
    expect(fileUnlocked("counting_audio")).toBe(false);

    state = solveForTest(state, "margin_cipher");
    expect(fileUnlocked("directory_comparison")).toBe(true);
    expect(fileUnlocked("counting_audio")).toBe(true);

    state = solveForTest(state, "counting_audio");
    expect(fileUnlocked("office_1998_overlay")).toBe(true);

    state = solveForTest(state, "lineage");
    expect(fileUnlocked("silent_call")).toBe(true);

    state = solveThroughFutureLog();
    expect(fileUnlocked("observer_outbox")).toBe(true);
  });

  it("resets only the future-log sequence after a recognized wrong action", () => {
    let state = createInitialProgress(1_700_000_000_000, "test-case");
    state = solveForTest(state, "lineage");
    state = satisfyGate(state, "future_log");
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
    expect(state.caseAnswers.volume_return?.solvedAt ?? null).not.toBeNull();
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
      state = solveForTest(state, puzzleId);
    }
    expect(available()).toEqual(["future_displacement"]);

    state = satisfyGate(state, "future_log");
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
    state = solveForTest(state, "palimpsest");
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

  it("records the selected thesis without exposing which part of a failed deduction was wrong", () => {
    const initial = createInitialProgress(1_700_000_000_000, "theory");
    const partial = reduceGameEvent(
      initial,
      deductionEvent("miriam_break", ["miriam_1998", "miriam_letter_1998"])
    );
    expect(partial.theoryResult).toEqual({
      insightId: null,
      alreadyKnown: false,
    });
    expect(partial.state.theoryAttempts[0]).toMatchObject({
      targetInsightId: "miriam_break",
      selectedClaimId: "miriam_deliberate",
      insightId: null,
    });

    const result = reduceGameEvent(
      initial,
      deductionEvent("miriam_break", [
        "miriam_1998",
        "miriam_letter_1998",
        "miriam_notebook",
      ])
    );

    expect(result.theoryResult?.insightId).toBe("miriam_break");
    expect(result.state.insightsUnlocked).toContain("miriam_break");
    expect(result.state.puzzles.lot_114.solvedAt).toBeNull();
  });

  it("keeps deduction progress private after an incorrect thesis", () => {
    const initial = createInitialProgress(
      1_700_000_000_000,
      "private-theory-feedback"
    );
    const result = reduceGameEvent(
      initial,
      deductionEvent(
        "miriam_break",
        ["miriam_1998", "miriam_letter_1998", "miriam_notebook"],
        "miriam_corruption"
      )
    );

    expect(result.theoryResult).toEqual({
      insightId: null,
      alreadyKnown: false,
    });
  });

  it("solves every mandatory finding without manually attached evidence", () => {
    for (const statement of CASE_STATEMENTS) {
      const support = [
        ...(statement.evidence.allOf ?? []),
        ...(statement.evidence.anyOf ?? []),
      ];
      const initial = {
        ...createInitialProgress(
          1_700_000_000_000,
          `automatic-${statement.id}`
        ),
        discoveredEvidenceIds: support,
      };
      const slotSelections = Object.fromEntries(
        statement.slots.map((slot) => [slot.key, slot.correctTokenId])
      );
      const result = reduceGameEvent(initial, {
        type: "SUBMIT_CASE_ANSWER",
        questionId: statement.id,
        slotSelections,
        evidenceIds: [],
      });

      expect(result.caseAnswerResult, statement.id).toMatchObject({
        accepted: true,
        reason: "accepted",
      });
      expect(result.state.caseAnswers[statement.id]?.evidenceIds).toEqual(
        expect.arrayContaining(evidenceIdsFromSlotSelections(slotSelections))
      );
    }
  });

  it("retains the Volume II conclusion automatically with its reconstruction", () => {
    const initial = createInitialProgress(1_700_000_000_000, "volume-auto-insight");
    const result = reduceGameEvent(initial, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "volume_return",
      slotSelections: {
        cause: "cause-deliberately-sent",
        family: "family-bishop",
      },
      evidenceIds: ["miriam_1998", "diary"],
    });

    expect(result.caseAnswerResult?.accepted).toBe(true);
    expect(result.state.insightsUnlocked).toContain("second_volume");
    expect(result.state.flags.insight_second_volume).toBe(true);
  });

  it("persists only a contradiction the player actually selected", () => {
    const initial = createInitialProgress(
      1_700_000_000_000,
      "chosen-refutation"
    );
    const rejected = reduceGameEvent(initial, {
      type: "SET_HYPOTHESIS",
      hypothesisId: "tom_forged_image",
      status: "refuted",
      evidenceIds: ["tom_last_message", "incident_report"],
    });
    expect(rejected.hypothesisResult).toMatchObject({
      accepted: false,
      reason: "evidence_mismatch",
    });
    expect(rejected.state.hypotheses.tom_forged_image).toBeUndefined();

    const accepted = reduceGameEvent(initial, {
      type: "SET_HYPOTHESIS",
      hypothesisId: "tom_forged_image",
      status: "refuted",
      evidenceIds: ["future_access_log", "tom_last_message"],
    });
    expect(accepted.hypothesisResult).toMatchObject({
      accepted: true,
      verdict: "refuted",
    });
    expect(accepted.state.hypotheses.tom_forged_image).toMatchObject({
      status: "refuted",
      evidenceIds: ["future_access_log", "tom_last_message"],
    });
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

  it("rejects a plausible conclusion before corroborating evidence is discovered", () => {
    const initial = createInitialProgress(1_700_000_000_000, "weak-case");
    const result = reduceGameEvent(initial, {
      type: "SUBMIT_CASE_ANSWER",
      questionId: "sarah_intent",
      slotSelections: {
        time: "time-six-thirty",
        intent: "intent-go-home",
      },
      evidenceIds: [],
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
    const result = reduceGameEvent(
      initial,
      deductionEvent("miriam_break", [
        "miriam_1998",
        "miriam_letter_1998",
        "miriam_notebook",
      ])
    );

    expect(result.state.confirmedConnections).toEqual(
      expect.arrayContaining([
        "miriam_1998|miriam_letter_1998",
        "miriam_1998|miriam_notebook",
        "miriam_letter_1998|miriam_notebook",
      ])
    );

    const unmatched = reduceGameEvent(
      result.state,
      deductionEvent(
        "observer_relay",
        ["person-sarah", "person-tom", "future_access_log"],
        "relay_tom_recipient"
      )
    );
    expect(unmatched.theoryResult?.insightId).toBeNull();
    expect(unmatched.state.confirmedConnections).toBe(
      result.state.confirmedConnections
    );
  });

  it("requires the automatic Volume II conclusion and all five deductions before containment", () => {
    let state = retainSarahFindings(retainObserverFindings(solveThroughFutureLog()));
    state = reduceGameEvent(state, {
      type: "SOLVE_PUZZLE",
      puzzleId: "index_name",
    }).state;
    const deductions = [
      ["cataloguer_lineage", ["person-miriam", "person-sarah", "lineage_pattern"]],
      ["observer_relay", ["person-sarah", "person-tom", "future_access_log"]],
      ["institutional_suppression", ["incident_report", "maintenance_record", "whitfield_memo"]],
      ["miriam_break", ["miriam_1998", "miriam_letter_1998", "miriam_notebook"]],
      ["self_index", ["future_access_log", "index_help", "record_2014"]],
    ] as const;
    for (const [insightId, evidenceIds] of deductions) {
      state = reduceGameEvent(state, deductionEvent(insightId, [...evidenceIds])).state;
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
    const deductions = [
      ["cataloguer_lineage", ["person-miriam", "person-sarah", "lineage_pattern"]],
      ["observer_relay", ["person-sarah", "person-tom", "future_access_log"]],
      ["institutional_suppression", ["incident_report", "maintenance_record", "whitfield_memo"]],
      ["miriam_break", ["miriam_1998", "miriam_letter_1998", "miriam_notebook"]],
      ["self_index", ["future_access_log", "index_help", "record_2014"]],
    ] as const;
    for (const [insightId, evidenceIds] of deductions) {
      state = reduceGameEvent(state, deductionEvent(insightId, [...evidenceIds])).state;
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

  it("freezes narrative progression after a final while retaining aftermath UX", () => {
    const state = completedCase();
    const blockedEvents: GameEvent[] = [
      { type: "SET_FLAG", flag: "post_ending_flag" },
      { type: "DISCOVER_EVIDENCE", evidenceId: "hash_manifest" },
      { type: "VISIT_PAGE", pageId: "post-ending-page" },
      { type: "ATTEMPT_PUZZLE", puzzleId: "lot_114" },
      { type: "SOLVE_PUZZLE", puzzleId: "lot_114" },
      { type: "COLLECT_REFERENCE", reference: "E7-A1-C4-B9" },
      { type: "COLLECT_TOKEN", tokenId: "status-tomorrow" },
      { type: "FUTURE_SEQUENCE_ACTION", action: "image:mirror" },
      { type: "RUN_COMMAND", command: "INDEX /RESTORE SARAH" },
      { type: "DISCOVER_OPTIONAL", discoveryId: "solitaire_save" },
      { type: "COMPLETE_OPTIONAL_MISSION", missionId: "solitaire_save" },
      { type: "CHOOSE_ENDING", ending: "restore" },
    ];

    for (const event of blockedEvents) {
      expect(reduceGameEvent(state, event).state).toBe(state);
    }
    expect(state.flags.post_ending_flag).toBeUndefined();
    expect(state.discoveredEvidenceIds).toEqual([]);
    expect(state.puzzles.lot_114.solvedAt).toBeNull();

    const acknowledged = reduceGameEvent(state, {
      type: "SET_FLAG",
      flag: "ending_closure_seen",
    }).state;
    expect(acknowledged.flags.ending_closure_seen).toBe(true);

    const reviewed = reduceGameEvent(acknowledged, {
      type: "MARK_FILE_READ",
      fileId: "solitaire_save",
    }).state;
    expect(reviewed.readFileIds).toEqual(["solitaire_save"]);

    const notes = reduceGameEvent(reviewed, {
      type: "SET_CASE_NOTES",
      notes: "The case is closed.",
    }).state;
    expect(notes.caseNotes).toBe("The case is closed.");
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
