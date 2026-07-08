import { describe, expect, it } from "vitest";
import { CASE_STATEMENTS, TOKENS } from "./campaign";
import {
  CASEFILE_CORRELATION_CLAIMS,
  CASEFILE_FINDING_CLAIMS,
  CASEFILE_HYPOTHESIS_CLAIMS,
  HYPOTHESIS_EVIDENCE_REQUIREMENTS,
  collectedTokensForEvidence,
  evidenceIdsForClaim,
  tokensForEvidence,
} from "./casefile";
import { THEORY_DEFINITIONS } from "./theories";

describe("casefile graph", () => {
  it("exposes every reconstruction finding as a board claim", () => {
    expect(CASEFILE_FINDING_CLAIMS.map((claim) => claim.id)).toEqual(
      CASE_STATEMENTS.map((statement) => `finding:${statement.id}`)
    );
  });

  it("exposes every optional theory as a retained-correlation claim", () => {
    expect(CASEFILE_CORRELATION_CLAIMS.map((claim) => claim.id)).toEqual(
      THEORY_DEFINITIONS.map((theory) => `correlation:${theory.insightId}`)
    );
  });

  it("keeps hypothesis refutation evidence explicit and two-source", () => {
    expect(CASEFILE_HYPOTHESIS_CLAIMS).toHaveLength(3);
    for (const claim of CASEFILE_HYPOTHESIS_CLAIMS) {
      expect(evidenceIdsForClaim(claim).length).toBeGreaterThanOrEqual(2);
      expect(HYPOTHESIS_EVIDENCE_REQUIREMENTS[claim.sourceId as keyof typeof HYPOTHESIS_EVIDENCE_REQUIREMENTS]).toEqual(
        claim.requiredEvidenceIds
      );
    }
  });

  it("maps extracted fact chips back to their source evidence", () => {
    const lectureTokens = tokensForEvidence("lecture_draft").map(
      (token) => token.id
    );
    expect(lectureTokens).toContain("time-six-thirty");
    expect(lectureTokens).toContain("intent-go-home");

    const collected = collectedTokensForEvidence("lecture_draft", [
      "time-six-thirty",
      "cause-clerical-error",
    ]);
    expect(collected.map((token) => token.id)).toEqual(["time-six-thirty"]);
    expect(TOKENS.every((token) => Boolean(token.sourceEvidenceId))).toBe(true);
  });
});
