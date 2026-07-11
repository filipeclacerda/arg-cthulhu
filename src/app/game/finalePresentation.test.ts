import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  selectInitialFinalePresentation,
  shouldRecordFinaleChoiceSeen,
  type FinalePresentationScreen,
} from "./finalePresentation";

describe("finale presentation", () => {
  it("opens an active save in the fullscreen introduction", () => {
    const state = createInitialProgress(1, "case");

    expect(selectInitialFinalePresentation(state)).toEqual({ screen: "intro" });
  });

  it.each(["restore", "shutdown", "seal", "leave_blank", "archive_self"] as const)(
    "reopens the recorded %s ending in its coda",
    (ending) => {
      const state = createInitialProgress(1, "case");
      state.ending = ending;

      expect(selectInitialFinalePresentation(state)).toEqual({ screen: "coda", ending });
    }
  );

  it("opens a prepared seal at its confirmation phase", () => {
    const state = createInitialProgress(1, "case");
    state.flags.seal_relay_prepared = true;

    expect(selectInitialFinalePresentation(state)).toEqual({ screen: "seal_confirm" });
  });

  it("preserves the incomplete-restore presentation ahead of the restore coda", () => {
    const state = createInitialProgress(1, "case");
    state.ending = "restore";
    state.flags.ending_restore_incomplete = true;

    expect(selectInitialFinalePresentation(state)).toEqual({
      screen: "restore_incomplete",
      ending: "restore",
    });
  });

  it("records finale_choice_seen only for the main choice", () => {
    const screens: FinalePresentationScreen[] = [
      "intro",
      "choice",
      "seal_confirm",
      "restore_incomplete",
      "coda",
    ];

    expect(screens.filter((screen) => shouldRecordFinaleChoiceSeen({ screen }))).toEqual([
      "choice",
    ]);
  });
});
