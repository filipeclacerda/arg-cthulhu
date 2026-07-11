import { describe, expect, it } from "vitest";
import {
  DiegeticEventDefinition,
  selectNextDiegeticEvent,
} from "./diegeticEvents";
import { shouldAdvanceLiveContact } from "./liveContact";

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
