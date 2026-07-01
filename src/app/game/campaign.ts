import {
  CaseQuestionId,
  HypothesisId,
  InsightId,
  LeadId,
  Locale,
  ProgressStateV5,
} from "./progress";

export interface LocalizedCopy {
  en: string;
  "pt-BR": string;
}

export interface CaseAnswerOption {
  id: string;
  label: LocalizedCopy;
}

export interface EvidenceRequirement {
  allOf?: string[];
  anyOf?: string[];
  minimum?: number;
}

export interface CaseQuestionDefinition {
  id: CaseQuestionId;
  act: 1 | 3;
  leadId: LeadId;
  prompt: LocalizedCopy;
  context: LocalizedCopy;
  options: CaseAnswerOption[];
  correctAnswerId: string;
  evidence: EvidenceRequirement;
}

export interface CaseAnswerValidation {
  accepted: boolean;
  reason:
    | "accepted"
    | "wrong_conclusion"
    | "not_enough_evidence"
    | "missing_required_evidence";
}

export const CASE_QUESTIONS: CaseQuestionDefinition[] = [
  {
    id: "sarah_intent",
    act: 1,
    leadId: "sarah_last_day",
    prompt: {
      en: "What did Sarah intend to do after leaving the archive?",
      "pt-BR": "O que Sarah pretendia fazer depois de sair do arquivo?",
    },
    context: {
      en: "Reconstruct intent from ordinary commitments, not from the supernatural material.",
      "pt-BR":
        "Reconstrua a intenção a partir de compromissos comuns, não do material sobrenatural.",
    },
    options: [
      {
        id: "planned_return",
        label: {
          en: "Return home and contact her family",
          "pt-BR": "Voltar para casa e falar com a família",
        },
      },
      {
        id: "planned_escape",
        label: {
          en: "Leave Arkham without telling anyone",
          "pt-BR": "Deixar Arkham sem avisar ninguém",
        },
      },
      {
        id: "unknown",
        label: {
          en: "Her plans cannot be reconstructed",
          "pt-BR": "Os planos dela não podem ser reconstruídos",
        },
      },
    ],
    correctAnswerId: "planned_return",
    evidence: {
      anyOf: ["chat_em_archive", "dad_email", "todo", "photo_bishop_birthday_2025"],
      minimum: 2,
    },
  },
  {
    id: "volume_return",
    act: 1,
    leadId: "lot_provenance",
    prompt: {
      en: "Why is the arrival of Volume II unlikely to be accidental?",
      "pt-BR": "Por que a chegada do Volume II dificilmente foi acidental?",
    },
    context: {
      en: "Compare the 1998 accession trail with the 2026 shipment.",
      "pt-BR": "Compare a incorporação de 1998 com o envio de 2026.",
    },
    options: [
      {
        id: "deliberate_return",
        label: {
          en: "It was routed back through the Bishop family",
          "pt-BR": "Ele foi direcionado de volta pela família Bishop",
        },
      },
      {
        id: "bookseller_error",
        label: {
          en: "The bookseller confused two unrelated lots",
          "pt-BR": "O livreiro confundiu dois lotes sem relação",
        },
      },
      {
        id: "tom_purchase",
        label: {
          en: "Tom purchased it under Sarah's name",
          "pt-BR": "Tom o comprou usando o nome de Sarah",
        },
      },
    ],
    correctAnswerId: "deliberate_return",
    evidence: {
      allOf: ["miriam_1998"],
      anyOf: [
        "lot_114_order",
        "diary",
        "miriam_letter_1998",
        "catalogue_lot_114",
        "whateley_accession_card",
      ],
      minimum: 2,
    },
  },
  {
    id: "locked_room_source",
    act: 1,
    leadId: "locked_room",
    prompt: {
      en: "Where did the salt water first appear?",
      "pt-BR": "Onde a água salgada apareceu primeiro?",
    },
    context: {
      en: "The security report and adjacent evidence frames disagree with the maintenance record.",
      "pt-BR":
        "O relatório de segurança e os frames vizinhos contradizem o registro de manutenção.",
    },
    options: [
      {
        id: "workstation_source",
        label: {
          en: "Beneath the archival workstation",
          "pt-BR": "Sob a workstation do arquivo",
        },
      },
      {
        id: "ceiling_leak",
        label: {
          en: "From a pipe above the office",
          "pt-BR": "De um cano acima do escritório",
        },
      },
      {
        id: "window_entry",
        label: {
          en: "Through the painted-shut window",
          "pt-BR": "Pela janela lacrada com tinta",
        },
      },
    ],
    correctAnswerId: "workstation_source",
    evidence: {
      allOf: ["incident_report"],
      anyOf: ["office_after_photo", "maintenance_record", "office_frames_11_13"],
      minimum: 2,
    },
  },
  {
    id: "future_displacement",
    act: 3,
    leadId: "observer",
    prompt: {
      en: "Where is Sarah relative to the observer?",
      "pt-BR": "Onde Sarah está em relação ao observador?",
    },
    context: {
      en: "Use the moving date, her live message and the files that predate your actions.",
      "pt-BR":
        "Use a data móvel, a mensagem ao vivo e os arquivos anteriores às suas ações.",
    },
    options: [
      {
        id: "tomorrow_state",
        label: {
          en: "In a state that remains one day ahead",
          "pt-BR": "Em um estado que permanece um dia à frente",
        },
      },
      {
        id: "inside_volume",
        label: {
          en: "Physically sealed inside Volume II",
          "pt-BR": "Fisicamente presa dentro do Volume II",
        },
      },
      {
        id: "dead_archive",
        label: {
          en: "Dead, with the archive impersonating her",
          "pt-BR": "Morta, com o arquivo imitando sua identidade",
        },
      },
    ],
    correctAnswerId: "tomorrow_state",
    evidence: {
      allOf: ["sarah_live_email"],
      anyOf: ["future_access_log", "do_not_open", "absence_note"],
      minimum: 2,
    },
  },
  {
    id: "relay_observer",
    act: 3,
    leadId: "observer",
    prompt: {
      en: "What does the Relay 07 require to remain stable?",
      "pt-BR": "Do que o Relay 07 precisa para permanecer estável?",
    },
    context: {
      en: "Tom describes delivery; Sarah describes the cost of recovery.",
      "pt-BR": "Tom descreve a entrega; Sarah descreve o custo da recuperação.",
    },
    options: [
      {
        id: "occupied_observer",
        label: {
          en: "A current observer occupying the archive field",
          "pt-BR": "Um observador atual ocupando o campo de arquivo",
        },
      },
      {
        id: "university_server",
        label: {
          en: "A permanent connection to Miskatonic",
          "pt-BR": "Uma conexão permanente com a Miskatonic",
        },
      },
      {
        id: "bishop_bloodline",
        label: {
          en: "A living member of the Bishop bloodline",
          "pt-BR": "Um membro vivo da linhagem Bishop",
        },
      },
    ],
    correctAnswerId: "occupied_observer",
    evidence: {
      allOf: ["tom_last_message"],
      anyOf: ["sarah_live_email", "future_access_log", "index_help"],
      minimum: 2,
    },
  },
  {
    id: "chapter_ritual",
    act: 3,
    leadId: "observer",
    prompt: {
      en: "What is Chapter Seven?",
      "pt-BR": "O que é o Capítulo Sete?",
    },
    context: {
      en: "The book contains components. The completed chapter exists somewhere else.",
      "pt-BR":
        "O livro contém componentes. O capítulo completo existe em outro lugar.",
    },
    options: [
      {
        id: "act_of_reconstruction",
        label: {
          en: "The observer's act of reconstructing the evidence",
          "pt-BR": "O ato do observador de reconstruir as evidências",
        },
      },
      {
        id: "missing_pages",
        label: {
          en: "Pages physically removed from Volume II",
          "pt-BR": "Páginas removidas fisicamente do Volume II",
        },
      },
      {
        id: "translation",
        label: {
          en: "Sarah's unfinished academic translation",
          "pt-BR": "A tradução acadêmica inacabada de Sarah",
        },
      },
    ],
    correctAnswerId: "act_of_reconstruction",
    evidence: {
      allOf: ["the_name"],
      anyOf: ["margin_ciphertext", "counting_audio", "lineage_pattern", "future_access_log"],
      minimum: 2,
    },
  },
];

