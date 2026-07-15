import type { LocalizedCopy } from "./campaign";
import type { CaseQuestionId, ChapterId, InsightId } from "./progress";

export type CorrelationEvidenceKind =
  | "person"
  | "document"
  | "record"
  | "email"
  | "conversation"
  | "audio";

export interface TheoryClaim {
  id: string;
  copy: LocalizedCopy;
}

export interface TheoryDefinition {
  insightId: InsightId;
  required: string[];
  anyOf?: string[];
  availableAt: ChapterId;
  requiredFindingIds: CaseQuestionId[];
  question: LocalizedCopy;
  claims: TheoryClaim[];
  correctClaimId: string;
  failureCopy: LocalizedCopy;
  guidance: {
    level1: LocalizedCopy;
    level2: {
      evidenceId: string;
      copy: LocalizedCopy;
    };
  };
  /** Internal diagnostic categories. Never used to reveal the answer in the UI. */
  missingKinds: CorrelationEvidenceKind[];
}

export const THEORY_DEFINITIONS: TheoryDefinition[] = [
  {
    insightId: "miriam_break",
    required: ["miriam_1998", "miriam_letter_1998"],
    anyOf: ["catalogue_lot_114", "margin_ciphertext", "miriam_notebook"],
    availableAt: "chapter_3",
    requiredFindingIds: ["volume_return"],
    question: {
      en: "Why do Miriam's records keep stopping at the same kind of blank?",
      "pt-BR": "Por que os registros de Miriam continuam parando no mesmo tipo de lacuna?",
    },
    claims: [
      {
        id: "miriam_corruption",
        copy: {
          en: "The gaps are corruption.",
          "pt-BR": "As lacunas são corrupção.",
        },
      },
      {
        id: "miriam_deliberate",
        copy: {
          en: "Miriam deliberately left the catalogue incomplete.",
          "pt-BR": "Miriam deixou o catálogo incompleto de propósito.",
        },
      },
      {
        id: "miriam_erased_later",
        copy: {
          en: "The university erased the fields later.",
          "pt-BR": "A universidade apagou os campos depois.",
        },
      },
    ],
    correctClaimId: "miriam_deliberate",
    failureCopy: {
      en: "The selection still does not demonstrate that the blank was a decision.",
      "pt-BR": "A seleção ainda não demonstra que a lacuna foi uma decisão.",
    },
    guidance: {
      level1: {
        en: "Compare the public accession field with Miriam's private warning.",
        "pt-BR": "Compare o campo público de incorporação ao aviso privado de Miriam.",
      },
      level2: {
        evidenceId: "miriam_letter_1998",
        copy: {
          en: "Locate Miriam's private warning and reconsider what the blank protects.",
          "pt-BR": "Localize o aviso privado de Miriam e reconsidere o que a lacuna protege.",
        },
      },
    },
    missingKinds: ["document", "document", "record"],
  },
  {
    insightId: "institutional_suppression",
    required: ["incident_report", "maintenance_record"],
    anyOf: ["whitfield_memo", "coastline_archive"],
    availableAt: "chapter_4",
    requiredFindingIds: ["locked_room_source"],
    question: {
      en: "What changed when the locked-room incident entered the university's records?",
      "pt-BR": "O que mudou quando o incidente da sala trancada entrou nos registros da universidade?",
    },
    claims: [
      {
        id: "miskatonic_maintenance",
        copy: {
          en: "Miskatonic filed anomalies as maintenance.",
          "pt-BR": "A Miskatonic arquivou anomalias como manutenção.",
        },
      },
      {
        id: "miskatonic_hydraulic",
        copy: {
          en: "A hydraulic failure caused the incident.",
          "pt-BR": "Uma falha hidráulica causou o incidente.",
        },
      },
      {
        id: "miskatonic_isolated_error",
        copy: {
          en: "It was an isolated filing error.",
          "pt-BR": "Foi um erro isolado de arquivamento.",
        },
      },
    ],
    correctClaimId: "miskatonic_maintenance",
    failureCopy: {
      en: "The physical incident and its administrative classification still tell different stories.",
      "pt-BR": "O incidente físico e sua classificação administrativa ainda contam histórias diferentes.",
    },
    guidance: {
      level1: {
        en: "Track how the vocabulary changes when the incident enters the official record.",
        "pt-BR": "Acompanhe a mudança de vocabulário ao entrar no registro oficial.",
      },
      level2: {
        evidenceId: "maintenance_record",
        copy: {
          en: "Locate the maintenance record and compare its classification with the incident itself.",
          "pt-BR": "Localize o registro de manutenção e compare sua classificação ao incidente em si.",
        },
      },
    },
    missingKinds: ["document", "document", "record"],
  },
  {
    insightId: "cataloguer_lineage",
    required: ["person-miriam", "person-sarah", "lineage_pattern"],
    availableAt: "chapter_5",
    requiredFindingIds: ["lineage_ledger"],
    question: {
      en: "Why do records separated by decades return to the same catalogue position?",
      "pt-BR": "Por que registros separados por décadas retornam à mesma posição no catálogo?",
    },
    claims: [
      {
        id: "lineage_possession",
        copy: {
          en: "The family retained possession of the volume.",
          "pt-BR": "A família manteve a posse do volume.",
        },
      },
      {
        id: "lineage_duplicate_numbers",
        copy: {
          en: "The catalogue duplicated numbers by mistake.",
          "pt-BR": "O catálogo duplicou números por erro.",
        },
      },
      {
        id: "lineage_same_field",
        copy: {
          en: "Miriam and Sarah occupy the same catalogue field.",
          "pt-BR": "Miriam e Sarah ocupam o mesmo campo do catálogo.",
        },
      },
    ],
    correctClaimId: "lineage_same_field",
    failureCopy: {
      en: "Repeating a surname does not explain the repetition of the role.",
      "pt-BR": "Repetir um sobrenome não explica a repetição da função.",
    },
    guidance: {
      level1: {
        en: "Follow the cataloguer position, not possession of the book.",
        "pt-BR": "Acompanhe a posição de catalogadora, não a posse do livro.",
      },
      level2: {
        evidenceId: "lineage_pattern",
        copy: {
          en: "Locate the lineage pattern and compare the function repeated in each entry.",
          "pt-BR": "Localize o padrão de linhagem e compare a função repetida em cada entrada.",
        },
      },
    },
    missingKinds: ["person", "person", "record"],
  },
  {
    insightId: "observer_relay",
    required: ["person-sarah", "person-tom"],
    anyOf: ["future_access_log", "sarah_live_email", "split_record"],
    availableAt: "chapter_5",
    requiredFindingIds: ["future_displacement", "relay_observer"],
    question: {
      en: "Who changes place when Relay 07 opens again?",
      "pt-BR": "Quem muda de lugar quando o Relay 07 se abre novamente?",
    },
    claims: [
      {
        id: "relay_tom_recipient",
        copy: {
          en: "Tom was the intended recipient.",
          "pt-BR": "Tom era o destinatário previsto.",
        },
      },
      {
        id: "relay_creates_recipient",
        copy: {
          en: "The copy creates its recipient.",
          "pt-BR": "A cópia cria seu destinatário.",
        },
      },
      {
        id: "relay_sarah_future",
        copy: {
          en: "Sarah remains the recipient in the future.",
          "pt-BR": "Sarah continua sendo a destinatária no futuro.",
        },
      },
    ],
    correctClaimId: "relay_creates_recipient",
    failureCopy: {
      en: "Sender, recipient and observer are still being mixed together.",
      "pt-BR": "Remetente, destinatário e observador ainda estão misturados.",
    },
    guidance: {
      level1: {
        en: "The blank field matters more than the name of who sent it.",
        "pt-BR": "O campo vazio importa mais que o nome de quem enviou.",
      },
      level2: {
        evidenceId: "future_access_log",
        copy: {
          en: "Locate the future access log and inspect which role its blank field leaves open.",
          "pt-BR": "Localize o log de acesso futuro e examine qual papel seu campo vazio deixa em aberto.",
        },
      },
    },
    missingKinds: ["person", "person", "record"],
  },
  {
    insightId: "self_index",
    required: ["future_access_log", "index_help"],
    anyOf: ["containment_utility", "record_2014"],
    availableAt: "chapter_6",
    requiredFindingIds: ["chapter_ritual"],
    question: {
      en: "What does the future log treat as a witness?",
      "pt-BR": "O que o log futuro trata como testemunha?",
    },
    claims: [
      {
        id: "index_archive_observer",
        copy: {
          en: "An archive can be its own observer.",
          "pt-BR": "Um arquivo pode ser seu próprio observador.",
        },
      },
      {
        id: "index_sarah_witness",
        copy: {
          en: "Sarah is the hidden witness.",
          "pt-BR": "Sarah é a testemunha oculta.",
        },
      },
      {
        id: "index_corrupt_witness",
        copy: {
          en: "The witness field is corrupted.",
          "pt-BR": "O campo de testemunha está corrompido.",
        },
      },
    ],
    correctClaimId: "index_archive_observer",
    failureCopy: {
      en: "The thesis still treats witness and person as synonyms.",
      "pt-BR": "A tese ainda trata testemunha e pessoa como sinônimos.",
    },
    guidance: {
      level1: {
        en: "Check how INDEX.HLP defines an observer.",
        "pt-BR": "Confira como INDEX.HLP define observador.",
      },
      level2: {
        evidenceId: "index_help",
        copy: {
          en: "Locate INDEX.HLP and inspect what its witness field accepts.",
          "pt-BR": "Localize INDEX.HLP e examine o que seu campo de testemunha aceita.",
        },
      },
    },
    missingKinds: ["record", "document", "document"],
  },
];

