import { describe, expect, it } from "vitest";
import { CASE_STATEMENTS, TOKENS } from "./campaign";
import { EVIDENCE_CARDS } from "../data/evidenceBoard";
import {
  CASEFILE_CORRELATION_CLAIMS,
  CASEFILE_FINDING_CLAIMS,
  CASEFILE_HYPOTHESIS_CLAIMS,
  CASEFILE_RELEVANT_EVIDENCE_IDS,
  CASEFILE_TIMELINE_EVENTS,
  HYPOTHESIS_EVIDENCE_REQUIREMENTS,
  TOKEN_TYPE_LABEL_KEYS,
  displayedEvidenceIds,
  collectedTokensForEvidence,
  evidenceIdsForClaim,
  evidenceUsageById,
  evaluateHypothesisRefutation,
  exclusiveEvidenceByClaim,
  isCasefileRelevantEvidence,
  retainedFindingsFromAnswers,
  sharedEvidenceIds,
  tokensForEvidence,
} from "./casefile";
import type { CaseAnswer, CaseQuestionId, TokenType } from "./progress";
import { THEORY_DEFINITIONS } from "./theories";

const solvedAnswer = (
  evidenceIds: string[],
  solvedAt: number | null = 1000
): CaseAnswer => ({
  slots: {},
  lockedSlots: [],
  evidenceIds,
  attempts: 1,
  nearMisses: {},
  solvedAt,
});

describe("casefile graph", () => {
  it("exposes every reconstruction finding as a board claim", () => {
    expect(CASEFILE_FINDING_CLAIMS.map((claim) => claim.id)).toEqual(
      CASE_STATEMENTS.map((statement) => `finding:${statement.id}`)
    );
  });

  it("keeps every deduction in the internal correlation registry", () => {
    expect(CASEFILE_CORRELATION_CLAIMS.map((claim) => claim.id)).toEqual(
      THEORY_DEFINITIONS.map((theory) => `correlation:${theory.insightId}`)
    );
  });

  it("authors localized theses, feedback and two help levels for every deduction", () => {
    for (const theory of THEORY_DEFINITIONS) {
      expect(theory.question.en).toBeTruthy();
      expect(theory.question["pt-BR"]).toBeTruthy();
      expect(theory.claims).toHaveLength(3);
      expect(theory.claims.some((claim) => claim.id === theory.correctClaimId)).toBe(true);
      expect(theory.failureCopy.en).toBeTruthy();
      expect(theory.failureCopy["pt-BR"]).toBeTruthy();
      expect(theory.guidance.level1.en).toBeTruthy();
      expect(theory.guidance.level1["pt-BR"]).toBeTruthy();
      expect(theory.guidance.level2.evidenceId).toBeTruthy();
    }
  });

  it("keeps hypothesis refutation evidence explicit and two-source", () => {
    expect(CASEFILE_HYPOTHESIS_CLAIMS).toHaveLength(4);
    for (const claim of CASEFILE_HYPOTHESIS_CLAIMS) {
      expect(evidenceIdsForClaim(claim).length).toBeGreaterThanOrEqual(2);
      expect(HYPOTHESIS_EVIDENCE_REQUIREMENTS[claim.sourceId as keyof typeof HYPOTHESIS_EVIDENCE_REQUIREMENTS]).toEqual(
        claim.requiredEvidenceIds
      );
    }
  });

  it("evaluates player-selected refutations without exposing solution ids", () => {
    const mismatch = evaluateHypothesisRefutation("tom_forged_image", [
      "tom_last_message",
    ]);
    expect(mismatch).toEqual({
      hypothesisId: "tom_forged_image",
      accepted: false,
      reason: "evidence_mismatch",
      verdict: null,
      selectedCount: 1,
      requiredCount: 2,
    });
    expect(mismatch).not.toHaveProperty("requiredEvidenceIds");
    expect(mismatch).not.toHaveProperty("missingEvidenceIds");

    expect(
      evaluateHypothesisRefutation("sarah_chose_observer", [
        "split_record",
        "read_receipts",
        "hash_manifest",
      ])
    ).toMatchObject({ accepted: true, verdict: "inconclusive" });

    expect(
      evaluateHypothesisRefutation("tom_forged_image", [
        "tom_last_message",
        "future_access_log",
        "incident_report",
      ])
    ).toMatchObject({ accepted: false, reason: "evidence_mismatch" });
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

  it("retains only solved findings and deduplicates their evidence", () => {
    const retained = retainedFindingsFromAnswers({
      sarah_intent: solvedAnswer([
        "lecture_draft",
        "lecture_draft",
        "dad_email",
      ]),
      locked_room_source: solvedAnswer(["incident_report"], null),
    });

    expect(retained).toEqual([
      {
        claimId: "finding:sarah_intent",
        questionId: "sarah_intent",
        evidenceIds: ["lecture_draft", "dad_email"],
      },
    ]);
  });

  it("reports evidence usage by retained finding claim", () => {
    const usage = evidenceUsageById(
      retainedFindingsFromAnswers({
        sarah_intent: solvedAnswer(["lecture_draft", "dad_email"]),
        volume_return: solvedAnswer(["miriam_1998", "lecture_draft"]),
      })
    );

    expect(usage).toEqual({
      lecture_draft: ["finding:sarah_intent", "finding:volume_return"],
      dad_email: ["finding:sarah_intent"],
      miriam_1998: ["finding:volume_return"],
    });
  });

  it("keeps exclusive evidence in its deck and shared evidence outside decks", () => {
    const retained = retainedFindingsFromAnswers({
      sarah_intent: solvedAnswer(["lecture_draft", "dad_email"]),
      volume_return: solvedAnswer(["miriam_1998", "lecture_draft"]),
    });
    const usage = evidenceUsageById(retained);

    expect(exclusiveEvidenceByClaim(retained, usage)).toEqual({
      "finding:sarah_intent": ["dad_email"],
      "finding:volume_return": ["miriam_1998"],
    });
    expect(sharedEvidenceIds(usage)).toEqual(["lecture_draft"]);
  });

  it("ignores unsolved findings when deriving deck evidence", () => {
    const retained = retainedFindingsFromAnswers({
      sarah_intent: solvedAnswer(["lecture_draft"]),
      volume_return: solvedAnswer(["miriam_1998"], null),
    } satisfies Partial<Record<CaseQuestionId, CaseAnswer>>);

    expect(retained.map((finding) => finding.claimId)).toEqual([
      "finding:sarah_intent",
    ]);
    expect(evidenceUsageById(retained)).toEqual({
      lecture_draft: ["finding:sarah_intent"],
    });
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

  it("keeps the board limited to actionable evidence and deliberate red herrings", () => {
    const actionableIds = new Set([
      ...CASEFILE_FINDING_CLAIMS.flatMap(evidenceIdsForClaim),
      ...CASEFILE_CORRELATION_CLAIMS.flatMap(evidenceIdsForClaim),
      ...CASEFILE_HYPOTHESIS_CLAIMS.flatMap(evidenceIdsForClaim),
      ...CASEFILE_TIMELINE_EVENTS.map((event) => event.evidenceId),
    ]);

    expect(CASEFILE_RELEVANT_EVIDENCE_IDS).toEqual(actionableIds);
    expect(isCasefileRelevantEvidence("tom_last_message")).toBe(true);
    expect(isCasefileRelevantEvidence("chat_em_archive")).toBe(true);
    expect(isCasefileRelevantEvidence("solitaire_save")).toBe(false);
    expect(isCasefileRelevantEvidence("photo_sarah_office")).toBe(false);
    expect(isCasefileRelevantEvidence("person-em")).toBe(false);
  });
});
