"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  AttemptKind,
  createInitialProgress,
  EndingId,
  firstUnsolvedPuzzle,
  GameEvent,
  InsightId,
  Locale,
  ProgressStateV4,
  puzzleCorruptionStage,
  PuzzleId,
} from "../game/progress";
import { reduceGameEvent } from "../game/puzzles";
import { RunCommandError } from "../game/validators";
import { captureTelemetry } from "../game/telemetry";
import {
  clearCurrentProgress,
  exportCaseCode,
  importCaseCode,
  loadProgress,
  persistProgress,
} from "../game/persistence";
import { ABSENCE_THRESHOLD_MS } from "../utils/narrative";

type SaveStatus = "loading" | "saving" | "saved" | "error" | "readonly";

interface DispatchResult {
  solvedPuzzle?: PuzzleId;
  sequenceFault?: boolean;
  commandAccepted?: boolean;
  commandError?: RunCommandError;
  hintUnlocked?: { puzzleId: PuzzleId; level: number };
  theoryResult?: { insightId: string | null; alreadyKnown: boolean };
  caseAnswerResult?: {
    questionId: string;
    accepted: boolean;
    reason: string;
  };
}

interface ProgressContextValue {
  state: ProgressStateV4;
  isHydrated: boolean;
  isReadOnly: boolean;
  persistenceAvailable: boolean;
  recoveredFromCheckpoint: boolean;
  saveStatus: SaveStatus;
  systemNotice: string | null;
  flags: Record<string, boolean>;
  readFileIds: string[];
  readEmailIds: string[];
  discoveredEvidenceIds: string[];
  visitedPageIds: string[];
  collectedReferences: string[];
  corruptionStage: number;
  playerName: string | null;
  absenceMs: number;
  caseNotes: string;
  activePuzzle: PuzzleId | null;
  boardPositions: Record<string, { x: number; y: number }>;
  boardConnections: string[];
  confirmedConnections: string[];
  insightsUnlocked: InsightId[];
  dispatchGameEvent: (event: GameEvent) => DispatchResult;
  setFlag: (flag: string) => void;
  markFileRead: (fileId: string) => void;
  markEmailRead: (emailId: string) => void;
  discoverEvidence: (evidenceId: string, resourceId?: string) => void;
  visitPage: (pageId: string) => void;
  solvePuzzle: (puzzleId: PuzzleId) => void;
  attemptPuzzle: (puzzleId: PuzzleId) => void;
  recordNearMiss: (puzzleId: PuzzleId, kind: AttemptKind) => void;
  unlockHint: (puzzleId: PuzzleId, level?: number) => void;
  collectReference: (reference: string) => void;
  moveBoardCard: (cardId: string, x: number, y: number) => void;
  toggleBoardConnection: (fromId: string, toId: string) => void;
  testTheory: (evidenceIds: string[]) => DispatchResult;
  resetBoardLayout: () => void;
  recordSequenceAction: (action: string) => DispatchResult;
  runCommand: (command: string) => DispatchResult;
  chooseEnding: (ending: EndingId) => void;
  setPlayerName: (name: string | null) => void;
  setLocale: (locale: Locale) => void;
  setCaseNotes: (notes: string) => void;
  newCase: () => Promise<void>;
  exportCode: () => Promise<string>;
  previewCode: (code: string) => Promise<ProgressStateV4>;
  importCode: (code: string) => Promise<ProgressStateV4>;
  hasFlag: (flag: string) => boolean;
  hasEvidence: (evidenceId: string) => boolean;
  isPuzzleSolved: (puzzleId: PuzzleId) => boolean;
}

const SSR_STATE = createInitialProgress(0, "pending");
const ProgressContext = createContext<ProgressContextValue | null>(null);

const reducer = (state: ProgressStateV4, event: GameEvent): ProgressStateV4 =>
  reduceGameEvent(state, event).state;

const milestoneSignature = (state: ProgressStateV4): string =>
  `${Object.values(state.puzzles)
    .map((puzzle) => puzzle.solvedAt ?? 0)
    .join(":")}:${Object.keys(state.caseAnswers).sort().join(",")}:${
    state.insightsUnlocked.length
  }:${state.ending ?? ""}:${state.caseId}`;

