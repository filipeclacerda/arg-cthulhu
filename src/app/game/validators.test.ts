import { describe, expect, it } from "vitest";
import {
  validateIndexCommand,
  validateLineageYear,
  validateLotQuery,
} from "./validators";

describe("bilingual puzzle validators", () => {
  it("accepts catalogue terms in either language and arbitrary order", () => {
    expect(
      validateLotQuery("Volume II / Lote 114 / 1998 / Whateley").accepted
    ).toBe(true);
    expect(
      validateLotQuery("WHATELEY 114 1998 VOL 2").accepted
    ).toBe(true);
    expect(validateLotQuery("MS-WHA-1998-114/II").accepted).toBe(true);
  });

  it("recognizes close lineage years without accepting them", () => {
    expect(validateLineageYear("2025")).toEqual({
      accepted: false,
      nearMiss: "lineage_near_year",
    });
    expect(validateLineageYear("2026").accepted).toBe(true);
  });

  it("distinguishes missing references and chronological order", () => {
    expect(
      validateIndexCommand("INDEX /JOIN E7-A1-C4-B9", ["E7", "A1"]).error
    ).toBe("missing_references");
    expect(
      validateIndexCommand("INDEX /JOIN A1-E7-C4-B9", [
        "E7",
        "A1",
        "C4",
        "B9",
      ]).error
    ).toBe("wrong_order");
  });
});

