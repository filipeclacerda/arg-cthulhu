import { describe, expect, it } from "vitest";
import { displayedEvidenceIds } from "./caseReconstruction";

describe("Case Reconstruction evidence selection", () => {
  it("shows the current selection after an unsuccessful saved attempt", () => {
    expect(
      displayedEvidenceIds(false, [], ["police_report", "office_after"])
    ).toEqual(["police_report", "office_after"]);
  });

  it("freezes the retained evidence once the finding is solved", () => {
    expect(
      displayedEvidenceIds(
        true,
        ["police_report", "office_after"],
        ["unrelated_record"]
      )
    ).toEqual(["police_report", "office_after"]);
  });
});
