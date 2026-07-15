import { describe, expect, it } from "vitest";
import {
  THEORY_DEFINITIONS,
  evaluateTheoryAttempt,
  isTheoryActionable,
  theoryFor,
} from "./theories";

describe("deductions", () => {
  const miriam = theoryFor("miriam_break")!;
  const exact = ["miriam_1998", "miriam_letter_1998", "miriam_notebook"];

  it("accepts the correct thesis with the exact required set", () => {
    expect(
      evaluateTheoryAttempt("miriam_break", miriam.correctClaimId, exact)
    ).toMatchObject({
      insightId: "miriam_break",
      claimCorrect: true,
      evidenceExact: true,
    });
  });

  it("rejects a wrong thesis without revealing whether the records were right", () => {
    expect(
      evaluateTheoryAttempt("miriam_break", "miriam_corruption", exact)
    ).toMatchObject({
      insightId: null,
      claimCorrect: false,
      evidenceExact: true,
    });
  });

  it("rejects missing and irrelevant extra records", () => {
    expect(
      evaluateTheoryAttempt("miriam_break", miriam.correctClaimId, exact.slice(0, 2))
        .insightId
    ).toBeNull();
    expect(
      evaluateTheoryAttempt("miriam_break", miriam.correctClaimId, [
        ...exact,
        "person-sarah",
      ]).insightId
    ).toBeNull();
  });

  it("accepts exactly one authorized anyOf alternative and rejects selecting two", () => {
    for (const alternative of miriam.anyOf ?? []) {
      expect(
        evaluateTheoryAttempt("miriam_break", miriam.correctClaimId, [
          ...miriam.required,
          alternative,
        ]).insightId
      ).toBe("miriam_break");
    }
    expect(
      evaluateTheoryAttempt("miriam_break", miriam.correctClaimId, [
        ...miriam.required,
        miriam.anyOf![0],
        miriam.anyOf![1],
      ]).insightId
    ).toBeNull();
  });

  it("only exposes a deduction after chapter, reconstruction and evidence gates", () => {
    const ready = {
      currentChapter: "chapter_3" as const,
      completedFindingIds: ["volume_return" as const],
      discoveredEvidenceIds: exact,
      retainedInsightIds: [],
    };
    expect(isTheoryActionable(miriam, ready)).toBe(true);
    expect(
      isTheoryActionable(miriam, {
        ...ready,
        completedFindingIds: [],
      })
    ).toBe(false);
    expect(
      isTheoryActionable(miriam, {
        ...ready,
        discoveredEvidenceIds: miriam.required,
      })
    ).toBe(false);
    expect(
      isTheoryActionable(miriam, {
        ...ready,
        currentChapter: "chapter_2",
      })
    ).toBe(false);
  });

  it("keeps retained deductions visible for legacy saves even without new gates", () => {
    expect(
      isTheoryActionable(miriam, {
        currentChapter: "chapter_1",
        completedFindingIds: [],
        discoveredEvidenceIds: [],
        retainedInsightIds: ["miriam_break"],
      })
    ).toBe(true);
  });

  it("removes the duplicated Volume II task and varies correct thesis positions", () => {
    expect(THEORY_DEFINITIONS.map((theory) => theory.insightId)).not.toContain(
      "second_volume"
    );
    const positions = THEORY_DEFINITIONS.map((theory) =>
      theory.claims.findIndex((claim) => claim.id === theory.correctClaimId)
    );
    expect(new Set(positions).size).toBeGreaterThan(1);
  });
});
