import { Locale, ProgressStateV3 } from "./progress";

/**
 * Consequences of the two questions the player can put to the machine — the
 * modern question asked of NEXT_USER during the live contact, and the answer
 * the player sends back into 1998. Centralised here as pure data + selectors so
 * every surface (DIALUP.LOG, the RECALL_0314 receipt, the residue artifacts,
 * the ending coda) reads from one place.
 *
 * Editorial contract: none of these strings resolve the ambiguity the script
 * protects. A receipt is dry system output; it never states whether Sarah is
 * alive, or whether RESTORE rescues or overwrites a record. The single ending
 * coda is a residue, not an explanation.
 */

export type ModernQuestionId = "alive" | "restore" | "break" | "fourth";
/** The four askable questions plus the state where the window closed unasked. */
export type ModernQuestionOutcome = ModernQuestionId | "missed";
export type LegacyReplyId = "remember" | "warn" | "silence";

export const MODERN_QUESTION_IDS: readonly ModernQuestionId[] = [
  "alive",
  "restore",
  "break",
  "fourth",
];

export const LEGACY_REPLY_IDS: readonly LegacyReplyId[] = [
  "remember",
  "warn",
  "silence",
];

const MODERN_QUESTION_CHOICE_ID = "sarah_live_question";
const LEGACY_REPLY_CHOICE_ID = "next_user_1998_reply";

/**
 * The system receipt surfaced during RECALL_0314, keyed by outcome. Kept in
 * English in both locales — this is system output, same invariance convention
 * as `INDEX /JOIN`. None of these lines resolve presence or authorship.
 */
export const MODERN_QUESTION_RECEIPTS: Record<ModernQuestionOutcome, string> = {
  alive: "PRESENCE QUERY / STATUS UNRESOLVED",
  restore: "RESTORE REQUEST / TARGET EMPTY RECORD",
  break: "WRITE CANCELED / RECIPIENT FIELD RETAINED BLANK",
  fourth: "RECIPIENT TABLE / FIELD 04 ACTIVE",
  missed: "NO OUTBOUND MESSAGE / READ RECEIPT PRESENT",
};

/**
 * The line the modern question writes into DIALUP.LOG. A missed window writes
 * nothing outbound — its receipt notes the read receipt instead.
 */
export const MODERN_QUESTION_LOG_LINES: Record<ModernQuestionId, string> = {
  alive: "03:14:05 REMOTE BODY: ARE YOU ALIVE?",
  restore: "03:14:05 REMOTE BODY: CAN YOU BE RESTORED?",
  break: "03:14:05 REMOTE BODY: HOW DO WE BREAK THIS?",
  fourth: "03:14:05 REMOTE BODY: DID YOU WRITE THE FOURTH RECIPIENT?",
};

/** What a 1998 reply leaves behind, once the future log is solved. */
export type LegacyResidueTarget =
  /** A browser session recovered into history, already marked viewed. */
  | { kind: "browserHistory"; address: string; label: string }
  /** A field mutated in a recovered file (e.g. USERMAP.DAT display name). */
  | { kind: "fileField"; fileId: string; field: string; value: string }
  /** A zero-byte file returned to the Recycle Bin under a given owner. */
  | { kind: "recycleReturn"; fileId: string; owner: string; size: string };

export interface LegacyReplyResidue {
  replyId: LegacyReplyId;
  target: LegacyResidueTarget;
  /** Idempotent flags set when the residue materialises. */
  flagsSet: readonly string[];
  /** A line appended to DIALUP.LOG, if any. */
  dialupLine?: string;
  /** The single ending coda, independent of which ending was chosen. */
  coda: Record<Locale, string>;
}