export const HYPOTHESES: Record<
  HypothesisId,
  { title: LocalizedCopy; truth: LocalizedCopy }
> = {
  tom_forged_image: {
    title: {
      en: "Tom forged the forensic image",
      "pt-BR": "Tom falsificou a imagem forense",
    },
    truth: {
      en: "Refuted: Tom concealed how far the upload progressed, but the image predicts actions he never witnessed.",
      "pt-BR":
        "Refutada: Tom ocultou o quanto o envio avançou, mas a imagem prevê ações que ele nunca presenciou.",
    },
  },
  sarah_fled: {
    title: {
      en: "Sarah fled after exposing the university",
      "pt-BR": "Sarah fugiu após expor a universidade",
    },
    truth: {
      en: "Refuted: the university suppressed prior incidents, but Sarah left ordinary plans unfinished in a locked room.",
      "pt-BR":
        "Refutada: a universidade abafou incidentes anteriores, mas Sarah deixou planos comuns inacabados numa sala trancada.",
    },
  },
  innsmouth_theft: {
    title: {
      en: "The Innsmouth society stole Volume II",
      "pt-BR": "A sociedade de Innsmouth roubou o Volume II",
    },
    truth: {
      en: "Refuted: several families knew the pattern, but the chain of custody points back to the catalogue itself.",
      "pt-BR":
        "Refutada: várias famílias conheciam o padrão, mas a cadeia de custódia aponta para o próprio catálogo.",
    },
  },
};

