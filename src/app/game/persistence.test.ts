import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  exportCaseCode,
  importCaseCode,
  migrateProgress,
} from "./persistence";

describe("save v6", () => {
  it("round-trips a portable MISK6 case code with campaign state", async () => {
    const state = createInitialProgress(1_700_000_000_000, "case-round-trip");
    state.playerName = "Ada";
    state.caseNotes = "Lot 114; count names, not days.";
    state.discoveredEvidenceIds = ["miriam_1998", "lot_114_scan"];
    state.puzzles.lot_114.solvedAt = 1_700_000_000_500;
    state.locale = "pt-BR";
    state.insightsUnlocked = ["second_volume"];
    state.collectedTokens = ["time-six-thirty", "intent-go-home"];
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
    state.optionalDiscoveries = ["dad_recipe"];

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
    expect(imported.caseAnswers.sarah_intent?.lockedSlots).toEqual([
      "time",
      "intent",
    ]);
    expect(imported.collectedTokens).toEqual([
      "time-six-thirty",
      "intent-go-home",
    ]);
    expect(imported.optionalDiscoveries).toEqual(["dad_recipe"]);
  });

  it("rejects a modified checksum", async () => {
    const code = await exportCaseCode(
      createInitialProgress(1_700_000_000_000, "case-checksum")
    );
    const tampered = `${code.slice(0, -1)}${code.endsWith("0") ? "1" : "0"}`;
    await expect(importCaseCode(tampered)).rejects.toThrow("checksum");
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
    expect(migrated?.version).toBe(6);
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

  it("migrates a v5 casefile-compatible save into v6 without losing board state", () => {
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
    } as any;

    const migrated = migrateProgress(legacy);
    expect(migrated?.version).toBe(6);
    expect(migrated?.boardPositions["finding:sarah_intent"]).toEqual({
      x: 900,
      y: 40,
    });
    expect(migrated?.boardConnections).toEqual([
      "diary|finding:sarah_intent",
    ]);
    expect(migrated?.confirmedConnections).toEqual(["diary|miriam_1998"]);
    expect(migrated?.insightsUnlocked).toEqual(["second_volume"]);
  });

  it("fills v6 puzzle defaults when importing an older v5 puzzle set", () => {
    const legacy = {
      ...createInitialProgress(1_700_000_000_000, "legacy-v5-missing-puzzle"),
      version: 5,
    } as any;
    delete legacy.puzzles.index_name;

    const migrated = migrateProgress(legacy);
    expect(migrated?.version).toBe(6);
    expect(migrated?.puzzles.index_name).toMatchObject({
      attempts: 0,
      solvedAt: null,
    });
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
    expect(migrated?.version).toBe(6);
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
