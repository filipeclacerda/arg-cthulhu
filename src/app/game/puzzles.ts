import { GameEvent, ProgressStateV3, PuzzleId } from "./progress";

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
    "Bellaso is a person's name as well as a clue to a cipher.",
    "The key is the first person who catalogued this collection.",
    "Choose Vigenere in Cipher Lab and use MIRIAM as the key.",
  ],
  counting_audio: [
    "The decoded margin describes controls, not prose.",
    "The useful voice is in the left channel and was recorded backwards.",
    "In Media Player choose Left, enable Reverse, and play the 4:11 recording.",
  ],
  lineage: [
    "The spoken pairs point at the list of surnames. Count letters, not years.",
    "The extracted word is a place. Search it in the recovered browser.",
    "The pairs spell YHANTHLEI. Then continue the shrinking date intervals and search 2026.",
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
}

const touch = (state: ProgressStateV3): ProgressStateV3 => ({
  ...state,
  revision: state.revision + 1,
  updatedAt: Date.now(),
});

const uniquePush = (values: string[], value: string): string[] =>
  values.includes(value) ? values : [...values, value];

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
      state = {
        ...state,
        puzzles: {
          ...state.puzzles,
          [event.puzzleId]: {
            ...state.puzzles[event.puzzleId],
            hintsUnlocked: level,
          },
        },
      };
      break;
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
            [event.puzzleId]: { ...puzzle, activeMs, hintsUnlocked },
          },
        };
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
        return { state: touch(state), sequenceFault: true };
      }
      break;
    }
    case "RUN_COMMAND": {
      const command = normalizeCommand(event.command);
      if (
        command === "INDEX /JOIN E7-A1-C4-B9" &&
        state.puzzles.future_log.solvedAt &&
        ["E7", "A1", "C4", "B9"].every((reference) =>
          state.collectedReferences.includes(reference)
        )
      ) {
        state = solve(state, "index_name");
        return {
          state: touch(state),
          solvedPuzzle: "index_name",
          commandAccepted: true,
        };
      }
      break;
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