export const INSIGHT_LABELS: Record<InsightId, LocalizedCopy> = {
  second_volume: {
    en: "The second volume returned through the Bishops",
    "pt-BR": "O segundo volume retornou através das Bishop",
  },
  cataloguer_lineage: {
    en: "Miriam and Sarah occupy the same catalogue field",
    "pt-BR": "Miriam e Sarah ocupam o mesmo campo do catálogo",
  },
  observer_relay: {
    en: "The copy creates its recipient",
    "pt-BR": "A cópia cria seu destinatário",
  },
  institutional_suppression: {
    en: "Miskatonic archived anomalies as maintenance incidents",
    "pt-BR": "A Miskatonic arquivou anomalias como incidentes de manutenção",
  },
  miriam_break: {
    en: "Miriam left the catalogue incomplete on purpose",
    "pt-BR": "Miriam deixou o catálogo incompleto de propósito",
  },
  self_index: {
    en: "An archive can be registered as its own observer",
    "pt-BR": "Um arquivo pode ser registrado como seu próprio observador",
  },
};

export const localized = (copy: LocalizedCopy, locale: Locale): string =>
  copy[locale];

export const validateCaseAnswer = (
  questionId: CaseQuestionId,
  answerId: string,
  evidenceIds: string[]
): CaseAnswerValidation => {
  const question = CASE_QUESTIONS.find((candidate) => candidate.id === questionId);
  if (!question || question.correctAnswerId !== answerId) {
    return { accepted: false, reason: "wrong_conclusion" };
  }
  const selected = new Set(evidenceIds);
  const allOf = question.evidence.allOf ?? [];
  if (!allOf.every((id) => selected.has(id))) {
    return { accepted: false, reason: "missing_required_evidence" };
  }
  const anyOf = question.evidence.anyOf ?? [];
  const relevant = new Set([...allOf, ...anyOf]);
  const relevantCount = evidenceIds.filter((id) => relevant.has(id)).length;
  if (relevantCount < (question.evidence.minimum ?? 1)) {
    return { accepted: false, reason: "not_enough_evidence" };
  }
  if (anyOf.length > 0 && !anyOf.some((id) => selected.has(id))) {
    return { accepted: false, reason: "missing_required_evidence" };
  }
  return { accepted: true, reason: "accepted" };
};

export const actOneAnswerCount = (state: ProgressStateV5): number =>
  CASE_QUESTIONS.filter(
    (question) => question.act === 1 && state.caseAnswers[question.id]
  ).length;

export const observerAnswerCount = (state: ProgressStateV5): number =>
  CASE_QUESTIONS.filter(
    (question) => question.act === 3 && state.caseAnswers[question.id]
  ).length;

export const canRunFinalIndex = (state: ProgressStateV5): boolean =>
  observerAnswerCount(state) === 3;

export const hasAllInsights = (state: ProgressStateV5): boolean =>
  Object.keys(INSIGHT_LABELS).every((id) =>
    state.insightsUnlocked.includes(id as InsightId)
  );

export const validateCampaignGraph = (): string[] => {
  const errors: string[] = [];
  const ids = new Set(CASE_QUESTIONS.map((question) => question.id));
  if (ids.size !== CASE_QUESTIONS.length) errors.push("Duplicate case question id.");
  CASE_QUESTIONS.forEach((question) => {
    if (question.options.filter((option) => option.id === question.correctAnswerId).length !== 1) {
      errors.push(`${question.id}: correct answer is not represented exactly once.`);
    }
    const sources = new Set([
      ...(question.evidence.allOf ?? []),
      ...(question.evidence.anyOf ?? []),
    ]);
    if (sources.size < 2) errors.push(`${question.id}: fewer than two evidence sources.`);
  });
  return errors;
};
