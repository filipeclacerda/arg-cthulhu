import {
  CaseQuestionId,
  HypothesisId,
  InsightId,
  LeadId,
  Locale,
  ProgressStateV5,
  TokenType,
} from "./progress";
import { isUnlocked, UnlockCondition } from "./unlock";

export interface LocalizedCopy {
  en: string;
  "pt-BR": string;
}

/**
 * A collectable "fact" the player extracts by clicking a highlighted phrase
 * inside a document. Tokens fill the blanks of Case Reconstruction statements.
 * Several tokens of the same type act as plausible decoys for one another.
 */
export interface TokenDefinition {
  id: string;
  type: TokenType;
  label: LocalizedCopy;
  sourceEvidenceId: string;
}

/** Public name used by save/tools code that treats extracted facts as clues. */
export type ClueToken = TokenDefinition;

/**
 * Marks an exact phrase inside a document body as a collectable clue. The
 * snippet is per-locale because the rendered body is localized. Attach these to
 * VFile / VEmail / chat messages via an optional `clues` array.
 */
export interface ClueMarker {
  tokenId: string;
  snippet: LocalizedCopy;
}

type RawTokenDefinition = Omit<TokenDefinition, "sourceEvidenceId"> &
  Partial<Pick<TokenDefinition, "sourceEvidenceId">>;

const RAW_TOKENS: RawTokenDefinition[] = [
  // time -------------------------------------------------------------------
  { id: "time-six-thirty", type: "time", label: { en: "6:30 in the evening", "pt-BR": "6:30 da tarde" } },
  { id: "time-one-day", type: "time", label: { en: "one day ahead", "pt-BR": "um dia à frente" } },
  { id: "time-0314", type: "time", label: { en: "03:14", "pt-BR": "03:14" } },
  { id: "time-1742", type: "time", label: { en: "17:42", "pt-BR": "17:42" } },
  // intent -----------------------------------------------------------------
  { id: "intent-go-home", type: "intent", label: { en: "go home to her family", "pt-BR": "voltar para casa e a família" } },
  { id: "intent-flee-arkham", type: "intent", label: { en: "leave Arkham unannounced", "pt-BR": "deixar Arkham sem avisar" } },
  { id: "intent-meet-tom", type: "intent", label: { en: "meet Tom at the archive", "pt-BR": "encontrar Tom no arquivo" } },
  // cause ------------------------------------------------------------------
  { id: "cause-deliberately-sent", type: "cause", label: { en: "deliberately re-sent", "pt-BR": "reenviado de propósito" } },
  { id: "cause-act-of-reconstruction", type: "cause", label: { en: "act of reconstruction", "pt-BR": "ato de reconstrução" } },
  { id: "cause-clerical-error", type: "cause", label: { en: "a clerical mix-up", "pt-BR": "um engano de catalogação" } },
  // family -----------------------------------------------------------------
  { id: "family-bishop", type: "family", label: { en: "Bishop", "pt-BR": "Bishop" } },
  { id: "family-whateley", type: "family", label: { en: "Whateley", "pt-BR": "Whateley" } },
  { id: "family-marsh", type: "family", label: { en: "Marsh", "pt-BR": "Marsh" } },
  // place ------------------------------------------------------------------
  { id: "place-under-workstation", type: "place", label: { en: "beneath the workstation", "pt-BR": "sob a workstation" } },
  { id: "place-ceiling", type: "place", label: { en: "from the ceiling", "pt-BR": "pelo teto" } },
  { id: "place-window", type: "place", label: { en: "through the window", "pt-BR": "pela janela" } },
  // object -----------------------------------------------------------------
  { id: "object-pipe", type: "object", label: { en: "water pipe", "pt-BR": "cano d'água" } },
  { id: "object-archive-field", type: "object", label: { en: "archive field", "pt-BR": "campo de arquivo" } },
  { id: "object-hvac", type: "object", label: { en: "air handler", "pt-BR": "ar-condicionado" } },
  // status -----------------------------------------------------------------
  { id: "status-tomorrow", type: "status", label: { en: "tomorrow", "pt-BR": "amanhã" } },
  { id: "status-deceased", type: "status", label: { en: "deceased", "pt-BR": "morta" } },
  { id: "status-inside-volume", type: "status", label: { en: "sealed inside Volume II", "pt-BR": "presa no Volume II" } },
  // person -----------------------------------------------------------------
  { id: "person-observer", type: "person", label: { en: "the observer", "pt-BR": "o observador" } },
  { id: "person-sarah-tok", type: "person", label: { en: "Sarah Bishop", "pt-BR": "Sarah Bishop" } },
  { id: "person-tom-tok", type: "person", label: { en: "Tom Alvarez", "pt-BR": "Tom Alvarez" } },
  // lineage ledger ---------------------------------------------------------
  { id: "year-1977", type: "year", sourceEvidenceId: "lineage_1977", label: { en: "1977", "pt-BR": "1977" } },
  { id: "year-1949", type: "year", sourceEvidenceId: "lineage_1949", label: { en: "1949", "pt-BR": "1949" } },
  { id: "year-1912", type: "year", sourceEvidenceId: "lineage_1912", label: { en: "1912", "pt-BR": "1912" } },
  { id: "detail-incomplete-ledger", type: "detail", sourceEvidenceId: "lineage_1977", label: { en: "an intentionally incomplete ledger", "pt-BR": "um livro-razão incompleto de propósito" } },
  { id: "detail-water-damage", type: "detail", sourceEvidenceId: "lineage_1863", label: { en: "ordinary water damage", "pt-BR": "um dano comum por água" } },
  { id: "detail-stolen-volume", type: "detail", sourceEvidenceId: "lineage_1912", label: { en: "a stolen volume", "pt-BR": "um volume roubado" } },
];

