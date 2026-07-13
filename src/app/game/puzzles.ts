import {
  AttemptKind,
  GameEvent,
  HintChannel,
  HintTrigger,
  LIVE_CONTACT_WINDOW_MS,
  ProgressStateV3,
  PuzzleId,
} from "./progress";
import {
  actOneAnswerCount,
  canRunFinalIndex,
  findStatement,
  hasAllInsights,
  observerAnswerCount,
  validateStatement,
} from "./campaign";
import {
  evaluateTheory,
  evaluateTheoryAttempt,
  theoryConnectionKeys,
} from "./theories";
import { RunCommandError, validateIndexCommand } from "./validators";
import {
  canCompleteOptionalMission,
  optionalMission,
} from "./optionalMissions";
import {
  caseFindingAnnouncedFlag,
  puzzleProgressGate,
  syncCaseFindingAvailability,
} from "./investigativeProgression";

export const HINT_ONE_MS = 12 * 60 * 1000;
export const HINT_TWO_MS = 25 * 60 * 1000;
/** The first two puzzles form the trust contract — help arrives sooner there. */
const EARLY_HINT_ONE_MS = 8 * 60 * 1000;
const EARLY_HINT_PUZZLES: readonly PuzzleId[] = ["lot_114", "palimpsest"];
export const hintOneDelayFor = (puzzleId: PuzzleId): number =>
  EARLY_HINT_PUZZLES.includes(puzzleId) ? EARLY_HINT_ONE_MS : HINT_ONE_MS;

export const PUZZLE_HINTS: Record<PuzzleId, [string, string, string]> = {
  lot_114: [
    "The shipment, Miriam's accession note, and the missing volume describe the same object.",
    "The catalogue accepts several terms at once. Try provenance, year, lot, and volume.",
    "Search the Miskatonic catalogue for WHATELEY 1998 LOT 114 VOLUME II.",
  ],
  palimpsest: [
    "A scan can preserve the back of a page in the wrong orientation.",
    "The verso needs to be mirrored, inverted, and pushed past ordinary contrast.",
    "Use Mirror, Invert, then raise Contrast to 100 in Image Viewer.",
  ],
  margin_cipher: [
    "Bellaso is a person's name. Search the recovered web for it to learn which cipher this is.",
    "The key is the first person who catalogued this collection.",
    "Choose Vigenere in Cipher Lab and use MIRIAM as the key.",
  ],
  counting_audio: [
    "The decoded margin describes controls, not prose.",
    "The useful voice is in the left channel and was recorded backwards.",
    "In Media Player choose Left, enable Reverse, and play the 4:11 recording.",
  ],
  lineage: [
    "Write down the gap between each pair of archive years, then compare the resulting intervals.",
    "Each interval retains roughly three quarters of the previous interval.",
    "The gaps are 65, 49, 37, 28, 21, 16, then about 12. Add 12 to 2014 and search the result.",
  ],
  future_log: [
    "The short DOS names can be matched to the Alias field in file Properties.",
    "Only the three operations in the future log matter, and their order matters.",
    "Mirror the scan, play counting.wav left/reversed, then open the_name.txt.",
  ],
  index_name: [
    "The four changing objects now expose short reference codes in their metadata.",
    "INDEX.HLP gives the command shape; the future timestamps give the order.",
    "Run INDEX /JOIN E7-A1-C4-B9.",
  ],
};

export const PUZZLE_HINTS_PT: Record<PuzzleId, [string, string, string]> = {
  lot_114: [
    "O envio, a nota de incorporação de Miriam e o volume ausente descrevem o mesmo objeto.",
    "O catálogo aceita vários termos ao mesmo tempo. Tente proveniência, ano, lote e volume.",
    "Pesquise no catálogo por WHATELEY 1998 LOTE 114 VOLUME II.",
  ],
  palimpsest: [
    "Um scan pode preservar o verso de uma página na orientação errada.",
    "O verso precisa ser espelhado, invertido e levado além do contraste normal.",
    "Use Mirror, Invert e aumente Contrast para 100 no Image Viewer.",
  ],
  margin_cipher: [
    "Bellaso é o nome de uma pessoa. Pesquise no cache para descobrir qual cifra ele descreveu.",
    "A chave é a primeira pessoa que catalogou esta coleção.",
    "Escolha Vigenere no Cipher Lab e use MIRIAM como chave.",
  ],
  counting_audio: [
    "A margem decifrada descreve controles, não prosa.",
    "A voz útil está no canal esquerdo e foi gravada ao contrário.",
    "No Media Player escolha Left, ative Reverse e reproduza a gravação de 4:11.",
  ],
  lineage: [
    "Anote a diferença entre cada par de anos do arquivo e depois compare os intervalos obtidos.",
    "Cada intervalo mantém aproximadamente três quartos do intervalo anterior.",
    "Os intervalos são 65, 49, 37, 28, 21, 16 e depois cerca de 12. Some 12 a 2014 e pesquise o resultado.",
  ],
  future_log: [
    "Os nomes DOS abreviados podem ser comparados ao campo Alias nas Propriedades.",
    "Somente as três operações do log futuro importam, e a ordem também.",
    "Espelhe o scan, reproduza counting.wav no canal esquerdo e reverso, depois abra the_name.txt.",
  ],
  index_name: [
    "Os quatro objetos alterados agora exibem pequenas referências em seus metadados.",
    "INDEX.HLP fornece a sintaxe; os horários futuros fornecem a ordem.",
    "Execute INDEX /JOIN E7-A1-C4-B9.",
  ],
};