export const LEGACY_REPLY_RESIDUES: Record<LegacyReplyId, LegacyReplyResidue> = {
  remember: {
    replyId: "remember",
    target: {
      kind: "browserHistory",
      address: "cache://sb-archive-02/history/0314",
      label: "session retained",
    },
    flagsSet: ["legacy_reply_remember_echo"],
    dialupLine: "SESSION RETAINED",
    coda: {
      en: "A session you never opened is marked as already read.",
      "pt-BR": "Uma sessão que você nunca abriu aparece como já lida.",
    },
  },
  warn: {
    replyId: "warn",
    target: {
      kind: "fileField",
      fileId: "legacy_usermap",
      field: "DISPLAY NAME",
      value: "[WITHHELD]",
    },
    flagsSet: ["legacy_reply_warn_echo"],
    coda: {
      en: "The name field is withheld now. The owner checksum still reads SAME.",
      "pt-BR":
        "O campo de nome agora está retido. O checksum de proprietário ainda diz SAME.",
    },
  },
  silence: {
    replyId: "silence",
    target: {
      kind: "recycleReturn",
      fileId: "empty_tmp",
      owner: "M.BISHOP",
      size: "0 KB",
    },
    flagsSet: ["legacy_reply_silence_echo"],
    coda: {
      en: "An empty file returns to the trash, filed under a profile that closed in 1998.",
      "pt-BR":
        "Um arquivo vazio retorna à lixeira, arquivado sob um perfil que se encerrou em 1998.",
    },
  },
};

const findChoice = (state: ProgressStateV3, choiceId: string) =>
  state.playerChoices.find((choice) => choice.choiceId === choiceId);

/**
 * The modern question outcome: the option the player picked, or "missed" once
 * the live window has closed unanswered. Returns null while the contact is
 * still unseen or active and no choice has been recorded yet.
 */
export const modernQuestionOutcome = (
  state: ProgressStateV3
): ModernQuestionOutcome | null => {
  const choice = findChoice(state, MODERN_QUESTION_CHOICE_ID);
  if (choice) {
    return MODERN_QUESTION_IDS.includes(choice.optionId as ModernQuestionId)
      ? (choice.optionId as ModernQuestionId)
      : null;
  }
  return state.liveContact.status === "closed" ? "missed" : null;
};

/** The RECALL_0314 receipt for the current outcome, or null if undecided. */
export const modernQuestionReceipt = (state: ProgressStateV3): string | null => {
  const outcome = modernQuestionOutcome(state);
  return outcome ? MODERN_QUESTION_RECEIPTS[outcome] : null;
};

/** The DIALUP.LOG line for the asked question; null when missed or undecided. */
export const modernQuestionLogLine = (state: ProgressStateV3): string | null => {
  const outcome = modernQuestionOutcome(state);
  return outcome && outcome !== "missed"
    ? MODERN_QUESTION_LOG_LINES[outcome]
    : null;
};

/** The 1998 reply the player sent, if any. */
export const legacyReplyId = (state: ProgressStateV3): LegacyReplyId | null => {
  const choice = findChoice(state, LEGACY_REPLY_CHOICE_ID);
  if (!choice) return null;
  return LEGACY_REPLY_IDS.includes(choice.optionId as LegacyReplyId)
    ? (choice.optionId as LegacyReplyId)
    : null;
};

/**
 * The persistent residue of the 1998 reply, surfaced only after the future log
 * is solved (matching `legacy_reply_echo`'s trigger). Null before then, or if
 * no reply was sent.
 */
export const legacyReplyResidue = (
  state: ProgressStateV3
): LegacyReplyResidue | null => {
  const reply = legacyReplyId(state);
  if (!reply) return null;
  if (!state.puzzles.future_log.solvedAt) return null;
  return LEGACY_REPLY_RESIDUES[reply];
};

/**
 * The single ending coda for the 1998 reply — one line, the same regardless of
 * which ending was chosen. Null until an ending is picked.
 */
export const legacyReplyCoda = (
  state: ProgressStateV3,
  locale: Locale = state.locale
): string | null => {
  const reply = legacyReplyId(state);
  if (!reply || !state.ending) return null;
  return LEGACY_REPLY_RESIDUES[reply].coda[locale];
};
