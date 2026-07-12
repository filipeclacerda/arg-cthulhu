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

  it("keeps physical controls separate and only exposes the attempted one", () => {
    const state = createInitialProgress();
    state.flags.casefile_zoom_friction = true;
    expect(contextualGuidance(state).map((guide) => guide.id)).toContain("board-zoom");
    expect(contextualGuidance(state).map((guide) => guide.id)).not.toContain("board-pan");

    state.flags.casefile_board_zoomed = true;
    expect(contextualGuidance(state).map((guide) => guide.id)).not.toContain("board-zoom");
  });
});