export const puzzleHintsFor = (
  locale: "en" | "pt-BR",
  puzzleId: PuzzleId
): [string, string, string] =>
  locale === "pt-BR" ? PUZZLE_HINTS_PT[puzzleId] : PUZZLE_HINTS[puzzleId];

export const FUTURE_SEQUENCE = [
  "image:mirror",
  "audio:left-reverse",
  "file:the_name",
] as const;

const normalizeCommand = (command: string): string =>
  command.trim().toUpperCase().replace(/\s+/g, " ");

export interface EventResult {
  state: ProgressStateV3;
  solvedPuzzle?: PuzzleId;
  sequenceFault?: boolean;
  commandAccepted?: boolean;
  commandError?: RunCommandError;
  puzzleBlocked?: {
    puzzleId: PuzzleId;
    reason: "casefile_required" | "previous_puzzle_required";
    findingId?: string;
    insightId?: string;
    previousPuzzleId?: PuzzleId;
  };
  hintUnlocked?: { puzzleId: PuzzleId; level: number; trigger: HintTrigger };
  theoryResult?: {
    insightId: string | null;
    alreadyKnown: boolean;
    matchedCount: number;
    requiredCount: number;
    missingKinds: string[];
  };
  caseAnswerResult?: {
    questionId: string;
    accepted: boolean;
    reason: string;
    slotResults?: Record<string, boolean>;
    lockedSlots?: string[];
  };
}

const touch = (state: ProgressStateV3): ProgressStateV3 => ({
  ...syncCaseFindingAvailability(state),
  revision: state.revision + 1,
  updatedAt: Date.now(),
});

const blockedPuzzleResult = (
  state: ProgressStateV3,
  puzzleId: PuzzleId
): EventResult | null => {
  const gate = puzzleProgressGate(state, puzzleId);
  if (gate.allowed) return null;
  return {
    state,
    puzzleBlocked: {
      puzzleId,
      reason: gate.reason ?? "casefile_required",
      ...(gate.requirement?.kind === "finding"
        ? { findingId: gate.requirement.findingId }
        : gate.requirement?.kind === "insight"
          ? { insightId: gate.requirement.insightId }
          : {}),
      ...(gate.previousPuzzleId ? { previousPuzzleId: gate.previousPuzzleId } : {}),
    },
  };
};

const uniquePush = (values: string[], value: string): string[] =>
  values.includes(value) ? values : [...values, value];

const uniquePushTyped = <T extends string>(values: T[], value: T): T[] =>
  values.includes(value) ? values : [...values, value];

const OPTIONAL_EVIDENCE_IDS = new Set([
  "paint_doodles",
  "dad_recipe",
  "midi_collection",
  "lecture_draft",
  "solitaire_save",
  "tom_homepage",
  "containment_utility",
  "calendar_0316",
  "voicemail_to_em",
  "reasons_to_stop",
  "read_receipts",
  "hash_manifest",
  "unsent_to_dad",
  "desk_inventory",
  "printer_alignment",
  "browser_history_0316",
  "em_draft_reply",
  "field_04",
  "do_not_catalogue",
]);

const DEFAULT_HINT_CHANNEL: Record<PuzzleId, HintChannel> = {
  lot_114: "search",
  palimpsest: "metadata",
  margin_cipher: "draft",
  counting_audio: "metadata",
  lineage: "search",
  future_log: "log",
  index_name: "system",
};

const unlockPuzzleHint = (
  state: ProgressStateV3,
  puzzleId: PuzzleId,
  level: number,
  trigger: HintTrigger,
  channel = DEFAULT_HINT_CHANNEL[puzzleId]
): ProgressStateV3 => {
  const puzzle = state.puzzles[puzzleId];
  const nextLevel = Math.min(3, Math.max(puzzle.hintsUnlocked, level));
  if (nextLevel === puzzle.hintsUnlocked) return state;
  return {
    ...state,
    puzzles: {
      ...state.puzzles,
      [puzzleId]: {
        ...puzzle,
        hintsUnlocked: nextLevel,
        hintHistory: [
          ...puzzle.hintHistory,
          {
            level: nextLevel,
            trigger,
            channel,
            unlockedAt: Date.now(),
          },
        ],
      },
    },
  };
};