const SOLUTION_REACTIONS: Record<PuzzleId, { en: string; pt: string }> = {
  lot_114: {
    en: "A sealed directory spins up beneath My Documents.",
    pt: "Um diretório selado começa a girar sob Meus Documentos.",
  },
  palimpsest: {
    en: "The scan timestamp changes to tomorrow.",
    pt: "A data do scan muda para amanhã.",
  },
  margin_cipher: {
    en: "A media file appears where the margin was stored.",
    pt: "Um arquivo de áudio aparece onde a margem estava guardada.",
  },
  counting_audio: {
    en: "The browser cache remembers a coastline.",
    pt: "O cache do navegador se lembra de uma costa.",
  },
  lineage: {
    en: "Outlook Express receives mail from tomorrow.",
    pt: "O Outlook Express recebe uma mensagem de amanhã.",
  },
  future_log: {
    en: "INDEX.HLP is written into the mounted image.",
    pt: "INDEX.HLP é escrito na imagem montada.",
  },
  index_name: {
    en: "Four object references answer as one.",
    pt: "Quatro referências de objeto respondem como uma.",
  },
};

export const ProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, SSR_STATE);
  const stateRef = useRef(state);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [recoveredFromCheckpoint, setRecoveredFromCheckpoint] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const previousMilestone = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousHintSignature = useRef("");
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((result) => {
      if (cancelled) return;
      const now = Date.now();
      const gap = result.state.lastSeenAt ? now - result.state.lastSeenAt : 0;
      const hydrated = {
        ...result.state,
        absenceMs: gap > ABSENCE_THRESHOLD_MS ? gap : 0,
        flags: {
          ...result.state.flags,
          ...(gap > ABSENCE_THRESHOLD_MS
            ? { returned_after_absence: true }
            : {}),
        },
        lastSeenAt: now,
      };
      dispatch({ type: "HYDRATE", state: hydrated });
      setPersistenceAvailable(result.persistenceAvailable);
      setRecoveredFromCheckpoint(result.recovered);
      previousMilestone.current = milestoneSignature(hydrated);
      previousHintSignature.current = Object.values(hydrated.puzzles)
        .map((puzzle) => puzzle.hintsUnlocked)
        .join(":");
      setIsHydrated(true);
      setSaveStatus("saved");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    captureTelemetry({
      name: "session_start",
      properties: {
        act: Object.values(stateRef.current.puzzles).filter(
          (puzzle) => puzzle.solvedAt
        ).length,
        locale: stateRef.current.locale,
      },
    });
    const finish = () =>
      captureTelemetry({
        name: "session_end",
        properties: {
          act: Object.values(stateRef.current.puzzles).filter(
            (puzzle) => puzzle.solvedAt
          ).length,
          locale: stateRef.current.locale,
        },
      });
    window.addEventListener("pagehide", finish);
    return () => {
      window.removeEventListener("pagehide", finish);
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated || isReadOnly) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    const signature = milestoneSignature(state);
    const checkpoint = signature !== previousMilestone.current;
    saveTimer.current = setTimeout(async () => {
      try {
        const destination = await persistProgress(state, checkpoint);
        setPersistenceAvailable(destination === "indexeddb");
        previousMilestone.current = signature;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, checkpoint ? 0 : 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [isHydrated, isReadOnly, state]);

  useEffect(() => {
    if (!isHydrated || isReadOnly) return;
    const flush = () => {
      void persistProgress(
        {
          ...stateRef.current,
          lastSeenAt: Date.now(),
          updatedAt: Date.now(),
        },
        false
      );
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isHydrated, isReadOnly]);

  useEffect(() => {
    if (!isHydrated || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("miskatonic-case-session");
    channelRef.current = channel;
    const tabId = crypto.randomUUID?.() ?? Math.random().toString(36);
    channel.onmessage = (message) => {
      if (!message.data || message.data.caseId !== stateRef.current.caseId) return;
      if (message.data.type === "HELLO" && !isReadOnly) {
        channel.postMessage({
          type: "ACTIVE",
          caseId: stateRef.current.caseId,
          tabId,
        });
      }
      if (message.data.type === "ACTIVE" && message.data.tabId !== tabId) {
        setIsReadOnly(true);
        setSaveStatus("readonly");
      }
    };
    channel.postMessage({
      type: "HELLO",
      caseId: state.caseId,
      tabId,
    });
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [isHydrated, isReadOnly, state.caseId]);

  useEffect(() => {
    if (!isHydrated || isReadOnly) return;
    let lastTick = Date.now();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        lastTick = Date.now();
        return;
      }
      const now = Date.now();
      const puzzleId = firstUnsolvedPuzzle(stateRef.current);
      if (puzzleId) {
        dispatch({
          type: "ADD_ACTIVE_TIME",
          puzzleId,
          elapsedMs: now - lastTick,
        });
      }
      lastTick = now;
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [isHydrated, isReadOnly]);

  useEffect(() => {
    document.documentElement.dataset.corruption = String(
      puzzleCorruptionStage(state.puzzles)
    );
  }, [state.puzzles]);

  useEffect(() => {
    if (!isHydrated) return;
    const signature = Object.values(state.puzzles)
      .map((puzzle) => puzzle.hintsUnlocked)
      .join(":");
    if (
      previousHintSignature.current &&
      signature !== previousHintSignature.current
    ) {
      setSystemNotice(
        state.locale === "pt-BR"
          ? "O arquivo alterou um registro relacionado."
          : "The archive changed a related record."
      );
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setSystemNotice(null), 3200);
      const newest = Object.entries(state.puzzles)
        .flatMap(([puzzleId, puzzle]) =>
          puzzle.hintHistory.map((entry) => ({ puzzleId, ...entry }))
        )
        .sort((a, b) => b.unlockedAt - a.unlockedAt)[0];
      if (newest?.trigger === "time") {
        captureTelemetry({
          name: "hint_unlocked",
          properties: {
            puzzle_id: newest.puzzleId,
            level: newest.level,
            trigger: newest.trigger,
          },
        });
      }
    }
    previousHintSignature.current = signature;
  }, [isHydrated, state.locale, state.puzzles]);

  const dispatchGameEvent = useCallback(
    (event: GameEvent): DispatchResult => {
      if (isReadOnly) return {};
      const result = reduceGameEvent(stateRef.current, event);
      dispatch(event);

      if (event.type === "MARK_FILE_READ") {
        captureTelemetry({
          name: "resource_open",
          properties: { kind: "file", resource_id: event.fileId },
        });
      } else if (event.type === "MARK_EMAIL_READ") {
        captureTelemetry({
          name: "resource_open",
          properties: { kind: "email", resource_id: event.emailId },
        });
      } else if (event.type === "VISIT_PAGE") {
        captureTelemetry({
          name: "resource_open",
          properties: { kind: "page", resource_id: event.pageId },
        });
      } else if (event.type === "ATTEMPT_PUZZLE") {
        captureTelemetry({
          name: "puzzle_attempt",
          properties: { puzzle_id: event.puzzleId },
        });
      } else if (event.type === "RECORD_NEAR_MISS") {
        captureTelemetry({
          name: "puzzle_near_miss",
          properties: {
            puzzle_id: event.puzzleId,
            attempt_kind: event.kind,
          },
        });
      } else if (event.type === "UNLOCK_HINT") {
        captureTelemetry({
          name: "hint_unlocked",
          properties: {
            puzzle_id: event.puzzleId,
            level:
              result.hintUnlocked?.level ??
              stateRef.current.puzzles[event.puzzleId].hintsUnlocked,
            trigger: event.trigger ?? "manual",
          },
        });
      } else if (event.type === "TEST_THEORY") {
        captureTelemetry({
          name: "theory_tested",
          properties: {
            evidence_count: event.evidenceIds.length,
            matched: Boolean(result.theoryResult?.insightId),
            insight_id: result.theoryResult?.insightId ?? null,
          },
        });
      } else if (event.type === "CHOOSE_ENDING") {
        captureTelemetry({
          name: "ending_chosen",
          properties: { ending: event.ending },
        });
      }

      if (result.hintUnlocked && event.type !== "UNLOCK_HINT") {
        captureTelemetry({
          name: "hint_unlocked",
          properties: {
            puzzle_id: result.hintUnlocked.puzzleId,
            level: result.hintUnlocked.level,
            trigger: result.hintUnlocked.trigger,
          },
        });
      }
      if (result.solvedPuzzle) {
        const puzzle = result.solvedPuzzle;
        captureTelemetry({
          name: "puzzle_solved",
          properties: {
            puzzle_id: puzzle,
            attempts: result.state.puzzles[puzzle].attempts,
            active_ms: result.state.puzzles[puzzle].activeMs,
            hints: result.state.puzzles[puzzle].hintsUnlocked,
          },
        });
        const reaction = SOLUTION_REACTIONS[puzzle];
        setSystemNotice(
          stateRef.current.locale === "pt-BR" ? reaction.pt : reaction.en
        );
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setSystemNotice(null), 3800);
      }

      return {
        solvedPuzzle: result.solvedPuzzle,
        sequenceFault: result.sequenceFault,
        commandAccepted: result.commandAccepted,
        commandError: result.commandError,
        hintUnlocked: result.hintUnlocked
          ? {
              puzzleId: result.hintUnlocked.puzzleId,
              level: result.hintUnlocked.level,
            }
          : undefined,
        theoryResult: result.theoryResult,
        caseAnswerResult: result.caseAnswerResult,
      };
    },
    [isReadOnly]
  );

  const newCase = useCallback(async () => {
    if (isReadOnly) return;
    await persistProgress(stateRef.current, true);
    await clearCurrentProgress();
    const next = {
      ...createInitialProgress(),
      locale: stateRef.current.locale,
    };
    previousMilestone.current = milestoneSignature(next);
    dispatch({ type: "RESET", state: next });
  }, [isReadOnly]);

  const importCode = useCallback(
    async (code: string) => {
      if (isReadOnly) throw new Error("This case is open in another tab.");
      await persistProgress(stateRef.current, true);
      const imported = await importCaseCode(code);
      dispatch({ type: "HYDRATE", state: imported });
      await persistProgress(imported, true);
      return imported;
    },
    [isReadOnly]
  );

  const setFlag = useCallback(
    (flag: string) => dispatchGameEvent({ type: "SET_FLAG", flag }),
    [dispatchGameEvent]
  );
  const markFileRead = useCallback(
    (fileId: string) =>
      dispatchGameEvent({ type: "MARK_FILE_READ", fileId }),
    [dispatchGameEvent]
  );
  const markEmailRead = useCallback(
    (emailId: string) =>
      dispatchGameEvent({ type: "MARK_EMAIL_READ", emailId }),
    [dispatchGameEvent]
  );
  const discoverEvidence = useCallback(
    (evidenceId: string, resourceId?: string) =>
      dispatchGameEvent({
        type: "DISCOVER_EVIDENCE",
        evidenceId,
        resourceId,
      }),
    [dispatchGameEvent]
  );
  const visitPage = useCallback(
    (pageId: string) =>
      dispatchGameEvent({ type: "VISIT_PAGE", pageId }),
    [dispatchGameEvent]
  );
  const solvePuzzle = useCallback(
    (puzzleId: PuzzleId) =>
      dispatchGameEvent({ type: "SOLVE_PUZZLE", puzzleId }),
    [dispatchGameEvent]
  );
  const attemptPuzzle = useCallback(
    (puzzleId: PuzzleId) =>
      dispatchGameEvent({ type: "ATTEMPT_PUZZLE", puzzleId }),
    [dispatchGameEvent]
  );
  const recordNearMiss = useCallback(
    (puzzleId: PuzzleId, kind: AttemptKind) =>
      dispatchGameEvent({ type: "RECORD_NEAR_MISS", puzzleId, kind }),
    [dispatchGameEvent]
  );
  const unlockHint = useCallback(
    (puzzleId: PuzzleId, level?: number) =>
      dispatchGameEvent({ type: "UNLOCK_HINT", puzzleId, level }),
    [dispatchGameEvent]
  );
  const collectReference = useCallback(
    (reference: string) =>
      dispatchGameEvent({ type: "COLLECT_REFERENCE", reference }),
    [dispatchGameEvent]
  );
  const moveBoardCard = useCallback(
    (cardId: string, x: number, y: number) =>
      dispatchGameEvent({ type: "MOVE_BOARD_CARD", cardId, x, y }),
    [dispatchGameEvent]
  );
  const toggleBoardConnection = useCallback(
    (fromId: string, toId: string) =>
      dispatchGameEvent({ type: "TOGGLE_BOARD_CONNECTION", fromId, toId }),
    [dispatchGameEvent]
  );
  const testTheory = useCallback(
    (evidenceIds: string[]) =>
      dispatchGameEvent({ type: "TEST_THEORY", evidenceIds }),
    [dispatchGameEvent]
  );
  const resetBoardLayout = useCallback(
    () => dispatchGameEvent({ type: "RESET_BOARD_LAYOUT" }),
    [dispatchGameEvent]
  );
  const recordSequenceAction = useCallback(
    (action: string) => {
      const result = dispatchGameEvent({
        type: "FUTURE_SEQUENCE_ACTION",
        action,
      });
      if (result.sequenceFault) {
        setSystemNotice(
          stateRef.current.locale === "pt-BR"
            ? "O log se reinicia sozinho."
            : "The log resets itself."
        );
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setSystemNotice(null), 2400);
      }
      return result;
    },
    [dispatchGameEvent]
  );
  const runCommand = useCallback(
    (command: string) =>
      dispatchGameEvent({ type: "RUN_COMMAND", command }),
    [dispatchGameEvent]
  );
  const chooseEnding = useCallback(
    (ending: EndingId) =>
      dispatchGameEvent({ type: "CHOOSE_ENDING", ending }),
    [dispatchGameEvent]
  );
  const setLocale = useCallback(
    (locale: Locale) => dispatchGameEvent({ type: "SET_LOCALE", locale }),
    [dispatchGameEvent]
  );
  const setPlayerName = useCallback(
    (name: string | null) =>
      dispatchGameEvent({ type: "SET_PLAYER_NAME", name }),
    [dispatchGameEvent]
  );
  const setCaseNotes = useCallback(
    (notes: string) =>
      dispatchGameEvent({ type: "SET_CASE_NOTES", notes }),
    [dispatchGameEvent]
  );
  const exportCode = useCallback(
    () => exportCaseCode(stateRef.current),
    []
  );
  const previewCode = useCallback(
    (code: string) => importCaseCode(code),
    []
  );
  const hasFlag = useCallback(
    (flag: string) => Boolean(state.flags[flag]),
    [state.flags]
  );
  const hasEvidence = useCallback(
    (evidenceId: string) =>
      state.discoveredEvidenceIds.includes(evidenceId),
    [state.discoveredEvidenceIds]
  );
  const isPuzzleSolved = useCallback(
    (puzzleId: PuzzleId) => Boolean(state.puzzles[puzzleId].solvedAt),
    [state.puzzles]
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      state,
      isHydrated,
      isReadOnly,
      persistenceAvailable,
      recoveredFromCheckpoint,
      saveStatus,
      systemNotice,
      flags: state.flags,
      readFileIds: state.readFileIds,
      readEmailIds: state.readEmailIds,
      discoveredEvidenceIds: state.discoveredEvidenceIds,
      visitedPageIds: state.visitedPageIds,
      collectedReferences: state.collectedReferences,
      corruptionStage: puzzleCorruptionStage(state.puzzles),
      playerName: state.playerName,
      absenceMs: state.absenceMs,
      caseNotes: state.caseNotes,
      activePuzzle: firstUnsolvedPuzzle(state),
      boardPositions: state.boardPositions,
      boardConnections: state.boardConnections,
      confirmedConnections: state.confirmedConnections,
      insightsUnlocked: state.insightsUnlocked,
      dispatchGameEvent,
      setFlag,
      markFileRead,
      markEmailRead,
      discoverEvidence,
      visitPage,
      solvePuzzle,
      attemptPuzzle,
      recordNearMiss,
      unlockHint,
      collectReference,
      moveBoardCard,
      toggleBoardConnection,
      testTheory,
      resetBoardLayout,
      recordSequenceAction,
      runCommand,
      chooseEnding,
      setPlayerName,
      setLocale,
      setCaseNotes,
      newCase,
      exportCode,
      previewCode,
      importCode,
      hasFlag,
      hasEvidence,
      isPuzzleSolved,
    }),
    [
      attemptPuzzle,
      chooseEnding,
      collectReference,
      discoverEvidence,
      dispatchGameEvent,
      exportCode,
      hasEvidence,
      hasFlag,
      importCode,
      isHydrated,
      isPuzzleSolved,
      isReadOnly,
      markEmailRead,
      markFileRead,
      moveBoardCard,
      newCase,
      persistenceAvailable,
      previewCode,
      recordSequenceAction,
      recordNearMiss,
      recoveredFromCheckpoint,
      resetBoardLayout,
      runCommand,
      saveStatus,
      setCaseNotes,
      setFlag,
      setLocale,
      setPlayerName,
      solvePuzzle,
      state,
      systemNotice,
      toggleBoardConnection,
      testTheory,
      unlockHint,
      visitPage,
    ]
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
};
