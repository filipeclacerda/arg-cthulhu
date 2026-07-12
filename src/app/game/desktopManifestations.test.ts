import { describe, expect, it } from "vitest";
import {
  ProgressStateV3,
  PuzzleId,
  createInitialProgress,
} from "./progress";
import { isUnlocked } from "./unlock";
import {
  browserSearchEchoes,
  projectFilesystem,
  projectRecentDocuments,
  projectRecycleBin,
  resolveWindowTitle,
  suppressedFiles,
  titlesContaminated,
} from "./desktopManifestations";

const baseState = (): ProgressStateV3 => createInitialProgress(0, "test-case");

const solve = (state: ProgressStateV3, puzzleId: PuzzleId, at = 1): void => {
  state.puzzles[puzzleId].solvedAt = at;
};

const read = (state: ProgressStateV3, fileId: string): void => {
  state.readFileIds = [...state.readFileIds, fileId];
};

const instanceIds = (files: { instanceId: string }[]) =>
  files.map((file) => file.instanceId);

describe("fileRead unlock condition", () => {
  it("resolves against readFileIds", () => {
    expect(
      isUnlocked(
        { type: "fileRead", fileId: "apology_tmp" },
        { flags: {}, readFileIds: ["apology_tmp"] }
      )
    ).toBe(true);
    expect(
      isUnlocked(
        { type: "fileRead", fileId: "apology_tmp" },
        { flags: {}, readFileIds: [] }
      )
    ).toBe(false);
  });
});

describe("filesystem projections", () => {
  it("projects nothing on a fresh save", () => {
    expect(projectFilesystem(baseState())).toEqual([]);
  });

  it("duplicates STATUS_QUERY.PRN into RECOVERED once the sheet has flipped", () => {
    const state = baseState();
    state.flags.status_sheet_duplicated = true;
    const dupe = projectFilesystem(state).find(
      (file) => file.instanceId === "status_query_recovered_dupe"
    );
    expect(dupe?.sourceFileId).toBe("status_query_sheet");
    expect(dupe?.folderId).toBe("restricted");
    // Points at the canonical file, so opening it never mints new evidence.
    expect(dupe?.sourceFileId).not.toBe(dupe?.instanceId);
  });

  it("relocates margin_ch7.enc into RECOVERED only after its cipher is spent", () => {
    const state = baseState();
    expect(
      projectFilesystem(state).some((f) => f.instanceId === "margin_ch7_relocated")
    ).toBe(false);
    solve(state, "margin_cipher");
    const moved = projectFilesystem(state).find(
      (f) => f.instanceId === "margin_ch7_relocated"
    );
    expect(moved?.folderId).toBe("restricted");
    expect(moved?.sourceFileId).toBe("cipher_1");
  });

  it("moves APOLOGY.TMP to Work once the player opens it", () => {
    const state = baseState();
    expect(
      projectFilesystem(state).some((f) => f.instanceId === "apology_moved_to_work")
    ).toBe(false);
    read(state, "apology_tmp");
    const moved = projectFilesystem(state).find(
      (f) => f.instanceId === "apology_moved_to_work"
    );
    expect(moved?.folderId).toBe("work");
  });
});

describe("recent document projections", () => {
  it("advertises the STATUS_QUERY duplicate before it is opened, then retires it", () => {
    const state = baseState();
    state.flags.status_sheet_duplicated = true;
    expect(
      projectRecentDocuments(state).some(
        (f) => f.instanceId === "status_query_recent_precognition"
      )
    ).toBe(true);
    read(state, "status_query_sheet");
    expect(
      projectRecentDocuments(state).some(
        (f) => f.instanceId === "status_query_recent_precognition"
      )
    ).toBe(false);
  });

  it("returns counting.wav to recents with a future date after it is solved", () => {
    const state = baseState();
    solve(state, "counting_audio");
    const entry = projectRecentDocuments(state).find(
      (f) => f.instanceId === "counting_recent_future_dated"
    );
    expect(entry?.sourceFileId).toBe("counting_audio");
    expect(entry?.modified).toContain("{TOMORROW}");
  });

  it("lets Sarah's ordinary voicemail return only after it was heard and the future log is solved", () => {
    const state = baseState();
    solve(state, "future_log");
    expect(
      projectRecentDocuments(state).some(
        (file) => file.instanceId === "voicemail_recent_second_receipt"
      )
    ).toBe(false);

    read(state, "voicemail_to_em");
    const returned = projectRecentDocuments(state).find(
      (file) => file.instanceId === "voicemail_recent_second_receipt"
    );
    expect(returned).toMatchObject({
      sourceFileId: "voicemail_to_em",
      displayName: "voicemail_to_em (2).wav",
      modified: "{TOMORROW} 17:44",
    });
  });

  it("changes the mundane dinner receipt near the finale only for players who found it", () => {
    const state = baseState();
    solve(state, "index_name");
    expect(
      projectRecentDocuments(state).some(
        (file) => file.instanceId === "gull_receipt_party_of_three"
      )
    ).toBe(false);

    read(state, "gull_0310_receipt");
    const changed = projectRecentDocuments(state).find(
      (file) => file.instanceId === "gull_receipt_party_of_three"
    );
    expect(changed).toMatchObject({
      sourceFileId: "gull_0310_receipt",
      displayName: "GULL_0310 — TABLE FOR 3.RCT",
      modified: "{TOMORROW} 22:18",
    });
  });
});

