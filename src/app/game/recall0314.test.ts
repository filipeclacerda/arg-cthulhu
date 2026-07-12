import { describe, expect, it } from "vitest";
import { ProgressStateV3, createInitialProgress } from "./progress";
import {
  RECALL_COMPLETE_FLAG,
  RECALL_PHASES,
  RECALL_STARTED_FLAG,
  firstIncompletePhase,
  nextPhase,
  phaseHoldMs,
  recallReceiptLine,
  recallStatus,
  recallTriggerReady,
  shouldAcknowledgeRecallReceipt,
  shouldShowRecallRecoveryNotice,
} from "./recall0314";
import { browserPage, PAGE_ADDRESS } from "../data/browserPages";

const baseState = (): ProgressStateV3 => createInitialProgress(0, "test-case");

describe("recall browser surface", () => {
  it("registers the 0314 cache behind the receipt flag", () => {
    expect(PAGE_ADDRESS["recall-history"]).toBe("cache://sb-archive-02/history/0314");
    expect(browserPage("recall-history").unlock).toEqual({ type: "flag", flag: "recall_0314_receipt_seen" });
  });
});

/** A save that satisfies every persisted RECALL_0314 prerequisite. */
const readyState = (): ProgressStateV3 => {
  const state = baseState();
  state.puzzles.future_log.solvedAt = 1;
  state.flags.post_end_transcript_seen = true;
  state.liveContact.status = "closed";
  state.flags.next_user_1998_complete = true;
  return state;
};

describe("recall status", () => {
  it("moves idle -> active -> complete/skipped by flag", () => {
    const state = baseState();
    expect(recallStatus(state.flags)).toBe("idle");
    state.flags[RECALL_STARTED_FLAG] = true;
    expect(recallStatus(state.flags)).toBe("active");
    state.flags[RECALL_COMPLETE_FLAG] = true;
    expect(recallStatus(state.flags)).toBe("complete");
  });

  it("shows recovery only for a save that was already active", () => {
    expect(shouldShowRecallRecoveryNotice({})).toBe(false);
    expect(shouldShowRecallRecoveryNotice({ [RECALL_STARTED_FLAG]: true })).toBe(true);
    expect(shouldShowRecallRecoveryNotice({ [RECALL_STARTED_FLAG]: true, [RECALL_COMPLETE_FLAG]: true })).toBe(false);
  });
});

describe("receipt visibility", () => {
  const base = {
    hasReceipt: true,
    messengerFocused: true,
    liveThreadSelected: true,
    alreadySeen: false,
  };

  it("acknowledges only a focused visible live thread", () => {
    expect(shouldAcknowledgeRecallReceipt(base)).toBe(true);
    expect(shouldAcknowledgeRecallReceipt({ ...base, messengerFocused: false })).toBe(false);
    expect(shouldAcknowledgeRecallReceipt({ ...base, liveThreadSelected: false })).toBe(false);
    expect(shouldAcknowledgeRecallReceipt({ ...base, alreadySeen: true })).toBe(false);
  });
});

describe("trigger readiness", () => {
  it("fires only when every prerequisite holds and the desktop is quiet", () => {
    const state = readyState();
    expect(recallTriggerReady(state, { focalBusy: false })).toBe(true);
    expect(recallTriggerReady(state, { focalBusy: true })).toBe(false);
  });

  it("accepts a missed modern question (no handshake ever sent)", () => {
    const state = readyState();
    state.flags.next_user_1998_complete = false;
    // No next_user_handshake_sent flag => the question was missed.
    expect(recallTriggerReady(state, { focalBusy: false })).toBe(true);
  });

  it("never fires without the future log, the post-end transcript, or a closed contact", () => {
    const missingLog = readyState();
    missingLog.puzzles.future_log.solvedAt = null;
    expect(recallTriggerReady(missingLog, { focalBusy: false })).toBe(false);

    const missingTranscript = readyState();
    missingTranscript.flags.post_end_transcript_seen = false;
    expect(recallTriggerReady(missingTranscript, { focalBusy: false })).toBe(false);

    const contactOpen = readyState();
    contactOpen.liveContact.status = "active";
    expect(recallTriggerReady(contactOpen, { focalBusy: false })).toBe(false);
  });

  it("never re-arms once an ending is chosen, or once complete/skipped", () => {
    const ended = readyState();
    ended.ending = "shutdown";
    expect(recallTriggerReady(ended, { focalBusy: false })).toBe(false);

    const complete = readyState();
    complete.flags[RECALL_COMPLETE_FLAG] = true;
    expect(recallTriggerReady(complete, { focalBusy: false })).toBe(false);

    const skipped = readyState();
    skipped.flags.recall_0314_skipped = true;
    expect(recallTriggerReady(skipped, { focalBusy: false })).toBe(false);
  });
});

describe("resume math", () => {
  it("resumes at the first incomplete phase after a reload", () => {
    const flags: Record<string, boolean> = { [RECALL_STARTED_FLAG]: true };
    expect(firstIncompletePhase(flags)?.id).toBe("clock");
    flags[RECALL_PHASES[0].seenFlag] = true;
    flags[RECALL_PHASES[1].seenFlag] = true;
    expect(firstIncompletePhase(flags)?.id).toBe("history");
  });

  it("reports no incomplete phase once the closure flag is set", () => {
    const flags: Record<string, boolean> = {};
    for (const phase of RECALL_PHASES) flags[phase.seenFlag] = true;
    expect(firstIncompletePhase(flags)).toBeNull();
  });

  it("walks phases in order and stops at closure", () => {
    expect(nextPhase("clock")?.id).toBe("receipt");
    expect(nextPhase("closure")).toBeNull();
  });

  it("holds longer and demands an explicit advance under reduced motion", () => {
    const clock = RECALL_PHASES[0];
    expect(phaseHoldMs(clock, true)).toBe(clock.reducedHoldMs);
    expect(phaseHoldMs(clock, false)).toBe(clock.durationMs);
  });
});

describe("receipt", () => {
  it("surfaces the dry receipt for the asked question", () => {
    const state = readyState();
    state.playerChoices = [
      { choiceId: "sarah_live_question", optionId: "break", chosenAt: 1 },
    ];
    expect(recallReceiptLine(state)).toBe(
      "WRITE CANCELED / RECIPIENT FIELD RETAINED BLANK"
    );
  });

  it("falls back to the missed receipt when the window closed unasked", () => {
    const state = readyState();
    expect(recallReceiptLine(state)).toBe(
      "NO OUTBOUND MESSAGE / READ RECEIPT PRESENT"
    );
  });
});

describe("closure flag wiring", () => {
  it("uses the complete flag as the final phase's seen flag", () => {
    expect(RECALL_PHASES[RECALL_PHASES.length - 1].seenFlag).toBe(
      RECALL_COMPLETE_FLAG
    );
  });
});
