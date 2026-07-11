import { LocalizedCopy } from "./campaign";
import { ChapterId, InsightId } from "./progress";

export type CorrelationEvidenceKind =
  | "person"
  | "document"
  | "record"
  | "email"
  | "conversation"
  | "audio";

export interface TheoryDefinition {
  insightId: InsightId;
  required: string[];
  anyOf?: string[];
  availableAt: ChapterId;
  hint: LocalizedCopy;
  /** Broad evidence kinds used only after repeated failed attempts. */
  missingKinds: CorrelationEvidenceKind[];
}

export const THEORY_DEFINITIONS: TheoryDefinition[] = [
  {
    insightId: "second_volume",
    required: ["miriam_1998", "diary", "lot_114_order"],
    availableAt: "chapter_2",
    hint: {
      en: "Follow one volume across the old accession trail and the new shipment.",
      "pt-BR": "Siga um mesmo volume entre a incorporação antiga e o envio novo.",
    },
    missingKinds: ["document", "document", "email"],
  },
  {
    insightId: "miriam_break",
    required: ["miriam_1998", "miriam_letter_1998"],
    anyOf: ["catalogue_lot_114", "margin_ciphertext", "miriam_notebook"],
    availableAt: "chapter_3",
    hint: {
      en: "Compare what Miriam filed with what she refused to leave intact.",
      "pt-BR": "Compare o que Miriam arquivou com o que ela se recusou a deixar inteiro.",
    },
    missingKinds: ["document", "document", "record"],
  },
  {
    insightId: "institutional_suppression",
    required: ["incident_report", "maintenance_record"],
    anyOf: ["whitfield_memo", "coastline_archive"],
    availableAt: "chapter_4",
    hint: {
      en: "Read the institution's official account beside what its systems quietly preserve.",
      "pt-BR": "Leia a versão oficial da instituição ao lado do que os sistemas dela preservam em silêncio.",
    },
    missingKinds: ["document", "document", "record"],
  },
  {
    insightId: "cataloguer_lineage",
    required: ["person-miriam", "person-sarah", "lineage_pattern"],
    availableAt: "chapter_5",
    hint: {
      en: "Two cataloguers appear in the same field, decades apart.",
      "pt-BR": "Duas catalogadoras aparecem no mesmo campo, separadas por décadas.",
    },
    missingKinds: ["person", "person", "record"],
  },
  {
    insightId: "observer_relay",
    required: ["person-sarah", "person-tom"],
    anyOf: ["future_access_log", "sarah_live_email", "split_record"],
    availableAt: "chapter_5",
    hint: {
      en: "The relay changes hands; identify who was replaced and who observes now.",
      "pt-BR": "O relé troca de mãos; identifique quem foi substituído e quem observa agora.",
    },
    missingKinds: ["person", "person", "record"],
  },
  {
    insightId: "self_index",
    required: ["future_access_log", "index_help"],
    anyOf: ["containment_utility", "record_2014"],
    availableAt: "chapter_6",
    hint: {
      en: "The archive's future log may describe an observer that is not alive.",
      "pt-BR": "O log futuro do arquivo talvez descreva um observador que não está vivo.",
    },
    missingKinds: ["record", "document", "document"],
  },
];

export interface TheoryEvaluation {
  insightId: InsightId | null;
  matchedCount: number;
  requiredCount: number;
  missingKinds: CorrelationEvidenceKind[];
}

const theoryFor = (id: InsightId) =>
  THEORY_DEFINITIONS.find((candidate) => candidate.insightId === id);

export const evaluateTheory = (evidenceIds: string[]): InsightId | null => {
  const selected = new Set(evidenceIds);
  const match = THEORY_DEFINITIONS.find(
    (theory) =>
      theory.required.every((id) => selected.has(id)) &&
      (!theory.anyOf || theory.anyOf.some((id) => selected.has(id)))
  );
  return match?.insightId ?? null;
};

/** Evaluates the selected thread without exposing the underlying record ids. */
export const evaluateTheoryAttempt = (
  insightId: InsightId,
  evidenceIds: string[]
): TheoryEvaluation => {
  const theory = theoryFor(insightId);
  if (!theory) {
    return { insightId: null, matchedCount: 0, requiredCount: 0, missingKinds: [] };
  }
  const selected = new Set(evidenceIds);
  const requiredIds = [...theory.required];
  const anyOfMatch = theory.anyOf?.some((id) => selected.has(id)) ?? true;
  const matchedRequired = requiredIds.filter((id) => selected.has(id)).length;
  const matchedCount = matchedRequired + (anyOfMatch && theory.anyOf ? 1 : 0);
  const requiredCount = requiredIds.length + (theory.anyOf ? 1 : 0);
  const exact = matchedCount === requiredCount;
  const missingKinds = theory.missingKinds.filter((_, index) => {
    if (index < theory.required.length) return !selected.has(theory.required[index]);
    return !anyOfMatch;
  });
  return {
    insightId: exact ? insightId : null,
    matchedCount,
    requiredCount,
    missingKinds,
  };
};

const pairKey = (a: string, b: string): string => [a, b].sort().join("|");

/**
 * The board pins connected by a confirmed theory — its required cards plus
 * whichever anyOf member the player actually had pinned. Used to draw the
 * "the case file agrees" thread, distinct from a player's own free-form guess.
 */
export const theoryConnectionKeys = (
  insightId: InsightId,
  evidenceIds: string[]
): string[] => {
  const theory = theoryFor(insightId);
  if (!theory) return [];
  const selected = new Set(evidenceIds);
  const anyOfMatch = theory.anyOf?.filter((id) => selected.has(id)) ?? [];
  const ids = [...theory.required, ...anyOfMatch];
  const keys: string[] = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      keys.push(pairKey(ids[i], ids[j]));
    }
  }
  return keys;
};
