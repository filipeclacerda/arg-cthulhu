import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  activitySeenFlag,
  programsNeedingAttention,
  recentActivities,
  unseenRecentActivities,
} from "./recentActivity";

describe("recent activity", () => {
  it("derives activity from canonical progress without revealing future events", () => {
    const state = createInitialProgress();
    expect(recentActivities(state)).toEqual([]);
    state.puzzles.margin_cipher.solvedAt = Date.now();
    expect(recentActivities(state).map((entry) => entry.id)).toEqual(["margin-decoded"]);
  });

  it("acknowledges entries individually and drives discreet program attention", () => {
    const state = createInitialProgress();
    state.flags.sarah_email_arrived = true;
    state.flags.post_end_transcript_seen = true;
    expect(programsNeedingAttention(state)).toEqual(new Set(["email", "explorer"]));
    state.flags[activitySeenFlag("sarah-mail")] = true;
    expect(unseenRecentActivities(state).map((entry) => entry.id)).toEqual([
      "ordinary-voicemail",
    ]);
  });
});