/** Authored evidence source for the older tokens, kept separate for compact data. */
export const TOKEN_SOURCE_EVIDENCE: Record<string, string> = {
  "time-six-thirty": "lecture_draft",
  "time-one-day": "sarah_live_email",
  "time-0314": "future_access_log",
  "time-1742": "lineage_1977",
  "intent-go-home": "lecture_draft",
  "intent-flee-arkham": "em_investigation",
  "intent-meet-tom": "chat_tom_archive",
  "cause-deliberately-sent": "diary",
  "cause-act-of-reconstruction": "the_name",
  "cause-clerical-error": "lineage_1912",
  "family-bishop": "borrower_index",
  "family-whateley": "borrower_index",
  "family-marsh": "borrower_index",
  "place-under-workstation": "maintenance_record",
  "place-ceiling": "maintenance_record",
  "place-window": "incident_report",
  "object-pipe": "maintenance_record",
  "object-archive-field": "record_2014",
  "object-hvac": "maintenance_record",
  "status-tomorrow": "sarah_live_email",
  "status-deceased": "victim_2014",
  "status-inside-volume": "em_investigation",
  "person-observer": "tom_last_message",
  "person-sarah-tok": "sarah_live_email",
  "person-tom-tok": "tom_last_message",
};

export const TOKENS: TokenDefinition[] = RAW_TOKENS.map((token) => ({
  ...token,
  sourceEvidenceId:
    token.sourceEvidenceId ?? TOKEN_SOURCE_EVIDENCE[token.id] ?? "",
}));

export const TOKENS_BY_ID: Record<string, TokenDefinition> = Object.fromEntries(
  TOKENS.map((token) => [token.id, token])
);

/** Collected tokens of a given type — the candidate pool for a statement slot. */
export const collectedTokensOfType = (
  type: TokenType,
  collectedTokenIds: string[]
): TokenDefinition[] =>
  collectedTokenIds
    .map((id) => TOKENS_BY_ID[id])
    .filter((token): token is TokenDefinition => Boolean(token) && token.type === type);

export interface EvidenceRequirement {
  allOf?: string[];
  anyOf?: string[];
  minimum?: number;
}

/** One blank in a reconstruction statement, filled by a collected token. */
export interface SlotDefinition {
  /** Matches a `{key}` placeholder in the statement template. */
  key: string;
  type: TokenType;
  correctTokenId: string;
}

