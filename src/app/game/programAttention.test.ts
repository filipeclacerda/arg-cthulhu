import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  activityDigestFlag,
  activityDigestNeedsAttention,
  activityIdsOpenedByWindow,
  programsWithVisibleAttention,
} from "./programAttention";

describe("program attention", () => {
  it("acknowledges a digest separately from its source records", () => {
    const state = createInitialProgress();
    state.flags.sarah_email_arrived = true;

    expect(activityDigestNeedsAttention(state)).toBe(true);
    expect(programsWithVisibleAttention(state)).toEqual(
      new Set(["email", "case-notes"]),
    );

    state.flags[activityDigestFlag(state)] = true;
    expect(activityDigestNeedsAttention(state)).toBe(false);
    expect(programsWithVisibleAttention(state)).toEqual(new Set(["email"]));
  });

  it("maps the endgame activity to the Finale instead of Casefile", () => {
    const state = createInitialProgress();
    state.flags.endgame_available = true;

    expect(
      activityIdsOpenedByWindow(state, { appType: "finale", props: {} }),
    ).toContain("endgame");
    expect(
      activityIdsOpenedByWindow(state, { appType: "casefile", props: {} }),
    ).not.toContain("endgame");
  });
});
