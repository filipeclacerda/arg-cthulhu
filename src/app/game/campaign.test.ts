import { describe, expect, it } from "vitest";
import {
  CASE_QUESTIONS,
  validateCampaignGraph,
  validateCaseAnswer,
} from "./campaign";

describe("campaign graph", () => {
  it("keeps every mandatory conclusion backed by at least two sources", () => {
    expect(validateCampaignGraph()).toEqual([]);
    expect(CASE_QUESTIONS).toHaveLength(6);
  });

  it("accepts bilingual-independent evidence IDs and the intended conclusion", () => {
    expect(
      validateCaseAnswer("locked_room_source", "workstation_source", [
        "incident_report",
        "maintenance_record",
      ])
    ).toEqual({ accepted: true, reason: "accepted" });
  });

  it("distinguishes a wrong conclusion from insufficient evidence", () => {
    expect(
      validateCaseAnswer("volume_return", "bookseller_error", [
        "miriam_1998",
        "lot_114_order",
      ]).reason
    ).toBe("wrong_conclusion");
    expect(
      validateCaseAnswer("volume_return", "deliberate_return", [
        "miriam_1998",
      ]).reason
    ).toBe("not_enough_evidence");
  });
});
