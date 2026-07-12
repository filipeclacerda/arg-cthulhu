import { describe, expect, it } from "vitest";
import { ProgressStateV3, createInitialProgress } from "./progress";
import {
  LEGACY_REPLY_IDS,
  MODERN_QUESTION_RECEIPTS,
  legacyReplyCoda,
  legacyReplyId,
  legacyReplyResidue,
  modernQuestionLogLine,
  modernQuestionOutcome,
  modernQuestionReceipt,
} from "./messengerConsequences";

const baseState = (): ProgressStateV3 => createInitialProgress(0, "test-case");

const choose = (
  state: ProgressStateV3,
  choiceId: string,
  optionId: string
): void => {
  state.playerChoices = [
    ...state.playerChoices,
    { choiceId, optionId, chosenAt: 1 },
  ];
};

describe("modern question outcome", () => {
  it("is undecided while the contact has not closed", () => {
    expect(modernQuestionOutcome(baseState())).toBeNull();
  });

  it("is 'missed' when the live window closes unanswered", () => {
    const state = baseState();
    state.liveContact.status = "closed";
    expect(modernQuestionOutcome(state)).toBe("missed");
    expect(modernQuestionReceipt(state)).toBe(
      "NO OUTBOUND MESSAGE / READ RECEIPT PRESENT"
    );
    // A missed window sends nothing outbound — no DIALUP.LOG line.
    expect(modernQuestionLogLine(state)).toBeNull();
  });

  it("reflects the asked question and its dry receipt", () => {
    const state = baseState();
    choose(state, "sarah_live_question", "break");
    expect(modernQuestionOutcome(state)).toBe("break");
    expect(modernQuestionReceipt(state)).toBe(
      "WRITE CANCELED / RECIPIENT FIELD RETAINED BLANK"
    );
    expect(modernQuestionLogLine(state)).toBe(
      "03:14:05 REMOTE BODY: HOW DO WE BREAK THIS?"
    );
  });

  it("ignores an unrecognised option id", () => {
    const state = baseState();
    choose(state, "sarah_live_question", "not_a_question");
    expect(modernQuestionOutcome(state)).toBeNull();
  });

  it("keeps every receipt free of a presence/authorship verdict", () => {
    const forbidden = /\b(alive|dead|saved|restored|is sarah)\b/i;
    for (const receipt of Object.values(MODERN_QUESTION_RECEIPTS)) {
      expect(receipt).not.toMatch(forbidden);
    }
  });
});

describe("1998 reply residue", () => {
  it("reads the recorded reply", () => {
    const state = baseState();
    expect(legacyReplyId(state)).toBeNull();
    choose(state, "next_user_1998_reply", "warn");
    expect(legacyReplyId(state)).toBe("warn");
  });

  it("only materialises after the future log is solved", () => {
    const state = baseState();
    choose(state, "next_user_1998_reply", "remember");
    expect(legacyReplyResidue(state)).toBeNull();
    state.puzzles.future_log.solvedAt = 1;
    expect(legacyReplyResidue(state)?.target).toEqual({
      kind: "browserHistory",
      address: "cache://sb-archive-02/history/0314",
      label: "session retained",
    });
  });

  it("leaves a distinct residue for each reply", () => {
    const kinds = LEGACY_REPLY_IDS.map((reply) => {
      const state = baseState();
      state.puzzles.future_log.solvedAt = 1;
      choose(state, "next_user_1998_reply", reply);
      return legacyReplyResidue(state)?.target.kind;
    });
    expect(new Set(kinds).size).toBe(LEGACY_REPLY_IDS.length);
  });
});

describe("ending coda", () => {
  it("is withheld until an ending is chosen, then localises", () => {
    const state = baseState();
    choose(state, "next_user_1998_reply", "silence");
    expect(legacyReplyCoda(state)).toBeNull();
    state.ending = "shutdown";
    expect(legacyReplyCoda(state, "en")).toMatch(/empty file/i);
    expect(legacyReplyCoda(state, "pt-BR")).toMatch(/arquivo vazio/i);
  });

  it("is a single line independent of which ending was chosen", () => {
    const forShutdown = baseState();
    forShutdown.ending = "shutdown";
    choose(forShutdown, "next_user_1998_reply", "warn");

    const forRestore = baseState();
    forRestore.ending = "restore";
    choose(forRestore, "next_user_1998_reply", "warn");

    expect(legacyReplyCoda(forShutdown, "en")).toBe(
      legacyReplyCoda(forRestore, "en")
    );
    expect(legacyReplyCoda(forShutdown, "en")).not.toContain("\n");
  });
});