const applyNearMiss = (
  state: ProgressStateV3,
  puzzleId: PuzzleId,
  kind: AttemptKind,
  channel?: HintChannel
): { state: ProgressStateV3; unlockedLevel?: number } => {
  const puzzle = state.puzzles[puzzleId];
  if (puzzle.solvedAt) return { state };
  const nextCount = (puzzle.nearMisses[kind] ?? 0) + 1;
  const nearMisses = { ...puzzle.nearMisses, [kind]: nextCount };
  const total = Object.values(nearMisses).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  );
  let nextState: ProgressStateV3 = {
    ...state,
    puzzles: {
      ...state.puzzles,
      [puzzleId]: {
        ...puzzle,
        nearMisses,
        lastMeaningfulProgressAt: Date.now(),
      },
    },
  };
  const requestedLevel = total >= 5 ? 2 : total >= 2 ? 1 : 0;
  if (requestedLevel > puzzle.hintsUnlocked) {
    nextState = unlockPuzzleHint(
      nextState,
      puzzleId,
      requestedLevel,
      "near_miss",
      channel
    );
    return { state: nextState, unlockedLevel: requestedLevel };
  }
  return { state: nextState };
};

/**
 * Optional Casefile reward, tier two: three retained act-one findings AND the
 * solved Lot 114 query recover MIRIAM_DRAFT.PRN plus the historical dossiers.
 * Never advances the investigation stage — that derives from puzzles alone.
 */
const applyActOneReconstruction = (
  state: ProgressStateV3
): ProgressStateV3 => {
  if (state.flags.act1_reconstruction_complete) return state;
  if (!state.puzzles.lot_114.solvedAt) return state;
  if (actOneAnswerCount(state) < 3) return state;
  return {
    ...state,
    flags: {
      ...state.flags,
      act1_reconstruction_complete: true,
      miriam_draft_arrived: true,
    },
    narrativeBeatsSeen: uniquePushTyped(
      uniquePushTyped(state.narrativeBeatsSeen, "act1_reconstructed"),
      "miriam_draft_printed"
    ),
    worldReactionsSeen: uniquePushTyped(
      uniquePushTyped(state.worldReactionsSeen, "printer_wake"),
      "empty_chair"
    ),
    leadsUnlocked: uniquePushTyped(
      uniquePushTyped(state.leadsUnlocked, "historical"),
      "acoustic"
    ),
  };
};

const solve = (
  state: ProgressStateV3,
  puzzleId: PuzzleId,
  solvedAt = Date.now()
): ProgressStateV3 => {
  if (state.puzzles[puzzleId].solvedAt) return state;
  const order = Object.keys(state.puzzles) as PuzzleId[];
  const index = order.indexOf(puzzleId);
  const nextId = order[index + 1];
  const puzzles = {
    ...state.puzzles,
    [puzzleId]: {
      ...state.puzzles[puzzleId],
      solvedAt,
      lastMeaningfulProgressAt: solvedAt,
    },
  };
  if (nextId && puzzles[nextId].availableAt == null) {
    puzzles[nextId] = { ...puzzles[nextId], availableAt: solvedAt };
  }
  const solvedState: ProgressStateV3 = {
    ...state,
    puzzles,
    leadsUnlocked:
      puzzleId === "lineage"
        ? uniquePushTyped(state.leadsUnlocked, "observer")
        : state.leadsUnlocked,
    narrativeBeatsSeen:
      puzzleId === "lineage"
        ? uniquePushTyped(state.narrativeBeatsSeen, "sarah_msn_live")
        : state.narrativeBeatsSeen,
    worldReactionsSeen:
      puzzleId === "lineage"
        ? uniquePushTyped(
            uniquePushTyped(state.worldReactionsSeen, "clock_lost_second"),
            "contact_typing"
          )
        : puzzleId === "lot_114"
          ? uniquePushTyped(state.worldReactionsSeen, "status_sheet")
          : state.worldReactionsSeen,
    flags: {
      ...state.flags,
      [`puzzle_${puzzleId}_solved`]: true,
      ...(puzzleId === "lineage"
        ? { sarah_email_arrived: true, sarah_msn_live: true }
        : {}),
      ...(puzzleId === "index_name" ? { endgame_available: true } : {}),
    },
  };
  // Three findings may have been retained before the first puzzle was solved;
  // the tier-two reward completes as soon as both halves of its gate hold.
  return puzzleId === "lot_114"
    ? applyActOneReconstruction(solvedState)
    : solvedState;
};

