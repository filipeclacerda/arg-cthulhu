import { describe, expect, it } from "vitest";
import { CASE_STATEMENTS, TOKENS } from "./campaign";
import { EVIDENCE_CARDS } from "../data/evidenceBoard";
import {
  CASEFILE_CORRELATION_CLAIMS,
  CASEFILE_FINDING_CLAIMS,
  CASEFILE_HYPOTHESIS_CLAIMS,
  CASEFILE_TIMELINE_EVENTS,
  HYPOTHESIS_EVIDENCE_REQUIREMENTS,
  TOKEN_TYPE_LABEL_KEYS,
  displayedEvidenceIds,
  collectedTokensForEvidence,
  evidenceIdsForClaim,
  tokensForEvidence,
} from "./casefile";
import type { TokenType } from "./progress";
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

  it("preserves displayed evidence when a finding is solved", () => {
    expect(
      displayedEvidenceIds(
        true,
        ["incident_report", "office_after_photo"],
        ["maintenance_record", "facility_log"]
      )
    ).toEqual(["incident_report", "office_after_photo"]);
  });

  it("uses pending evidence while the finding is still open", () => {
    expect(
      displayedEvidenceIds(false, ["incident_report"], ["miriam_1998", "tom_last_message"])
    ).toEqual(["miriam_1998", "tom_last_message"]);
  });

  it("keeps timeline events sorted by declared order", () => {
    const sortValues = CASEFILE_TIMELINE_EVENTS.map((event) => event.sort);
    expect(sortValues).toEqual([...sortValues].sort((a, b) => a - b));
    expect(new Set(sortValues).size).toBe(sortValues.length);
    expect(
      CASEFILE_TIMELINE_EVENTS.every((event) =>
        Boolean(EVIDENCE_CARDS[event.evidenceId])
      )
    ).toBe(true);
  });

  it("keeps refutation and token label maps exhaustive", () => {
    for (const ids of Object.values(HYPOTHESIS_EVIDENCE_REQUIREMENTS)) {
      expect(ids.every((id) => Boolean(EVIDENCE_CARDS[id]))).toBe(true);
    }
    const tokenTypes: TokenType[] = [
      "person",
      "place",
      "date",
      "year",
      "time",
      "intent",
      "object",
      "status",
      "cause",
      "family",
      "detail",
    ];
    expect(Object.keys(TOKEN_TYPE_LABEL_KEYS).sort()).toEqual(
      tokenTypes.sort()
    );
  });
});
