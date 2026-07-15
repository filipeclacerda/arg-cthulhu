import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  exportCaseCode,
  importCaseCode,
  migrateProgress,
  persistProgress,
} from "./persistence";

describe("save v6", () => {
  it("grandfathers retained findings without replaying availability notifications", () => {
    const legacy = createInitialProgress(1_700_000_000_000, "finding-migration");
    legacy.caseAnswers.sarah_intent = {
      slots: { time: "time-six-thirty", intent: "intent-go-home" },
      lockedSlots: ["time", "intent"],
      evidenceIds: ["chat_em_archive", "todo"],
      attempts: 1,
      nearMisses: {},
      solvedAt: 1_700_000_000_100,
    };
    const serialized = { ...legacy } as Record<string, unknown>;
    delete serialized.announcedCaseFindingIds;
    delete serialized.viewedCaseFindingIds;
    const migrated = migrateProgress(serialized);
    expect(migrated?.announcedCaseFindingIds).toEqual(["sarah_intent"]);
    expect(migrated?.viewedCaseFindingIds).toEqual(["sarah_intent"]);
  });

  it("round-trips a portable MISK6 case code with campaign state", async () => {
    const state = createInitialProgress(1_700_000_000_000, "case-round-trip");
    state.playerName = "Ada";
    state.caseNotes = "Lot 114; count names, not days.";
    state.discoveredEvidenceIds = ["miriam_1998", "lot_114_scan"];
    state.puzzles.lot_114.solvedAt = 1_700_000_000_500;
    state.locale = "pt-BR";
    state.insightsUnlocked = ["second_volume"];
    state.collectedTokens = ["time-six-thirty", "intent-go-home"];
    state.ending = "archive_self";
    state.flags.ending_archive_self = true;
    state.flags.ending_closure_seen = true;
    state.caseAnswers.sarah_intent = {
      slots: {
        time: "time-six-thirty",
        intent: "intent-go-home",
      },
      lockedSlots: ["time", "intent"],
      evidenceIds: ["chat_em_archive", "todo"],
      attempts: 1,
      nearMisses: {},
      solvedAt: 1_700_000_000_600,
    };
    state.optionalDiscoveries = [
      "dad_recipe",
      "two_days_out",
      "tom_held_block",
      "eleanor_record",
    ];
    state.worldReactionsSeen = [
      "unindexed_interval",
      "tom_hold_seek",
      "eleanor_owner_reconciled",
    ];

    const code = await exportCaseCode(state);
    const imported = await importCaseCode(code);

    expect(code.startsWith("MISK6.")).toBe(true);
    expect(imported.caseId).toBe(state.caseId);
    expect(imported.playerName).toBe("Ada");
    expect(imported.caseNotes).toBe(state.caseNotes);
    expect(imported.discoveredEvidenceIds).toEqual(
      state.discoveredEvidenceIds
    );
    expect(imported.puzzles.lot_114.solvedAt).toBe(
      state.puzzles.lot_114.solvedAt
    );
    expect(imported.locale).toBe("pt-BR");
    expect(imported.insightsUnlocked).toEqual(["second_volume"]);
    expect(imported.ending).toBe("archive_self");
    expect(imported.flags.ending_archive_self).toBe(true);
    expect(imported.flags.ending_closure_seen).toBe(true);
    expect(imported.caseAnswers.sarah_intent?.lockedSlots).toEqual([
      "time",
      "intent",
    ]);
    expect(imported.collectedTokens).toEqual([
      "time-six-thirty",
      "intent-go-home",
    ]);
    expect(imported.optionalDiscoveries).toEqual(state.optionalDiscoveries);
    expect(imported.worldReactionsSeen).toEqual(state.worldReactionsSeen);
  });

  it("rejects a modified checksum", async () => {
    const code = await exportCaseCode(
      createInitialProgress(1_700_000_000_000, "case-checksum")
    );
    const tampered = `${code.slice(0, -1)}${code.endsWith("0") ? "1" : "0"}`;
    await expect(importCaseCode(tampered)).rejects.toThrow("checksum");
  });

  it("rejects a valid-checksum case code with malformed runtime data", async () => {
    const state = createInitialProgress(1_700_000_000_000, "invalid-runtime");
    (state as unknown as { readFileIds: unknown }).readFileIds = "not-an-array";
    await expect(importCaseCode(await exportCaseCode(state))).rejects.toThrow(
      "case data is malformed"
    );
  });

  it("rejects oversized portable case-code input before decoding", async () => {
    await expect(importCaseCode(`MISK6.${"A".repeat(200_000)}.000000000000`)).rejects.toThrow(
      "too large"
    );
  });

  it("rejects an encoded payload above the compressed-byte limit", async () => {
    const bytes = new Uint8Array(100_000).fill(65);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    await expect(importCaseCode(`MISK6.${btoa(binary)}.000000000000`)).rejects.toThrow(
      "too large"
    );
  });

  it("rejects a compressed payload whose decompressed content exceeds the limit", async () => {
    const state = createInitialProgress(1_700_000_000_000, "inflated-code");
    state.caseNotes = "x".repeat(1_000_000);
    await expect(exportCaseCode(state)).rejects.toThrow("too large");
  });

  it("serializes writes and rejects a revision older than the stored save", async () => {
    const storage = new Map<string, unknown>();
    const originalIndexedDb = globalThis.indexedDB;
    const originalLocalStorage = globalThis.localStorage;
    const first = createInitialProgress(1_700_000_000_000, "write-race");
    first.revision = 2;
    const second = { ...first, revision: 3, updatedAt: first.updatedAt + 1 };

    // A tiny asynchronous IndexedDB fake makes overlapping calls exercise the
    // persistence queue rather than relying on synchronous localStorage.
    (globalThis as { indexedDB: IDBFactory }).indexedDB = {
      open: () => {
        const request = {} as IDBOpenDBRequest;
        queueMicrotask(() => request.onerror?.(new Event("error")));
        return request;
      },
    } as unknown as IDBFactory;
    (globalThis as { localStorage: Storage }).localStorage = {
      getItem: (key) => (storage.has(key) ? JSON.stringify(storage.get(key)) : null),
      setItem: (key, value) => storage.set(key, JSON.parse(value)),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    } as Storage;

    await Promise.all([persistProgress(first), persistProgress(second)]);
    await expect(persistProgress(first)).rejects.toThrow("stale revision");

    (globalThis as { indexedDB: IDBFactory }).indexedDB = originalIndexedDb;
    (globalThis as { localStorage: Storage }).localStorage = originalLocalStorage;
  });

  it("migrates legacy identity, readings, ending and nearest milestone", () => {
    const migrated = migrateProgress({
      version: 2,
      playerName: "Miriam",
      firstSeenAt: 1_600_000_000_000,
      lastSeenAt: 1_600_000_010_000,
      readFileIds: ["diary", "miriam"],
      readEmailIds: ["email-delivery"],
      corruptionStage: 2,
      flags: { ending_shutdown: true },
    });

    expect(migrated).not.toBeNull();
    expect(migrated?.playerName).toBe("Miriam");
    expect(migrated?.readFileIds).toEqual(["diary", "miriam"]);
    expect(migrated?.readEmailIds).toEqual(["email-delivery"]);
    expect(migrated?.ending).toBe("shutdown");
    expect(migrated?.puzzles.lineage.solvedAt).not.toBeNull();
    expect(migrated?.puzzles.future_log.solvedAt).toBeNull();
  });

  it("migrates legacy flags for the new endings", () => {
    const leaveBlank = migrateProgress({
      version: 2,
      corruptionStage: 4,
      flags: { ending_leave_blank: true },
    });
    const archiveSelf = migrateProgress({
      version: 2,
      corruptionStage: 4,
      flags: { ending_archive_self: true },
    });

    expect(leaveBlank?.ending).toBe("leave_blank");
    expect(archiveSelf?.ending).toBe("archive_self");
  });

  it("migrates a v3 puzzle state into v6 campaign fields", () => {
    const legacy = {
      ...createInitialProgress(1_700_000_000_000, "legacy-v3"),
      version: 3,
    } as any;
    delete legacy.locale;
    delete legacy.insightsUnlocked;
    delete legacy.theoryAttempts;
    for (const puzzle of Object.values(legacy.puzzles) as any[]) {
      delete puzzle.nearMisses;
      delete puzzle.lastMeaningfulProgressAt;
      delete puzzle.hintHistory;
    }

    const migrated = migrateProgress(legacy);
    expect(migrated?.version).toBe(7);
    expect(migrated?.locale).toBe("en");
    expect(migrated?.puzzles.lot_114.nearMisses).toEqual({});
    expect(migrated?.puzzles.lot_114.hintHistory).toEqual([]);
    expect(migrated?.leadsUnlocked).toEqual([
      "sarah_last_day",
      "lot_provenance",
      "locked_room",
    ]);
    expect(migrated?.caseAnswers).toEqual({});
  });

  it("migrates a v5 casefile-compatible save into v7 without losing board state", () => {
    const legacy = {
      ...createInitialProgress(1_700_000_000_000, "legacy-v5-casefile"),
      version: 5,
      boardPositions: {
        diary: { x: 10, y: 20 },
        "finding:sarah_intent": { x: 900, y: 40 },
      },
      boardConnections: ["diary|finding:sarah_intent"],
      confirmedConnections: ["diary|miriam_1998"],
      insightsUnlocked: ["second_volume"],
      theoryAttempts: [
        {
          evidenceIds: ["diary", "miriam_1998"],
          attemptedAt: 1_700_000_000_100,
          insightId: null,
          targetInsightId: "miriam_break",
        },
      ],
    } as any;

    const migrated = migrateProgress(legacy);
    expect(migrated?.version).toBe(7);
    expect(migrated?.boardPositions["finding:sarah_intent"]).toEqual({
      x: 900,
      y: 40,
    });
    expect(migrated?.boardConnections).toEqual([
      "diary|finding:sarah_intent",
    ]);
    expect(migrated?.confirmedConnections).toEqual(["diary|miriam_1998"]);
    expect(migrated?.insightsUnlocked).toEqual(["second_volume"]);
    expect(migrated?.theoryAttempts[0].selectedClaimId).toBeUndefined();
  });

  it("fills v7 puzzle defaults when importing an older v5 puzzle set", () => {
    const legacy = {
      ...createInitialProgress(1_700_000_000_000, "legacy-v5-missing-puzzle"),
      version: 5,
    } as any;
    delete legacy.puzzles.index_name;

    const migrated = migrateProgress(legacy);
    expect(migrated?.version).toBe(7);
    expect(migrated?.puzzles.index_name).toMatchObject({
      attempts: 0,
      solvedAt: null,
    });
  });

  it("merges additive defaults into an older v6 snapshot", () => {
    const legacy = {
      ...createInitialProgress(1_700_000_000_000, "legacy-v6-additive"),
      version: 6,
      playerName: "Preserved Investigator",
    } as any;
    delete legacy.optionalDiscoveries;
    delete legacy.worldReactionsSeen;
    delete legacy.assetVariantsSeen;

    const migrated = migrateProgress(legacy);
    expect(migrated?.version).toBe(7);
    expect(migrated?.playerName).toBe("Preserved Investigator");
    expect(migrated?.optionalDiscoveries).toEqual([]);
    expect(migrated?.worldReactionsSeen).toEqual([]);
    expect(migrated?.assetVariantsSeen).toEqual([]);
  });

  it("grandfathers a pre-v7 save that had already reached chapter 3", () => {
    const legacy = {
      ...createInitialProgress(1_700_000_000_000, "legacy-chapter-three"),
      version: 6,
    } as any;
    legacy.puzzles.lot_114.solvedAt = 1;
    legacy.puzzles.palimpsest.solvedAt = 2;

    const migrated = migrateProgress(legacy);
    expect(migrated?.flags.correlation_tutorial_grandfathered).toBe(true);
  });

  it("continues to accept MISK3, MISK4 and MISK5 portable prefixes", async () => {
    const code = await exportCaseCode(
      createInitialProgress(1_700_000_000_000, "compatible-prefix")
    );
    const misk3 = await importCaseCode(code.replace(/^MISK6\./, "MISK3."));
    const misk4 = await importCaseCode(code.replace(/^MISK6\./, "MISK4."));
    const misk5 = await importCaseCode(code.replace(/^MISK6\./, "MISK5."));
    expect(misk3.caseId).toBe("compatible-prefix");
    expect(misk4.caseId).toBe("compatible-prefix");
    expect(misk5.caseId).toBe("compatible-prefix");
  });

  it("hydrates liveContact from saves that predate the field", () => {
    const base = createInitialProgress(1_700_000_000_000, "live-contact-legacy");

    const neverSeen = { ...base } as any;
    delete neverSeen.liveContact;
    expect(migrateProgress(neverSeen)?.liveContact).toEqual({
      status: "unseen",
      activeMs: 0,
    });

    const openedNoAnswer = {
      ...base,
      updatedAt: 1_700_000_045_000,
      playerChoices: [
        {
          choiceId: "sarah_live_seen",
          optionId: "opened",
          chosenAt: 1_700_000_000_000,
        },
      ],
    } as any;
    delete openedNoAnswer.liveContact;
    expect(migrateProgress(openedNoAnswer)?.liveContact).toEqual({
      status: "active",
      activeMs: 45_000,
    });

    const openedNoTimestamp = {
      ...base,
      playerChoices: [{ choiceId: "sarah_live_seen", optionId: "opened" }],
    } as any;
    delete openedNoTimestamp.liveContact;
    expect(migrateProgress(openedNoTimestamp)?.liveContact).toEqual({
      status: "active",
      activeMs: 0,
    });

    const answered = {
      ...base,
      playerChoices: [
        {
          choiceId: "sarah_live_seen",
          optionId: "opened",
          chosenAt: 1_700_000_000_000,
        },
        {
          choiceId: "sarah_live_question",
          optionId: "break",
          chosenAt: 1_700_000_030_000,
        },
      ],
    } as any;
    delete answered.liveContact;
    expect(migrateProgress(answered)?.liveContact).toEqual({
      status: "closed",
      activeMs: 120_000,
    });

    const expired = {
      ...base,
      playerChoices: [
        {
          choiceId: "sarah_live_seen",
          optionId: "opened",
          chosenAt: 1_700_000_000_000,
        },
        {
          choiceId: "sarah_live_question",
          optionId: "missed",
          chosenAt: 1_700_000_120_000,
        },
      ],
    } as any;
    delete expired.liveContact;
    expect(migrateProgress(expired)?.liveContact).toEqual({
      status: "closed",
      activeMs: 120_000,
    });

    // A save that already carries the field keeps it untouched.
    const carried = {
      ...base,
      liveContact: { status: "active", activeMs: 12_345 },
    };
    expect(migrateProgress(carried)?.liveContact).toEqual({
      status: "active",
      activeMs: 12_345,
    });

    // v1/v2 legacy saves never saw the contact.
    const ancient = migrateProgress({
      version: 2,
      corruptionStage: 2,
      flags: {},
    });
    expect(ancient?.liveContact).toEqual({ status: "unseen", activeMs: 0 });
  });

  it("round-trips liveContact through the MISK6 case code", async () => {
    const state = createInitialProgress(1_700_000_000_000, "live-contact-code");
    state.liveContact = { status: "closed", activeMs: 120_000 };
    const imported = await importCaseCode(await exportCaseCode(state));
    expect(imported.liveContact).toEqual({
      status: "closed",
      activeMs: 120_000,
    });
  });

  it("preserves an early radio-button finding as solved statement slots", () => {
    const legacy = {
      ...createInitialProgress(1_700_000_000_000, "legacy-finding"),
      version: 4,
      caseAnswers: {
        sarah_intent: {
          answerId: "planned_return",
          evidenceIds: ["chat_em_archive", "todo"],
          attempts: 1,
          solvedAt: 1_700_000_000_100,
        },
      },
    };
    delete (legacy as any).collectedTokens;

    const migrated = migrateProgress(legacy);
    expect(migrated?.version).toBe(7);
    expect(migrated?.collectedTokens).toEqual([]);
    expect(migrated?.caseAnswers.sarah_intent).toMatchObject({
      slots: {
        time: "time-six-thirty",
        intent: "intent-go-home",
      },
      lockedSlots: ["time", "intent"],
      solvedAt: 1_700_000_000_100,
    });
  });
});
