import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import {
  exportCaseCode,
  importCaseCode,
  migrateProgress,
} from "./persistence";

describe("save v3", () => {
  it("round-trips a portable MISK3 case code with notes and identity", async () => {
    const state = createInitialProgress(1_700_000_000_000, "case-round-trip");
    state.playerName = "Ada";
    state.caseNotes = "Lot 114; count names, not days.";
    state.discoveredEvidenceIds = ["miriam_1998", "lot_114_scan"];
    state.puzzles.lot_114.solvedAt = 1_700_000_000_500;

    const code = await exportCaseCode(state);
    const imported = await importCaseCode(code);

    expect(code.startsWith("MISK3.")).toBe(true);
    expect(imported.caseId).toBe(state.caseId);
    expect(imported.playerName).toBe("Ada");
    expect(imported.caseNotes).toBe(state.caseNotes);
    expect(imported.discoveredEvidenceIds).toEqual(
      state.discoveredEvidenceIds
    );
    expect(imported.puzzles.lot_114.solvedAt).toBe(
      state.puzzles.lot_114.solvedAt
    );
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
});
