import { describe, expect, it } from "vitest";
import {
  DIEGETIC_EVENTS,
  DiegeticEventDefinition,
  diegeticEventDelayMs,
  selectNextDiegeticEvent,
} from "./diegeticEvents";
import { shouldAdvanceLiveContact } from "./liveContact";
import { UnlockContext } from "./unlock";

const events: DiegeticEventDefinition[] = [
  {
    id: "optional",
    priority: 4,
    presentation: { kind: "toast" },
    when: { type: "flag", flag: "optional_ready" },
    seenFlag: "optional_seen",
    sound: "disk",
  },
  {
    id: "set-piece",
    priority: 1,
    presentation: { kind: "window", windowId: "set-piece" },
    when: { type: "flag", flag: "set_piece_ready" },
    seenFlag: "set_piece_seen",
    sound: "future",
  },
];

describe("diegetic event coordination", () => {
  const context = {
    flags: { optional_ready: true, set_piece_ready: true },
    discoveredEvidenceIds: [],
    solvedPuzzleIds: [],
    worldReactionsSeen: [],
    playerChoices: [],
    liveContactStatus: "unseen" as const,
  };

  it("always prioritizes a focal set piece over a queued optional toast", () => {
    expect(
      selectNextDiegeticEvent(context, { focalBusy: false, toastBusy: false }, events)?.id
    ).toBe("set-piece");
  });

  it("does not present an event while another focal event is open", () => {
    expect(
      selectNextDiegeticEvent(context, { focalBusy: true, toastBusy: false }, events)
    ).toBeNull();
  });

  it("does not drain deferred campaign events during aftermath review", () => {
    expect(
      selectNextDiegeticEvent(
        context,
        { focalBusy: false, toastBusy: false, aftermathReview: true },
        events
      )
    ).toBeNull();
  });
});

describe("diegetic sound cues", () => {
  it("keeps the selected subtle effects attached to their narrative reveals", () => {
    const soundFor = (id: string) =>
      DIEGETIC_EVENTS.find((event) => event.id === id)?.sound;

    expect(soundFor("mail_from_tomorrow")).toBe("harmonized");
    expect(soundFor("next_user_1998_session")).toBe("harmonized");
    expect(soundFor("counting_file")).toBe("mechanicalMoan");
    expect(soundFor("chapter_seven")).toBe("metalResonance");
    expect(soundFor("endgame_program")).toBe("deepMoan");
    expect(soundFor("micro_two_days_out")).toBe("clock");
    expect(soundFor("recall_0314")).toBeUndefined();
  });

  it("keeps counting.wav announced even if the puzzle was solved elsewhere", () => {
    const event = DIEGETIC_EVENTS.find((candidate) => candidate.id === "counting_file");
    expect(event?.obsoleteWhen).toBeUndefined();
    expect(event?.sound).toBe("mechanicalMoan");
    expect(diegeticEventDelayMs(event!, 0)).toBe(250);
    expect(diegeticEventDelayMs(event!, 1)).toBe(500);
  });

  it("announces counting.wav before the optional second 1998 session", () => {
    const context: UnlockContext = {
      flags: {
        puzzle_margin_cipher_solved: true,
        flash_1998_attempt_1_shown: true,
      },
      discoveredEvidenceIds: [],
      solvedPuzzleIds: ["margin_cipher"],
      insightsUnlocked: [],
      worldReactionsSeen: [],
      playerChoices: [],
      liveContactStatus: "unseen" as const,
    };

    expect(
      selectNextDiegeticEvent(context, { focalBusy: false, toastBusy: false })?.id
    ).toBe("counting_file");
  });

  it("registers one persistent Casefile toast per finding", () => {
    const findingEvents = DIEGETIC_EVENTS.filter((event) => event.caseFindingId);
    expect(findingEvents).toHaveLength(7);
    expect(findingEvents.every((event) => event.presentation.kind === "toast")).toBe(true);
    expect(new Set(findingEvents.map((event) => event.seenFlag)).size).toBe(7);
  });
});

describe("live contact focus gates", () => {
  const activeGate = {
    status: "active" as const,
    documentHidden: false,
    messengerFocused: true,
    focalSetPieceActive: false,
  };

  it("spends time only while the visible Messenger is focused and uncovered", () => {
    expect(shouldAdvanceLiveContact(activeGate)).toBe(true);
    expect(shouldAdvanceLiveContact({ ...activeGate, documentHidden: true })).toBe(false);
    expect(shouldAdvanceLiveContact({ ...activeGate, messengerFocused: false })).toBe(false);
    expect(shouldAdvanceLiveContact({ ...activeGate, focalSetPieceActive: true })).toBe(false);
    expect(shouldAdvanceLiveContact({ ...activeGate, status: "closed" })).toBe(false);
  });
});