export const reduceGameEvent = (
  current: ProgressStateV3,
  event: GameEvent
): EventResult => {
  if (event.type === "HYDRATE" || event.type === "RESET") {
    return { state: event.state };
  }

  // A selected ending is a hard narrative boundary. The aftermath may retain
  // reading history and investigator-owned presentation state, but it must
  // never let an old UI callback unlock content, advance a puzzle, or change
  // the final disposition. `ending_closure_seen` is deliberately the only
  // post-ending flag: it records that the player acknowledged the conclusion.
  if (current.ending) {
    const isSafeAftermathEvent =
      event.type === "MARK_FILE_READ" ||
      event.type === "MARK_EMAIL_READ" ||
      event.type === "SET_CASE_NOTES" ||
      event.type === "SET_LAST_RESOURCE" ||
      event.type === "MOVE_BOARD_CARD" ||
      event.type === "TOGGLE_BOARD_CONNECTION" ||
      event.type === "RESET_BOARD_LAYOUT" ||
      event.type === "SET_LOCALE" ||
      event.type === "TOUCH_SEEN" ||
      (event.type === "SET_FLAG" && event.flag === "ending_closure_seen");
    if (!isSafeAftermathEvent) return { state: current };
  }

  let state = current;
  switch (event.type) {
    case "SET_FLAG":
      if (!state.flags[event.flag]) {
        state = { ...state, flags: { ...state.flags, [event.flag]: true } };
      }
      break;
    case "CLEAR_FLAG":
      if (state.flags[event.flag]) {
        state = { ...state, flags: { ...state.flags, [event.flag]: false } };
      }
      break;
    case "MARK_FILE_READ":
      if (
        state.readFileIds.includes(event.fileId) &&
        state.lastResourceId === event.fileId
      ) {
        break;
      }
      state = {
        ...state,
        readFileIds: uniquePush(state.readFileIds, event.fileId),
        lastResourceId: event.fileId,
      };
      break;
    case "MARK_EMAIL_READ":
      if (
        state.readEmailIds.includes(event.emailId) &&
        state.lastResourceId === event.emailId
      ) {
        break;
      }
      state = {
        ...state,
        readEmailIds: uniquePush(state.readEmailIds, event.emailId),
        lastResourceId: event.emailId,
      };
      break;
    case "DISCOVER_EVIDENCE": {
      const nextResourceId = event.resourceId ?? state.lastResourceId;
      if (
        state.discoveredEvidenceIds.includes(event.evidenceId) &&
        state.lastResourceId === nextResourceId
      ) {
        break;
      }
      state = {
        ...state,
        discoveredEvidenceIds: uniquePush(
          state.discoveredEvidenceIds,
          event.evidenceId
        ),
        lastResourceId: nextResourceId,
        optionalDiscoveries: OPTIONAL_EVIDENCE_IDS.has(event.evidenceId)
          ? uniquePushTyped(
              state.optionalDiscoveries,
              event.evidenceId as (typeof state.optionalDiscoveries)[number]
            )
          : state.optionalDiscoveries,
      };
      break;
    }
    case "VISIT_PAGE":
      if (
        state.visitedPageIds.includes(event.pageId) &&
        state.lastResourceId === event.pageId
      ) {
        break;
      }
      state = {
        ...state,
        visitedPageIds: uniquePush(state.visitedPageIds, event.pageId),
        lastResourceId: event.pageId,
      };
      break;
    case "ATTEMPT_PUZZLE":
      state = {
        ...state,
        puzzles: {
          ...state.puzzles,
          [event.puzzleId]: {
            ...state.puzzles[event.puzzleId],
            attempts: state.puzzles[event.puzzleId].attempts + 1,
          },
        },
      };
      break;
    case "RECORD_NEAR_MISS": {
      const result = applyNearMiss(
        state,
        event.puzzleId,
        event.kind,
        event.channel
      );
      state = result.state;
      if (result.unlockedLevel) {
        return {
          state: touch(state),
          hintUnlocked: {
            puzzleId: event.puzzleId,
            level: result.unlockedLevel,
            trigger: "near_miss",
          },
        };
      }
      break;
    }
    case "SOLVE_PUZZLE": {
      const wasSolved = Boolean(state.puzzles[event.puzzleId].solvedAt);
      if (wasSolved) return { state: current };
      const blocked = blockedPuzzleResult(state, event.puzzleId);
      if (blocked) return blocked;
      state = solve(state, event.puzzleId, event.solvedAt);
      return {
        state: touch(state),
        solvedPuzzle: event.puzzleId,
      };
    }
    case "UNLOCK_HINT": {
      const currentLevel = state.puzzles[event.puzzleId].hintsUnlocked;
      const level = Math.min(3, Math.max(currentLevel, event.level ?? currentLevel + 1));
      if (level === currentLevel) break;
      state = unlockPuzzleHint(
        state,
        event.puzzleId,
        level,
        event.trigger ?? "manual",
        event.channel ?? "help"
      );
      return {
        state: touch(state),
        hintUnlocked: {
          puzzleId: event.puzzleId,
          level,
          trigger: event.trigger ?? "manual",
        },
      };
    }
    case "ADD_ACTIVE_TIME": {
      const puzzle = state.puzzles[event.puzzleId];
      if (!puzzle.solvedAt) {
        let hintsUnlocked = puzzle.hintsUnlocked;
        const activeMs = puzzle.activeMs + Math.max(0, event.elapsedMs);
        if (activeMs >= HINT_TWO_MS) hintsUnlocked = Math.max(hintsUnlocked, 2);
        else if (activeMs >= hintOneDelayFor(event.puzzleId))
          hintsUnlocked = Math.max(hintsUnlocked, 1);
        state = {
          ...state,
          puzzles: {
            ...state.puzzles,
            [event.puzzleId]: { ...puzzle, activeMs },
          },
        };
        if (hintsUnlocked > puzzle.hintsUnlocked) {
          state = unlockPuzzleHint(
            state,
            event.puzzleId,
            hintsUnlocked,
            "time"
          );
          return {
            state: touch(state),
            hintUnlocked: {
              puzzleId: event.puzzleId,
              level: hintsUnlocked,
              trigger: "time",
            },
          };
        }
      }
      break;
    }
    case "COLLECT_REFERENCE": {
      const reference = event.reference.toUpperCase();
      if (state.collectedReferences.includes(reference)) break;
      state = {
        ...state,
        collectedReferences: [...state.collectedReferences, reference],
      };
      break;
    }
    case "COLLECT_TOKEN": {
      if (state.collectedTokens.includes(event.tokenId)) break;
      state = {
        ...state,
        collectedTokens: [...state.collectedTokens, event.tokenId],
      };
      break;
    }
    case "SET_PLAYER_NAME":
      if (state.playerName === event.name) break;
      state = { ...state, playerName: event.name };
      break;
    case "SET_CASE_NOTES":
      if (state.caseNotes === event.notes) break;
      state = { ...state, caseNotes: event.notes };
      break;
    case "SET_LAST_RESOURCE":
      if (state.lastResourceId === event.resourceId) break;
      state = { ...state, lastResourceId: event.resourceId };
      break;
    case "FUTURE_SEQUENCE_ACTION": {
      if (!state.puzzles.lineage.solvedAt || state.puzzles.future_log.solvedAt) break;
      const blocked = blockedPuzzleResult(state, "future_log");
      if (blocked) return blocked;
      const expected = FUTURE_SEQUENCE[state.futureSequenceStep];
      if (event.action === expected) {
        const nextStep = state.futureSequenceStep + 1;
        state = { ...state, futureSequenceStep: nextStep };
        if (nextStep === FUTURE_SEQUENCE.length) {
          state = solve(state, "future_log");
          return {
            state: touch(state),
            solvedPuzzle: "future_log",
            commandAccepted: true,
          };
        }
      } else if (
        event.action.startsWith("image:") ||
        event.action.startsWith("audio:") ||
        event.action.startsWith("file:")
      ) {
        state = {
          ...state,
          futureSequenceStep: 0,
          futureSequenceFaults: state.futureSequenceFaults + 1,
        };
        const nearMiss = applyNearMiss(
          state,
          "future_log",
          "future_sequence_fault",
          "log"
        );
        return {
          state: touch(nearMiss.state),
          sequenceFault: true,
          ...(nearMiss.unlockedLevel
            ? {
                hintUnlocked: {
                  puzzleId: "future_log" as const,
                  level: nearMiss.unlockedLevel,
                  trigger: "near_miss" as const,
                },
              }
            : {}),
        };
      }
      break;
    }
    case "RUN_COMMAND": {
      const command = normalizeCommand(event.command);
      const heldBlockCommand = "VERIFY SB-0316 /HOLD 04";
      if (command === heldBlockCommand) {
        if (canCompleteOptionalMission(state, "tom_held_block")) {
          const mission = optionalMission("tom_held_block")!;
          state = {
            ...state,
            optionalDiscoveries: uniquePushTyped(
              state.optionalDiscoveries,
              mission.id
            ),
            worldReactionsSeen: uniquePushTyped(
              state.worldReactionsSeen,
              mission.reactionId
            ),
          };
          return { state: touch(state), commandAccepted: true };
        }
        return { state: current, commandError: "hold_unavailable" };
      }
      const incompleteRestoreCommand = "INDEX /RESTORE /INCOMPLETE";
      if (command === incompleteRestoreCommand) {
        if (
          state.flags.directory_gap_solved &&
          state.flags.three_times_solved &&
          state.flags.silent_call_solved &&
          state.readFileIds.includes("counter_index_note")
        ) {
          state = {
            ...state,
            flags: {
              ...state.flags,
              incomplete_restore_prepared: true,
            },
          };
          return { state: touch(state), commandAccepted: true };
        }
        return { state: current, commandError: "case_incomplete" };
      }
      const sealCommand = "INDEX /SEAL RELAY-07 /WITNESS ARCHIVE";
      if (command === sealCommand) {
        if (
          state.puzzles.index_name.solvedAt &&
          hasAllInsights(state) &&
          observerAnswerCount(state) === 3
        ) {
          state = {
            ...state,
            flags: {
              ...state.flags,
              secret_ending_available: true,
              seal_relay_prepared: true,
            },
            narrativeBeatsSeen: uniquePushTyped(
              state.narrativeBeatsSeen,
              "observer_reconstructed"
            ),
            worldReactionsSeen: uniquePushTyped(
              state.worldReactionsSeen,
              "self_indexed"
            ),
          };
          return {
            state: touch(state),
            commandAccepted: true,
          };
        }
        return {
          state: current,
          commandError: "seal_unavailable",
        };
      }
      const validation = validateIndexCommand(
        command,
        state.collectedReferences
      );
      const indexGate = blockedPuzzleResult(state, "index_name");
      if (
        validation.accepted &&
        state.puzzles.future_log.solvedAt &&
        canRunFinalIndex(state) &&
        !indexGate
      ) {
        state = solve(state, "index_name");
        return {
          state: touch(state),
          solvedPuzzle: "index_name",
          commandAccepted: true,
        };
      }
      if (
        validation.accepted &&
        state.puzzles.future_log.solvedAt &&
        (!canRunFinalIndex(state) || indexGate)
      ) {
        return {
          state: current,
          commandError: "case_incomplete",
        };
      }
      if (state.puzzles.future_log.solvedAt) {
        const kind =
          validation.error === "wrong_order"
            ? "index_wrong_order"
            : validation.error === "missing_references"
              ? "index_missing_references"
              : null;
        if (kind) {
          const nearMiss = applyNearMiss(state, "index_name", kind, "system");
          state = nearMiss.state;
        }
      }
      return {
        state: state === current ? current : touch(state),
        commandError: state.puzzles.future_log.solvedAt
          ? validation.error ?? "invalid_command"
          : "invalid_command",
      };
    }
    case "CHOOSE_ENDING":
      // The first disposition is canonical. Reopening the recovered program
      // may replay its result, but cannot accumulate mutually exclusive flags.
      if (state.ending) break;
      if (
        event.ending === "seal" &&
        (!state.flags.secret_ending_available || !hasAllInsights(state))
      ) {
        break;
      }
      if (event.ending === "leave_blank" && !state.flags.endgame_available) {
        break;
      }
      // The break protocol can be retained either live (Sarah's answer to the
      // `break` question) or later, from the recovered technical cache
      // fragment (`break_protocol_recovered`). Either path opens the gate.
      if (
        event.ending === "archive_self" &&
        (!state.flags.secret_ending_available ||
          !hasAllInsights(state) ||
          !state.discoveredEvidenceIds.includes("hash_manifest") ||
          !(
            state.playerChoices.some(
              (choice) =>
                choice.choiceId === "sarah_live_question" &&
                choice.optionId === "break"
            ) || state.flags.break_protocol_recovered
          ))
      ) {
        break;
      }
      state = {
        ...state,
        ending: event.ending,
        narrativeBeatsSeen:
          event.ending === "seal"
            ? uniquePushTyped(state.narrativeBeatsSeen, "relay_sealed")
            : event.ending === "leave_blank"
              ? uniquePushTyped(state.narrativeBeatsSeen, "blank_left")
              : event.ending === "archive_self"
                ? uniquePushTyped(state.narrativeBeatsSeen, "observer_archived")
            : state.narrativeBeatsSeen,
        worldReactionsSeen:
          event.ending === "seal"
            ? uniquePushTyped(state.worldReactionsSeen, "case_code_drift")
            : event.ending === "leave_blank"
              ? uniquePushTyped(state.worldReactionsSeen, "blank_space")
              : event.ending === "archive_self"
                ? uniquePushTyped(state.worldReactionsSeen, "observer_filed")
            : state.worldReactionsSeen,
        flags: {
          ...state.flags,
          [`ending_${event.ending}`]: true,
        },
      };
      break;
    case "MOVE_BOARD_CARD":
      state = {
        ...state,
        boardPositions: {
          ...state.boardPositions,
          [event.cardId]: { x: event.x, y: event.y },
        },
      };
      break;
    case "TOGGLE_BOARD_CONNECTION": {
      const key = [event.fromId, event.toId].sort().join("|");
      state = {
        ...state,
        boardConnections: state.boardConnections.includes(key)
          ? state.boardConnections.filter((existing) => existing !== key)
          : [...state.boardConnections, key],
      };
      break;
    }
    case "TEST_THEORY": {
      const evidenceIds = Array.from(new Set(event.evidenceIds)).sort();
      const evaluation = event.targetInsightId
        ? evaluateTheoryAttempt(event.targetInsightId, evidenceIds)
        : {
            insightId: evaluateTheory(evidenceIds),
            matchedCount: 0,
            requiredCount: 0,
            missingKinds: [],
          };
      const insightId = evaluation.insightId;
      const alreadyKnown = Boolean(
        insightId && state.insightsUnlocked.includes(insightId)
      );
      const insightsUnlocked =
        insightId && !alreadyKnown
          ? [...state.insightsUnlocked, insightId]
          : state.insightsUnlocked;
      const newKeys = insightId ? theoryConnectionKeys(insightId, evidenceIds) : [];
      const confirmedConnections = newKeys.length
        ? Array.from(new Set([...state.confirmedConnections, ...newKeys]))
        : state.confirmedConnections;
      state = {
        ...state,
        insightsUnlocked,
        confirmedConnections,
        theoryAttempts: [
          ...state.theoryAttempts,
          {
            evidenceIds,
            attemptedAt: Date.now(),
            insightId,
            ...(event.targetInsightId
              ? { targetInsightId: event.targetInsightId }
              : {}),
          },
        ],
        flags: {
          ...state.flags,
          ...(insightId ? { [`insight_${insightId}`]: true } : {}),
          ...(insightsUnlocked.length === 6
            ? { postgame_lore_ready: true }
            : {}),
        },
      };
      return {
        state: touch(state),
        theoryResult: {
          insightId,
          alreadyKnown,
          matchedCount: evaluation.matchedCount,
          requiredCount: evaluation.requiredCount,
          missingKinds: evaluation.missingKinds,
        },
      };
    }
    case "SUBMIT_CASE_ANSWER": {
      const evidenceIds = Array.from(new Set(event.evidenceIds)).sort();
      const validation = validateStatement(
        event.questionId,
        event.slotSelections,
        evidenceIds
      );
      const existing = state.caseAnswers[event.questionId];
      if (existing?.solvedAt) {
        return {
          state: current,
          caseAnswerResult: {
            questionId: event.questionId,
            accepted: true,
            reason: "already_solved",
            slotResults: validation.slots,
            lockedSlots: existing.lockedSlots,
          },
        };
      }

      const evidenceHolds = validation.evidence === "ok";
      const newlyLocked = evidenceHolds
        ? Object.entries(validation.slots)
            .filter(([, correct]) => correct)
            .map(([slot]) => slot)
        : [];
      const lockedSlots = Array.from(
        new Set([...(existing?.lockedSlots ?? []), ...newlyLocked])
      );
      const statement = findStatement(event.questionId);
      const requiredSlotCount = statement?.slots.length ?? Number.MAX_SAFE_INTEGER;
      const solved = lockedSlots.length === requiredSlotCount && evidenceHolds;
      const retainedSlots = Object.fromEntries(
        Object.entries({
          ...(existing?.slots ?? {}),
          ...event.slotSelections,
        }).filter(([slot]) => lockedSlots.includes(slot))
      );
      const now = Date.now();
      const wrongSlotCount = Object.values(validation.slots).filter(
        (correct) => !correct
      ).length;
      const nearMisses = {
        ...(existing?.nearMisses ?? {}),
        ...(wrongSlotCount > 0
          ? {
              statement_slot:
                (existing?.nearMisses.statement_slot ?? 0) + wrongSlotCount,
            }
          : {}),
        ...(validation.evidence !== "ok"
          ? {
              statement_evidence:
                (existing?.nearMisses.statement_evidence ?? 0) + 1,
            }
          : {}),
      };
      state = {
        ...state,
        caseAnswers: {
          ...state.caseAnswers,
          [event.questionId]: {
            slots: retainedSlots,
            lockedSlots,
            evidenceIds: evidenceHolds
              ? evidenceIds
              : existing?.evidenceIds ?? [],
            attempts: (existing?.attempts ?? 0) + 1,
            nearMisses,
            solvedAt: solved ? now : null,
          },
        },
      };

      if (!solved) {
        const hasCorrectSlot = Object.values(validation.slots).some(Boolean);
        return {
          state: touch(state),
          caseAnswerResult: {
            questionId: event.questionId,
            accepted: false,
            reason:
              validation.evidence !== "ok"
                ? validation.evidence
                : hasCorrectSlot
                  ? "partial_lock"
                  : "slots_rejected",
            slotResults: validation.slots,
            lockedSlots,
          },
        };
      }
      const actOneCount = actOneAnswerCount(state);
      const observerCount = observerAnswerCount(state);
      if (actOneCount >= 2) {
        // Tier-one reward: a discreet world reaction plus the human-context
        // records. Never opens RECOVERED and never moves the stage.
        state = {
          ...state,
          flags: {
            ...state.flags,
            act1_recovered_partial: true,
          },
          narrativeBeatsSeen: uniquePushTyped(
            state.narrativeBeatsSeen,
            "act1_partial_recovery"
          ),
          worldReactionsSeen: uniquePushTyped(
            state.worldReactionsSeen,
            "monitor_condensation"
          ),
          leadsUnlocked: uniquePushTyped(state.leadsUnlocked, "manuscript"),
        };
      }
      state = applyActOneReconstruction(state);
      if (observerCount === 3) {
        state = {
          ...state,
          flags: {
            ...state.flags,
            observer_reconstruction_complete: true,
          },
          narrativeBeatsSeen: uniquePushTyped(
            state.narrativeBeatsSeen,
            "observer_reconstructed"
          ),
        };
      }
      return {
        state: touch(state),
        caseAnswerResult: {
          questionId: event.questionId,
          accepted: true,
          reason: "accepted",
          slotResults: validation.slots,
          lockedSlots,
        },
      };
    }
    case "SET_HYPOTHESIS":
      state = {
        ...state,
        hypotheses: {
          ...state.hypotheses,
          [event.hypothesisId]: {
            status: event.status,
            evidenceIds: Array.from(new Set(event.evidenceIds)).sort(),
            updatedAt: Date.now(),
          },
        },
      };
      break;
    case "MARK_CASE_FINDING_ANNOUNCED":
      if (state.announcedCaseFindingIds.includes(event.findingId)) break;
      state = {
        ...state,
        announcedCaseFindingIds: [
          ...state.announcedCaseFindingIds,
          event.findingId,
        ],
        flags: {
          ...state.flags,
          [caseFindingAnnouncedFlag(event.findingId)]: true,
        },
      };
      break;
    case "MARK_CASE_FINDING_VIEWED":
      if (state.viewedCaseFindingIds.includes(event.findingId)) break;
      state = {
        ...state,
        viewedCaseFindingIds: [...state.viewedCaseFindingIds, event.findingId],
      };
      break;
    case "UNLOCK_LEAD":
      if (state.leadsUnlocked.includes(event.leadId)) break;
      state = {
        ...state,
        leadsUnlocked: [...state.leadsUnlocked, event.leadId],
      };
      break;
    case "SEE_NARRATIVE_BEAT":
      if (state.narrativeBeatsSeen.includes(event.beatId)) break;
      state = {
        ...state,
        narrativeBeatsSeen: [...state.narrativeBeatsSeen, event.beatId],
      };
      break;
    case "TRIGGER_WORLD_REACTION":
      if (state.worldReactionsSeen.includes(event.reactionId)) break;
      state = {
        ...state,
        worldReactionsSeen: [...state.worldReactionsSeen, event.reactionId],
      };
      break;
    case "RECORD_CHOICE":
      if (
        state.playerChoices.some(
          (choice) => choice.choiceId === event.choiceId
        )
      ) {
        break;
      }
      state = {
        ...state,
        playerChoices: [
          ...state.playerChoices,
          {
            choiceId: event.choiceId,
            optionId: event.optionId,
            chosenAt: Date.now(),
          },
        ],
        // Keep the persisted live-contact record in sync with the choices it
        // is derived from. A closed contact can never be reopened.
        liveContact:
          event.choiceId === "sarah_live_seen" &&
          state.liveContact.status === "unseen"
            ? { ...state.liveContact, status: "active" }
            : event.choiceId === "sarah_live_question"
              ? { status: "closed", activeMs: LIVE_CONTACT_WINDOW_MS }
              : state.liveContact,
      };
      break;
    case "ADVANCE_LIVE_CONTACT": {
      // The 120s window only spends while the Messenger is visible, focused
      // and uncovered — the component gates what it reports here. Once the
      // window is consumed the record closes for good, and the unanswered
      // question is committed as "missed" so the conversation can never be
      // repeated (RECORD_CHOICE dedupes on choiceId).
      if (state.liveContact.status !== "active") break;
      const elapsed = Math.max(0, event.elapsedMs);
      if (elapsed === 0) break;
      const activeMs = Math.min(
        LIVE_CONTACT_WINDOW_MS,
        state.liveContact.activeMs + elapsed
      );
      const consumed = activeMs >= LIVE_CONTACT_WINDOW_MS;
      state = {
        ...state,
        liveContact: { activeMs, status: consumed ? "closed" : "active" },
        playerChoices:
          consumed &&
          !state.playerChoices.some(
            (choice) => choice.choiceId === "sarah_live_question"
          )
            ? [
                ...state.playerChoices,
                {
                  choiceId: "sarah_live_question",
                  optionId: "missed",
                  chosenAt: Date.now(),
                },
              ]
            : state.playerChoices,
      };
      break;
    }
    case "DISCOVER_OPTIONAL":
      if (state.optionalDiscoveries.includes(event.discoveryId)) break;
      state = {
        ...state,
        optionalDiscoveries: [
          ...state.optionalDiscoveries,
          event.discoveryId,
        ],
      };
      break;
    case "COMPLETE_OPTIONAL_MISSION": {
      if (!canCompleteOptionalMission(state, event.missionId)) break;
      const mission = optionalMission(event.missionId);
      if (!mission) break;
      state = {
        ...state,
        optionalDiscoveries: uniquePushTyped(
          state.optionalDiscoveries,
          mission.id
        ),
        worldReactionsSeen: uniquePushTyped(
          state.worldReactionsSeen,
          mission.reactionId
        ),
      };
      break;
    }
    case "SEE_ASSET_VARIANT":
      if (state.assetVariantsSeen.includes(event.variantId)) break;
      state = {
        ...state,
        assetVariantsSeen: [...state.assetVariantsSeen, event.variantId],
      };
      break;
    case "RESET_BOARD_LAYOUT":
      if (Object.keys(state.boardPositions).length === 0) break;
      state = { ...state, boardPositions: {} };
      break;
    case "SET_LOCALE":
      if (state.locale === event.locale) break;
      state = { ...state, locale: event.locale };
      break;
    case "TOUCH_SEEN":
      if (
        state.firstSeenAt !== null &&
        state.lastSeenAt === event.now
      ) {
        break;
      }
      state = {
        ...state,
        firstSeenAt: state.firstSeenAt ?? event.now,
        lastSeenAt: event.now,
      };
      break;
  }

  return { state: state === current ? current : touch(state) };
};
