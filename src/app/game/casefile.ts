import {
  CASE_STATEMENTS,
  HYPOTHESES,
  LocalizedCopy,
  TOKENS,
  TokenDefinition,
} from "./campaign";
import {
  CaseQuestionId,
  HypothesisId,
  InsightId,
  LeadId,
} from "./progress";
import { THEORY_DEFINITIONS } from "./theories";

export type CasefileLens =
  | "organize"
  | "reconstruct"
  | "timeline"
  | "contradictions";

export type CasefileNodeKind =
  | "person"
  | "evidence"
  | "finding"
  | "correlation"
  | "hypothesis"
  | "event";

export interface CasefileNode {
  id: string;
  kind: CasefileNodeKind;
  title: LocalizedCopy;
  summary: LocalizedCopy;
  evidenceIds?: string[];
  leadId?: LeadId;
  claimId?: CasefileClaimId;
}

export type CasefileClaimId =
  | `finding:${CaseQuestionId}`
  | `correlation:${InsightId}`
  | `hypothesis:${HypothesisId}`;

export type CasefileClaimKind = "finding" | "correlation" | "hypothesis";

export interface CasefileClaim {
  id: CasefileClaimId;
  kind: CasefileClaimKind;
  title: LocalizedCopy;
  summary: LocalizedCopy;
  requiredEvidenceIds: string[];
  optionalEvidenceIds: string[];
  sourceId: CaseQuestionId | InsightId | HypothesisId;
  leadId?: LeadId;
}

export const HYPOTHESIS_EVIDENCE_REQUIREMENTS: Record<
  HypothesisId,
  string[]
> = {
  tom_forged_image: ["tom_last_message", "future_access_log"],
  sarah_fled: ["incident_report", "chat_em_archive"],
  innsmouth_theft: ["lot_114_order", "catalogue_lot_114"],
};

export const CASEFILE_FINDING_CLAIMS: CasefileClaim[] = CASE_STATEMENTS.map(
  (statement) => ({
    id: `finding:${statement.id}`,
    kind: "finding",
    title: statement.context,
    summary: statement.template,
    requiredEvidenceIds: statement.evidence.allOf ?? [],
    optionalEvidenceIds: statement.evidence.anyOf ?? [],
    sourceId: statement.id,
    leadId: statement.leadId,
  })
);

export const CASEFILE_CORRELATION_CLAIMS: CasefileClaim[] =
  THEORY_DEFINITIONS.map((theory) => ({
    id: `correlation:${theory.insightId}`,
    kind: "correlation",
    title: {
      en: theory.insightId
        .split("_")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
      "pt-BR": theory.insightId
        .split("_")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
    },
    summary: {
      en: "Retained correlation assembled from independent evidence.",
      "pt-BR": "Correlação retida a partir de evidências independentes.",
    },
    requiredEvidenceIds: theory.required,
    optionalEvidenceIds: theory.anyOf ?? [],
    sourceId: theory.insightId,
  }));

export const CASEFILE_HYPOTHESIS_CLAIMS: CasefileClaim[] = Object.entries(
  HYPOTHESES
).map(([hypothesisId, hypothesis]) => ({
  id: `hypothesis:${hypothesisId as HypothesisId}`,
  kind: "hypothesis",
  title: hypothesis.title,
  summary: hypothesis.truth,
  requiredEvidenceIds:
    HYPOTHESIS_EVIDENCE_REQUIREMENTS[hypothesisId as HypothesisId],
  optionalEvidenceIds: [],
  sourceId: hypothesisId as HypothesisId,
}));

export const CASEFILE_CLAIMS: CasefileClaim[] = [
  ...CASEFILE_FINDING_CLAIMS,
  ...CASEFILE_CORRELATION_CLAIMS,
  ...CASEFILE_HYPOTHESIS_CLAIMS,
];

export interface CasefileTimelineEvent {
  id: string;
  date: string;
  sort: number;
  evidenceId: string;
  title: LocalizedCopy;
}

export const CASEFILE_TIMELINE_EVENTS: CasefileTimelineEvent[] = [
  {
    id: "miriam-note",
    date: "1998-09-03",
    sort: 1,
    evidenceId: "miriam_1998",
    title: {
      en: "Miriam leaves the accession note unfinished.",
      "pt-BR": "Miriam deixa a nota de incorporação inacabada.",
    },
  },
  {
    id: "miriam-missing",
    date: "1998-09-14",
    sort: 2,
    evidenceId: "miriam_letter_1998",
    title: {
      en: "Miriam Bishop is reported missing.",
      "pt-BR": "Miriam Bishop é declarada desaparecida.",
    },
  },
  {
    id: "lot-ships",
    date: "2026-02-28",
    sort: 3,
    evidenceId: "lot_114_order",
    title: {
      en: "Graymoor ships Lot 114 to Sarah.",
      "pt-BR": "A Graymoor envia o Lote 114 para Sarah.",
    },
  },
  {
    id: "audio",
    date: "2026-03-14",
    sort: 4,
    evidenceId: "counting_audio",
    title: {
      en: "Sarah records the counting.",
      "pt-BR": "Sarah grava a contagem.",
    },
  },
  {
    id: "sarah-missing",
    date: "2026-03-16",
    sort: 5,
    evidenceId: "incident_report",
    title: {
      en: "Sarah disappears from the locked office.",
      "pt-BR": "Sarah desaparece da sala trancada.",
    },
  },
  {
    id: "office-photo",
    date: "2026-03-19",
    sort: 6,
    evidenceId: "office_after_photo",
    title: {
      en: "Campus Security photographs the empty office.",
      "pt-BR": "A Segurança fotografa o escritório vazio.",
    },
  },
  {
    id: "tom-image",
    date: "2026-03-23",
    sort: 7,
    evidenceId: "tom_last_message",
    title: {
      en: "Tom mounts the forensic image.",
      "pt-BR": "Tom monta a imagem forense.",
    },
  },
  {
    id: "future-log",
    date: "{TOMORROW}",
    sort: 8,
    evidenceId: "future_access_log",
    title: {
      en: "The image records the observer's actions.",
      "pt-BR": "A imagem registra as ações do observador.",
    },
  },
];

export const tokensForEvidence = (evidenceId: string): TokenDefinition[] =>
  TOKENS.filter((token) => token.sourceEvidenceId === evidenceId);

export const collectedTokensForEvidence = (
  evidenceId: string,
  collectedTokenIds: string[]
): TokenDefinition[] => {
  const collected = new Set(collectedTokenIds);
  return tokensForEvidence(evidenceId).filter((token) =>
    collected.has(token.id)
  );
};

export const evidenceIdsForClaim = (claim: CasefileClaim): string[] =>
  Array.from(
    new Set([...claim.requiredEvidenceIds, ...claim.optionalEvidenceIds])
  );

export const claimIdForFinding = (
  questionId: CaseQuestionId
): CasefileClaimId => `finding:${questionId}`;

export const findingIdFromClaim = (
  claimId: CasefileClaimId
): CaseQuestionId | null =>
  claimId.startsWith("finding:")
    ? (claimId.slice("finding:".length) as CaseQuestionId)
    : null;
