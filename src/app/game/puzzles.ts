import {
  AttemptKind,
  GameEvent,
  HintChannel,
  HintTrigger,
  ProgressStateV3,
  PuzzleId,
} from "./progress";
import { evaluateTheory, theoryConnectionKeys } from "./theories";
import { RunCommandError, validateIndexCommand } from "./validators";

export const HINT_ONE_MS = 12 * 60 * 1000;
export const HINT_TWO_MS = 25 * 60 * 1000;

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
    "The archive years are not evenly spaced. Compare each gap with the one before it.",
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
    "Os anos do arquivo não têm distâncias iguais. Compare cada intervalo com o anterior.",
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
  hintUnlocked?: { puzzleId: PuzzleId; level: number; trigger: HintTrigger };
  theoryResult?: { insightId: string | null; alreadyKnown: boolean };
}

const touch = (state: ProgressStateV3): ProgressStateV3 => ({
  ...state,
  revision: state.revision + 1,
  updatedAt: Date.now(),
});

const uniquePush = (values: string[], value: string): string[] =>
  values.includes(value) ? values : [...values, value];

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
  return {
    ...state,
    puzzles,
    flags: {
      ...state.flags,
      [`puzzle_${puzzleId}_solved`]: true,
      ...(puzzleId === "lineage" ? { sarah_email_arrived: true } : {}),
      ...(puzzleId === "index_name" ? { endgame_available: true } : {}),
    },
  };
};

export const reduceGameEvent = (
  current: ProgressStateV3,
  event: GameEvent
): EventResult => {
  if (event.type === "HYDRATE" || event.type === "RESET") {
    return { state: event.state };
  }

  let state = current;
  switch (event.type) {
    case "SET_FLAG":
      if (!state.flags[event.flag]) {
        state = { ...state, flags: { ...state.flags, [event.flag]: true } };
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
        else if (activeMs >= HINT_ONE_MS) hintsUnlocked = Math.max(hintsUnlocked, 1);
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
      const validation = validateIndexCommand(
        command,
        state.collectedReferences
      );
      if (validation.accepted && state.puzzles.future_log.solvedAt) {
        state = solve(state, "index_name");
        return {
          state: touch(state),
          solvedPuzzle: "index_name",
          commandAccepted: true,
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
      if (state.ending === event.ending) break;
      state = {
        ...state,
        ending: event.ending,
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
      const insightId = evaluateTheory(evidenceIds);
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
          },
        ],
        flags: {
          ...state.flags,
          ...(insightId ? { [`insight_${insightId}`]: true } : {}),
          ...(insightsUnlocked.length === 3
            ? { postgame_lore_ready: true }
            : {}),
        },
      };
      return {
        state: touch(state),
        theoryResult: { insightId, alreadyKnown },
      };
    }
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