describe("recycle bin projections and the APOLOGY move", () => {
  it("keeps APOLOGY out of the bin until the future log returns it", () => {
    const state = baseState();
    read(state, "apology_tmp");
    // Suppressed from the bin the moment it is opened...
    expect(
      suppressedFiles(state).some(
        (s) => s.sourceFileId === "apology_tmp" && s.folderId === "recycle-bin"
      )
    ).toBe(true);
    expect(projectRecycleBin(state)).toEqual([]);
    // ...and returns dated tomorrow only after future_log.
    solve(state, "future_log");
    const returned = projectRecycleBin(state).find(
      (f) => f.instanceId === "apology_returned_to_bin"
    );
    expect(returned?.modified).toBe("{TOMORROW}");
    // The Work copy still exists alongside the returned bin copy.
    expect(
      projectFilesystem(state).some((f) => f.instanceId === "apology_moved_to_work")
    ).toBe(true);
  });
});

describe("canonical suppressions", () => {
  it("hides margin_ch7.enc from Sarah's folder once it has moved", () => {
    const state = baseState();
    expect(suppressedFiles(state)).toEqual([]);
    solve(state, "margin_cipher");
    expect(suppressedFiles(state)).toContainEqual({
      sourceFileId: "cipher_1",
      folderId: "sarah",
    });
  });
});

describe("window title contamination", () => {
  it("leaves titles untouched before lineage", () => {
    const state = baseState();
    expect(titlesContaminated(state)).toBe(false);
    expect(resolveWindowTitle({ title: "Sarah Bishop" }, state)).toBe(
      "Sarah Bishop"
    );
  });

  it("reflects the observer once lineage is solved", () => {
    const state = baseState();
    state.playerName = "Dana";
    solve(state, "lineage");
    expect(resolveWindowTitle({ title: "Sarah Bishop" }, state)).toBe("Dana");
    // The more explicit temporal contamination waits for the next discovery.
    expect(resolveWindowTitle({ title: "RECOVERED" }, state)).toBe("RECOVERED");
    expect(resolveWindowTitle({ title: "MSN Messenger" }, state)).toBe(
      "MSN Messenger"
    );
    expect(resolveWindowTitle({ title: "Recycle Bin" }, state)).toBe(
      "Recycle Bin"
    );

    solve(state, "future_log");
    expect(resolveWindowTitle({ title: "RECOVERED" }, state)).toBe(
      "RECOVERED — CURRENT OBSERVER"
    );
    expect(
      resolveWindowTitle({ title: "MSN Messenger" }, state)
    ).toBe("MSN Messenger — archived tomorrow");
    expect(
      resolveWindowTitle({ title: "office_after.jpg" }, state)
    ).toBe("office_after.jpg — 2 instances");
    expect(resolveWindowTitle({ title: "Recycle Bin" }, state)).toBe(
      "Recycle Bin — restored tomorrow"
    );
  });

  it("never contaminates the RECOVERED PROGRAM finale window", () => {
    const state = baseState();
    solve(state, "lineage");
    expect(
      resolveWindowTitle({ title: "RECOVERED PROGRAM / LOOPBACK" }, state)
    ).toBe("RECOVERED PROGRAM / LOOPBACK");
  });

  it("is idempotent — decorating an already-contaminated title is a no-op", () => {
    const state = baseState();
    solve(state, "lineage");
    const once = resolveWindowTitle({ title: "RECOVERED" }, state);
    expect(resolveWindowTitle({ title: once }, state)).toBe(once);
  });
});

describe("browser search echoes", () => {
  it("stays silent before lineage", () => {
    expect(browserSearchEchoes(baseState(), "anything")).toEqual([]);
  });

  it("adds an unperformed future echo after lineage", () => {
    const state = baseState();
    solve(state, "lineage");
    const echoes = browserSearchEchoes(state, "lot 114");
    expect(echoes.some((e) => e.kind === "unperformed")).toBe(true);
    // Additive: a real-looking catalogue query is never replaced or dropped.
    expect(echoes.every((e) => e.text !== "lot 114")).toBe(true);
  });

  it("suppresses an echo that would duplicate the live query", () => {
    const state = baseState();
    state.playerName = "OBSERVER";
    solve(state, "lineage");
    const echoes = browserSearchEchoes(state, "observer — search not performed");
    expect(
      echoes.some((e) => e.text === "observer — search not performed")
    ).toBe(false);
  });

  it("returns the dinner's impossible third place as an unperformed late-game query", () => {
    const state = baseState();
    read(state, "gull_0310_receipt");
    solve(state, "future_log");
    expect(
      browserSearchEchoes(state, "").some(
        (echo) => echo.id === "gull_third_place_unperformed"
      )
    ).toBe(false);

    solve(state, "index_name");
    expect(browserSearchEchoes(state, "")).toContainEqual({
      id: "gull_third_place_unperformed",
      kind: "unperformed",
      text: "gull & lantern table 4 third place setting",
    });
  });
});

describe("projection stability", () => {
  it("returns identical instance ids across repeated calls (reload-safe)", () => {
    const state = baseState();
    state.flags.status_sheet_duplicated = true;
    solve(state, "margin_cipher");
    expect(instanceIds(projectFilesystem(state))).toEqual(
      instanceIds(projectFilesystem(state))
    );
  });
});
