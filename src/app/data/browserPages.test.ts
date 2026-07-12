import { describe, expect, it } from "vitest";
import { BROWSER_PAGES, browserPageFromVisitedId, canRevealCoastPage } from "./browserPages";
import { RECYCLE_ENTRIES } from "./recycleBin";
import { files } from "./filesystem";

describe("recovered web registry", () => {
  it("keeps new atmospheric pages behind their intended investigation gates", () => {
    expect(BROWSER_PAGES.find((page) => page.id === "compat-gateway")?.unlock).toEqual({ type: "puzzleSolved", puzzleId: "lot_114" });
    expect(BROWSER_PAGES.find((page) => page.id === "hydrography")?.unlock).toEqual({ type: "puzzleSolved", puzzleId: "margin_cipher" });
    for (const id of ["danforth", "expedition", "families", "tom-guestbook"] as const) {
      expect(BROWSER_PAGES.find((page) => page.id === id)?.unlock).toEqual({ type: "puzzleSolved", puzzleId: "counting_audio" });
    }
  });

  it("maps persisted page visits back to an addressable page for History", () => {
    expect(browserPageFromVisitedId("arkham-route-7")?.id).toBe("route-7");
    expect(browserPageFromVisitedId("graymoor-return-gm-114-0310")?.id).toBe(
      "graymoor-return"
    );
    expect(browserPageFromVisitedId("personnel-14-ev")?.id).toBe("eleanor");
  });

  it("never reveals the coast search before counting.wav is solved", () => {
    expect(canRevealCoastPage(false)).toBe(false);
    expect(canRevealCoastPage(true)).toBe(true);
  });
});

describe("recycle bin registry", () => {
  it("contains the eight staged additions and gates deep lore late", () => {
    expect(RECYCLE_ENTRIES).toHaveLength(11);
    expect(RECYCLE_ENTRIES.find((entry) => entry.id === "danforth")?.unlock).toEqual({ type: "puzzleSolved", puzzleId: "counting_audio" });
    expect(RECYCLE_ENTRIES.find((entry) => entry.id === "empty")?.target).toEqual({ type: "file", fileId: "empty_tmp" });
    expect(RECYCLE_ENTRIES.find((entry) => entry.id === "gull-0310")?.unlock).toMatchObject({ type: "allOf" });
  });

  it("materializes the recovered fallback and Miriam's broken shortcut", () => {
    const fallback = files.find((file) => file.id === "sarah_break_cache");
    expect(fallback?.unlock).toEqual({
      type: "flag",
      flag: "sarah_break_cache_materialized",
    });
    expect(fallback?.setsFlagOnOpen).toBe("break_protocol_recovered");
    expect(files.find((file) => file.id === "miriam_shortcut")?.name).toBe(
      "MIRIAM.LNK"
    );
  });
});
