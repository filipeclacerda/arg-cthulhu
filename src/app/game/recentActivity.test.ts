import { describe, expect, it } from "vitest";
import { files } from "../data/filesystem";
import { DIEGETIC_EVENTS } from "./diegeticEvents";
import { createInitialProgress, PUZZLE_IDS } from "./progress";
import {
  activitySeenFlag,
  CRITICAL_PROGRESS_CONTRACTS,
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

  it("surfaces every solved investigation milestone without revealing later ones", () => {
    const state = createInitialProgress();
    const expectedActivityForPuzzle = {
      lot_114: "lot-114",
      palimpsest: "palimpsest-recovered",
      margin_cipher: "margin-decoded",
      counting_audio: "counting-recovered",
      lineage: "lineage-opened",
      future_log: "future-log-reproduced",
      index_name: "index-joined",
    } as const;

    PUZZLE_IDS.forEach((puzzleId, index) => {
      state.puzzles[puzzleId].solvedAt = index + 1;
      const ids = recentActivities(state).map((entry) => entry.id);
      expect(ids).toContain(expectedActivityForPuzzle[puzzleId]);

      PUZZLE_IDS.slice(index + 1).forEach((futurePuzzleId) => {
        expect(ids).not.toContain(expectedActivityForPuzzle[futurePuzzleId]);
      });
    });
  });

  it("frames the first Casefile objective as an active story question", () => {
    const state = createInitialProgress();
    state.puzzles.lot_114.solvedAt = Date.now();

    const question = recentActivities(state).find(
      (entry) => entry.id === "lot-114"
    );
    expect(question?.title.pt).toBe("Como o Volume II reapareceu?");
    expect(question?.summary.pt).toContain("procedência");
    expect(question?.summary.pt).not.toContain("reter");
  });

  it("keeps an interrupted NEXT_USER carrier resumable and replaces it after completion", () => {
    const state = createInitialProgress();
    state.flags.next_user_handshake_sent = true;

    expect(recentActivities(state).map((entry) => entry.id)).toContain(
      "next-user-pending"
    );

    state.flags.next_user_1998_complete = true;
    const completedIds = recentActivities(state).map((entry) => entry.id);
    expect(completedIds).not.toContain("next-user-pending");
    expect(completedIds).toContain("next-user");
  });

  it("targets the recovered program directly when the Finale becomes available", () => {
    const state = createInitialProgress();
    state.flags.endgame_available = true;

    const endgameActivity = recentActivities(state).find(
      (entry) => entry.id === "endgame"
    );
    expect(endgameActivity?.program).toBe("finale");
    expect(endgameActivity).not.toHaveProperty("artifactId");
  });
});

describe("critical progress redundancy contract", () => {
  it("covers every puzzle plus the resumable 1998 session and the Finale", () => {
    const contractIds = new Set(CRITICAL_PROGRESS_CONTRACTS.map(({ id }) => id));

    PUZZLE_IDS.forEach((puzzleId) => expect(contractIds).toContain(puzzleId));
    expect(contractIds).toContain("next_user_1998");
    expect(contractIds).toContain("endgame");
  });

  it("guarantees two distinct discovery channels and one durable fallback per milestone", () => {
    CRITICAL_PROGRESS_CONTRACTS.forEach((contract) => {
      const routeKinds = new Set(contract.routes.map((route) => route.kind));
      expect(routeKinds.size, `${contract.id} has only one discovery channel`).toBeGreaterThanOrEqual(2);
      expect(
        contract.routes.some(
          (route) =>
            route.kind === "persistent-program" || route.kind === "resumable-session"
        ),
        `${contract.id} has no durable fallback after a missed alert`
      ).toBe(true);
    });
  });

  it("references real recent activities, diegetic events and persistent artifacts", () => {
    const state = createInitialProgress();
    PUZZLE_IDS.forEach((puzzleId, index) => {
      state.puzzles[puzzleId].solvedAt = index + 1;
    });
    state.flags.next_user_handshake_sent = true;
    state.flags.endgame_available = true;

    const activityIds = new Set(recentActivities(state).map(({ id }) => id));
    const eventIds = new Set(DIEGETIC_EVENTS.map(({ id }) => id));
    const fileIds = new Set(files.map(({ id }) => id));

    CRITICAL_PROGRESS_CONTRACTS.flatMap(({ routes }) => routes).forEach((route) => {
      if (route.kind === "recent-activity") {
        expect(activityIds, `unknown activity ${route.activityId}`).toContain(route.activityId);
      }
      if (route.kind === "diegetic-event") {
        expect(eventIds, `unknown event ${route.eventId}`).toContain(route.eventId);
      }
      if (route.kind === "persistent-program" && route.artifactId) {
        expect(fileIds, `unknown artifact ${route.artifactId}`).toContain(route.artifactId);
      }
    });
  });
});
