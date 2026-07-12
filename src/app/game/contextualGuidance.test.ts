import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import { contextualGuidance } from "./contextualGuidance";

describe("contextual guidance", () => {
  it("appears after friction rather than before the first attempt", () => {
    const state = createInitialProgress();
    expect(contextualGuidance(state)).toEqual([]);
    state.puzzles.counting_audio.nearMisses.audio_reverse = 1;
    expect(contextualGuidance(state).map((guide) => guide.id)).toContain("audio-reverse");
  });
});