export interface TheoryEvaluation {
  insightId: InsightId | null;
  matchedCount: number;
  requiredCount: number;
  missingKinds: CorrelationEvidenceKind[];
  claimCorrect: boolean;
  evidenceExact: boolean;
}

export interface TheoryActionabilityContext {
  currentChapter: ChapterId;
  discoveredEvidenceIds: readonly string[];
  completedFindingIds: readonly CaseQuestionId[];
  retainedInsightIds?: readonly InsightId[];
}

const chapterIndex = (chapter: ChapterId) =>
  ["chapter_1", "chapter_2", "chapter_3", "chapter_4", "chapter_5", "chapter_6"].indexOf(
    chapter
  );

export const theoryFor = (id: InsightId) =>
  THEORY_DEFINITIONS.find((candidate) => candidate.insightId === id);

export const isTheoryActionable = (
  theory: TheoryDefinition,
  context: TheoryActionabilityContext
): boolean => {
  if (context.retainedInsightIds?.includes(theory.insightId)) return true;
  if (chapterIndex(context.currentChapter) < chapterIndex(theory.availableAt)) return false;
  const discovered = new Set(context.discoveredEvidenceIds);
  const completed = new Set(context.completedFindingIds);
  return (
    theory.requiredFindingIds.every((id) => completed.has(id)) &&
    theory.required.every((id) => discovered.has(id)) &&
    (!theory.anyOf || theory.anyOf.some((id) => discovered.has(id)))
  );
};

