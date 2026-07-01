import { InsightId } from "./progress";

export interface TheoryDefinition {
  insightId: InsightId;
  required: string[];
  anyOf?: string[];
}

export const THEORY_DEFINITIONS: TheoryDefinition[] = [
  {
    insightId: "second_volume",
    required: ["miriam_1998", "diary", "lot_114_order"],
  },
  {
    insightId: "cataloguer_lineage",
    required: ["person-miriam", "person-sarah", "lineage_pattern"],
  },
  {
    insightId: "observer_relay",
    required: ["person-sarah", "person-tom"],
    anyOf: ["future_access_log", "sarah_live_email"],
  },
  {
    insightId: "institutional_suppression",
    required: ["incident_report", "maintenance_record"],
    anyOf: ["whitfield_memo", "coastline_archive"],
  },
  {
    insightId: "miriam_break",
    required: ["miriam_1998", "miriam_letter_1998"],
    anyOf: ["catalogue_lot_114", "margin_ciphertext", "miriam_notebook"],
  },
  {
    insightId: "self_index",
    required: ["future_access_log", "index_help"],
    anyOf: ["containment_utility", "record_2014"],
  },
];

export const evaluateTheory = (evidenceIds: string[]): InsightId | null => {
  const selected = new Set(evidenceIds);
  const match = THEORY_DEFINITIONS.find(
    (theory) =>
      theory.required.every((id) => selected.has(id)) &&
      (!theory.anyOf || theory.anyOf.some((id) => selected.has(id)))
  );
  return match?.insightId ?? null;
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
  const theory = THEORY_DEFINITIONS.find((candidate) => candidate.insightId === insightId);
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