/**
 * A Golden-Idol-style fill-in-the-blank finding. The player drops collected
 * tokens into the blanks; correct blanks lock, wrong blanks clear. A statement
 * only counts toward act progress once every slot is locked and the evidence
 * requirement is met.
 */
export interface CaseStatementDefinition {
  id: CaseQuestionId;
  act: 1 | 2 | 3;
  leadId: LeadId;
  context: LocalizedCopy;
  /** Template text with `{slotKey}` placeholders, one per slot. */
  template: LocalizedCopy;
  slots: SlotDefinition[];
  evidence: EvidenceRequirement;
}

export type EvidenceReason =
  | "ok"
  | "not_enough_evidence"
  | "missing_required_evidence";

export interface StatementValidation {
  /** Per-slot correctness for the tokens the player proposed. */
  slots: Record<string, boolean>;
  allSlotsCorrect: boolean;
  evidence: EvidenceReason;
  accepted: boolean;
}

export const CASE_STATEMENTS: CaseStatementDefinition[] = [
  {
    id: "sarah_intent",
    act: 1,
    leadId: "sarah_last_day",
    context: {
      en: "Reconstruct intent from ordinary commitments, not from the supernatural material.",
      "pt-BR":
        "Reconstrua a intenção a partir de compromissos comuns, não do material sobrenatural.",
    },
    template: {
      en: "On her last day, Sarah meant to leave the archive around {time} and {intent}.",
      "pt-BR":
        "No último dia, Sarah pretendia sair do arquivo por volta das {time} e {intent}.",
    },
    slots: [
      { key: "time", type: "time", correctTokenId: "time-six-thirty" },
      { key: "intent", type: "intent", correctTokenId: "intent-go-home" },
    ],
    evidence: {
      anyOf: [
        "lecture_draft",
        "chat_em_archive",
        "dad_email",
        "todo",
        "photo_bishop_birthday_2025",
      ],
      minimum: 2,
    },
  },
  {
    id: "volume_return",
    act: 1,
    leadId: "lot_provenance",
    context: {
      en: "Compare the 1998 accession trail with the 2026 shipment.",
      "pt-BR": "Compare a incorporação de 1998 com o envio de 2026.",
    },
    template: {
      en: "Volume II resurfaced because it was {cause}, routed back through the {family} line.",
      "pt-BR":
        "O Volume II reapareceu porque foi {cause}, direcionado de volta pela linhagem {family}.",
    },
    slots: [
      { key: "cause", type: "cause", correctTokenId: "cause-deliberately-sent" },
      { key: "family", type: "family", correctTokenId: "family-bishop" },
    ],
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
    context: {
      en: "The security report and adjacent evidence frames disagree with the maintenance record.",
      "pt-BR":
        "O relatório de segurança e os frames vizinhos contradizem o registro de manutenção.",
    },
    template: {
      en: "In the sealed office the seawater surfaced {place}, and no {object} could account for it.",
      "pt-BR":
        "No escritório trancado, a água salgada surgiu {place}, e nenhum {object} podia explicá-la.",
    },
    slots: [
      { key: "place", type: "place", correctTokenId: "place-under-workstation" },
      { key: "object", type: "object", correctTokenId: "object-pipe" },
    ],
    evidence: {
      allOf: ["incident_report"],
      anyOf: ["office_after_photo", "maintenance_record", "office_frames_11_13"],
      minimum: 2,
    },
  },
  {
    id: "lineage_ledger",
    act: 2,
    leadId: "historical",
    context: {
      en: "The period dossiers disagree about ownership, but agree on what the next custodian inherited.",
      "pt-BR":
        "Os dossiês discordam sobre a posse, mas concordam sobre o que a próxima guardiã herdou.",
    },
    template: {
      en: "In {year}, the {family} line inherited {detail}, turning an omission into a family warning.",
      "pt-BR":
        "Em {year}, a linhagem {family} herdou {detail}, transformando uma omissão num aviso familiar.",
    },
    slots: [
      { key: "year", type: "year", correctTokenId: "year-1977" },
      { key: "family", type: "family", correctTokenId: "family-bishop" },
      {
        key: "detail",
        type: "detail",
        correctTokenId: "detail-incomplete-ledger",
      },
    ],
    evidence: {
      allOf: ["lineage_1977"],
      anyOf: [
        "lineage_1863",
        "lineage_1912",
        "lineage_1949",
        "em_investigation",
      ],
      minimum: 3,
    },
  },
  {
    id: "future_displacement",
    act: 3,
    leadId: "observer",
    context: {
      en: "Compare the moving date with files that predate your actions. Record the behavior, not its cause.",
      "pt-BR":
        "Compare a data móvel aos arquivos anteriores às suas ações. Registre o comportamento, não a causa.",
    },
    template: {
      en: "Sarah's message and related records are dated {status}, consistently {time} of whoever observes.",
      "pt-BR":
        "A mensagem de Sarah e os registros relacionados estão datados de {status}, sempre {time} de quem observa.",
    },
    slots: [
      { key: "status", type: "status", correctTokenId: "status-tomorrow" },
      { key: "time", type: "time", correctTokenId: "time-one-day" },
    ],
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
    context: {
      en: "Compare Tom's custody record with the fields created by the index.",
      "pt-BR": "Compare o registro de custódia de Tom aos campos criados pelo índice.",
    },
    template: {
      en: "The Relay 07 stays open only while a living {person} occupies the {object}.",
      "pt-BR":
        "O Relay 07 permanece aberto só enquanto um {person} vivo ocupa o {object}.",
    },
    slots: [
      { key: "person", type: "person", correctTokenId: "person-observer" },
      { key: "object", type: "object", correctTokenId: "object-archive-field" },
    ],
    evidence: {
      allOf: ["tom_last_message"],
      anyOf: ["sarah_live_email", "future_access_log", "index_help", "split_record"],
      minimum: 2,
    },
  },
  {
    id: "chapter_ritual",
    act: 3,
    leadId: "observer",
    context: {
      en: "The volume contains components, but no complete Chapter Seven can be located inside it.",
      "pt-BR":
        "O volume contém componentes, mas nenhum Capítulo Sete completo pode ser localizado nele.",
    },
    template: {
      en: "The evidence behaves as though Chapter Seven is the {cause} carried out by the {person} who reconstructs it.",
      "pt-BR":
        "A evidência se comporta como se o Capítulo Sete fosse o {cause} realizado pelo {person} que o reconstrói.",
    },
    slots: [
      { key: "cause", type: "cause", correctTokenId: "cause-act-of-reconstruction" },
      { key: "person", type: "person", correctTokenId: "person-observer" },
    ],
    evidence: {
      allOf: ["the_name"],
      anyOf: ["margin_ciphertext", "counting_audio", "lineage_pattern", "future_access_log"],
      minimum: 2,
    },
  },
];