/** Evaluates one explicit thesis and an exact record set without exposing secret ids. */
export const evaluateTheoryAttempt = (
  insightId: InsightId,
  selectedClaimId: string,
  evidenceIds: string[]
): TheoryEvaluation => {
  const theory = theoryFor(insightId);
  if (!theory) {
    return {
      insightId: null,
      matchedCount: 0,
      requiredCount: 0,
      missingKinds: [],
      claimCorrect: false,
      evidenceExact: false,
    };
  }

  const selected = new Set(evidenceIds);
  const requiredCount = theory.required.length + (theory.anyOf ? 1 : 0);
  const matchedRequired = theory.required.filter((id) => selected.has(id)).length;
  const anyOfMatches = theory.anyOf?.filter((id) => selected.has(id)) ?? [];
  const matchedCount = matchedRequired + Math.min(anyOfMatches.length, 1);
  const allowed = new Set([...theory.required, ...(theory.anyOf ?? [])]);
  const evidenceExact =
    selected.size === requiredCount &&
    theory.required.every((id) => selected.has(id)) &&
    (!theory.anyOf || anyOfMatches.length === 1) &&
    Array.from(selected).every((id) => allowed.has(id));
  const claimCorrect = selectedClaimId === theory.correctClaimId;
  const missingKinds = theory.missingKinds.filter((_, index) => {
    if (index < theory.required.length) return !selected.has(theory.required[index]);
    return anyOfMatches.length !== 1;
  });

  return {
    insightId: claimCorrect && evidenceExact ? insightId : null,
    matchedCount,
    requiredCount,
    missingKinds,
    claimCorrect,
    evidenceExact,
  };
};

const pairKey = (a: string, b: string): string => [a, b].sort().join("|");

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
