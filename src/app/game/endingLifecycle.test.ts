import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  aftermathDesktopHref,
  desktopModeFromSearch,
  endingDesktopHref,
  hasSeenEndingClosure,
  isEndingClosurePending,
  isStoryComplete,
} from "./endingLifecycle";

describe("ending lifecycle", () => {
  it("uses the canonical ending, not a flag, to identify a completed story", () => {
    const state = createInitialProgress(1, "case");
    state.flags.ending_shutdown = true;

    expect(isStoryComplete(state)).toBe(false);
    expect(isEndingClosurePending(state)).toBe(false);
  });

  it("keeps a completed case pending until its closure is acknowledged", () => {
    const state = createInitialProgress(1, "case");
    state.ending = "shutdown";

    expect(isStoryComplete(state)).toBe(true);
    expect(hasSeenEndingClosure(state)).toBe(false);
    expect(isEndingClosurePending(state)).toBe(true);

    state.flags.ending_closure_seen = true;
    expect(hasSeenEndingClosure(state)).toBe(true);
    expect(isEndingClosurePending(state)).toBe(false);
  });

  it("accepts only explicit post-ending desktop modes", () => {
    expect(desktopModeFromSearch("?mode=ending")).toBe("ending");
    expect(desktopModeFromSearch("mode=aftermath")).toBe("aftermath");
    expect(desktopModeFromSearch("?mode=normal")).toBeNull();
    expect(endingDesktopHref).toBe("/desktop/?mode=ending");
    expect(aftermathDesktopHref).toBe("/desktop/?mode=aftermath");
  });
});