/**
 * Most tested hypotheses collapse into a plain refutation. One does not: the
 * records prove Sarah acted (she left the relay's recipient field blank on
 * purpose, the same fragmentation technique traced to Miriam's incomplete
 * ledger) but never settle *why*. `verdict` lets the Casefile UI show that
 * distinction without inventing a new lens. Absent verdict defaults to
 * "refuted" so existing entries don't need to be touched.
 */
export type HypothesisVerdict = "refuted" | "inconclusive";

export const HYPOTHESES: Record<
  HypothesisId,
  { title: LocalizedCopy; truth: LocalizedCopy; verdict?: HypothesisVerdict }
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
  sarah_chose_observer: {
    title: {
      en: "Sarah chose the next observer",
      "pt-BR": "Sarah escolheu o próximo observador",
    },
    verdict: "inconclusive",
    truth: {
      en: "Inconclusive: Sarah's split record shows the recipient field was left blank deliberately. The receipts and Tom's manifest cannot establish whether that blank was a rescue route, a replacement, or something the copy learned to use.",
      "pt-BR":
        "Inconclusiva: o registro fragmentado de Sarah mostra que o campo de destinatário foi deixado vazio de propósito. As confirmações e o manifesto de Tom não estabelecem se o espaço era uma rota de socorro, uma substituição ou algo que a cópia aprendeu a usar.",
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

/** Defaults to "refuted" so hypotheses without an authored verdict need no change. */
export const hypothesisVerdict = (id: HypothesisId): HypothesisVerdict =>
  HYPOTHESES[id].verdict ?? "refuted";

export const findStatement = (
  id: CaseQuestionId
): CaseStatementDefinition | undefined =>
  CASE_STATEMENTS.find((statement) => statement.id === id);

/** Checks the evidence requirement independently of the slot answers. */
export const checkEvidence = (
  requirement: EvidenceRequirement,
  evidenceIds: string[]
): EvidenceReason => {
  const selected = new Set(evidenceIds);
  const allOf = requirement.allOf ?? [];
  if (!allOf.every((id) => selected.has(id))) {
    return "missing_required_evidence";
  }
  const anyOf = requirement.anyOf ?? [];
  const relevant = new Set([...allOf, ...anyOf]);
  const relevantCount = evidenceIds.filter((id) => relevant.has(id)).length;
  if (relevantCount < (requirement.minimum ?? 1)) {
    return "not_enough_evidence";
  }
  if (anyOf.length > 0 && !anyOf.some((id) => selected.has(id))) {
    return "missing_required_evidence";
  }
  return "ok";
};

/**
 * Validates a proposed set of slot tokens + attached evidence. Returns per-slot
 * correctness (so the UI can lock the right blanks and clear the wrong ones) and
 * an evidence verdict. `accepted` is true only when every slot is correct and
 * the evidence holds.
 */
export const validateStatement = (
  statementId: CaseQuestionId,
  slotSelections: Record<string, string>,
  evidenceIds: string[]
): StatementValidation => {
  const statement = findStatement(statementId);
  if (!statement) {
    return { slots: {}, allSlotsCorrect: false, evidence: "not_enough_evidence", accepted: false };
  }
  const slots: Record<string, boolean> = {};
  let allSlotsCorrect = true;
  statement.slots.forEach((slot) => {
    const correct = slotSelections[slot.key] === slot.correctTokenId;
    slots[slot.key] = correct;
    if (!correct) allSlotsCorrect = false;
  });
  const evidence = checkEvidence(statement.evidence, evidenceIds);
  return {
    slots,
    allSlotsCorrect,
    evidence,
    accepted: allSlotsCorrect && evidence === "ok",
  };
};

const isStatementSolved = (state: ProgressStateV5, id: CaseQuestionId): boolean =>
  Boolean(state.caseAnswers[id]?.solvedAt);

export const actOneAnswerCount = (state: ProgressStateV5): number =>
  CASE_STATEMENTS.filter(
    (statement) => statement.act === 1 && isStatementSolved(state, statement.id)
  ).length;

export const observerAnswerCount = (state: ProgressStateV5): number =>
  CASE_STATEMENTS.filter(
    (statement) => statement.act === 3 && isStatementSolved(state, statement.id)
  ).length;

/**
 * The three conclusions about the observer required by the final INDEX
 * operation, in the order their milestones occur. Act-one findings still
 * color codas and context, but never gate the Indexer.
 */
export const OBSERVER_CONCLUSION_IDS = [
  "future_displacement",
  "relay_observer",
  "chapter_ritual",
] as const;

export type ObserverConclusionId = (typeof OBSERVER_CONCLUSION_IDS)[number];

/** When each observer conclusion becomes available to reconstruct. */
export const OBSERVER_CONCLUSION_UNLOCKS: Record<
  ObserverConclusionId,
  UnlockCondition
> = {
  // "Sarah stays one day ahead" — after the lineage year is confirmed.
  future_displacement: { type: "puzzleSolved", puzzleId: "lineage" },
  // "The Relay requires a living observer" — after the future log is replayed.
  relay_observer: { type: "puzzleSolved", puzzleId: "future_log" },
  // "Chapter Seven is the act of reconstruction" — after the_name.txt is opened.
  chapter_ritual: { type: "evidenceOpened", evidenceId: "the_name" },
};

/** Player-facing names for the observer conclusions (chrome + refusals). */
export const OBSERVER_CONCLUSION_LABELS: Record<
  ObserverConclusionId,
  LocalizedCopy
> = {
  future_displacement: {
    en: "Sarah stays one day ahead",
    "pt-BR": "Sarah permanece sempre um dia à frente",
  },
  relay_observer: {
    en: "The Relay requires a living observer",
    "pt-BR": "O Relay exige um observador vivo",
  },
  chapter_ritual: {
    en: "Chapter Seven is the act of reconstruction",
    "pt-BR": "O Capítulo Sete é o ato de reconstrução",
  },
};

export const isObserverConclusionAvailable = (
  state: ProgressStateV5,
  id: ObserverConclusionId
): boolean =>
  isUnlocked(OBSERVER_CONCLUSION_UNLOCKS[id], {
    flags: state.flags,
    discoveredEvidenceIds: state.discoveredEvidenceIds,
    solvedPuzzleIds: (Object.keys(state.puzzles) as (keyof typeof state.puzzles)[]).filter(
      (puzzleId) => Boolean(state.puzzles[puzzleId].solvedAt)
    ),
  });

/** Observer conclusions not yet retained, in milestone order. */
export const pendingObserverConclusions = (
  state: ProgressStateV5
): ObserverConclusionId[] =>
  OBSERVER_CONCLUSION_IDS.filter((id) => !isStatementSolved(state, id));

export const canRunFinalIndex = (state: ProgressStateV5): boolean =>
  // The final operation asks only for the three conclusions about the
  // observer. Sarah's ordinary life remains optional context — it shapes the
  // codas, not the command gate.
  observerAnswerCount(state) === 3;

export const hasAllInsights = (state: ProgressStateV5): boolean =>
  Object.keys(INSIGHT_LABELS).every((id) =>
    state.insightsUnlocked.includes(id as InsightId)
  );

/**
 * Static campaign-solvability audit. Guarantees every statement is reconstructable
 * and every mandatory conclusion depends on at least two evidence sources.
 */
export const validateCampaignGraph = (): string[] => {
  const errors: string[] = [];
  const ids = new Set(CASE_STATEMENTS.map((statement) => statement.id));
  if (ids.size !== CASE_STATEMENTS.length) errors.push("Duplicate statement id.");
  CASE_STATEMENTS.forEach((statement) => {
    // Every placeholder in the template must have a matching slot and vice versa.
    const placeholders = (statement.template.en.match(/\{(\w+)\}/g) ?? []).map((m) =>
      m.slice(1, -1)
    );
    const slotKeys = statement.slots.map((slot) => slot.key);
    placeholders.forEach((key) => {
      if (!slotKeys.includes(key)) {
        errors.push(`${statement.id}: template placeholder {${key}} has no slot.`);
      }
    });
    slotKeys.forEach((key) => {
      if (!placeholders.includes(key)) {
        errors.push(`${statement.id}: slot ${key} has no template placeholder.`);
      }
      if (!statement.template["pt-BR"].includes(`{${key}}`)) {
        errors.push(`${statement.id}: pt-BR template is missing {${key}}.`);
      }
    });
    statement.slots.forEach((slot) => {
      const token = TOKENS_BY_ID[slot.correctTokenId];
      if (!token) {
        errors.push(`${statement.id}.${slot.key}: unknown token ${slot.correctTokenId}.`);
      } else if (token.type !== slot.type) {
        errors.push(`${statement.id}.${slot.key}: token type ${token.type} ≠ slot type ${slot.type}.`);
      }
      // At least one same-type decoy must exist so the blank is not trivial.
      const decoys = TOKENS.filter(
        (candidate) => candidate.type === slot.type && candidate.id !== slot.correctTokenId
      );
      if (decoys.length === 0) {
        errors.push(`${statement.id}.${slot.key}: no same-type decoy token exists.`);
      }
      const sourceEvidenceId = token?.sourceEvidenceId;
      if (!sourceEvidenceId) {
        errors.push(
          `${statement.id}.${slot.key}: correct token has no collectable source.`
        );
      }
    });
    const sources = new Set([
      ...(statement.evidence.allOf ?? []),
      ...(statement.evidence.anyOf ?? []),
    ]);
    if (sources.size < 2) errors.push(`${statement.id}: fewer than two evidence sources.`);
  });
  return errors;
};
