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
  createInitialProgress,
  EndingId,
  firstUnsolvedPuzzle,
  GameEvent,
  ProgressStateV3,
  puzzleCorruptionStage,
  PuzzleId,
} from "../game/progress";
import { reduceGameEvent } from "../game/puzzles";
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
}

interface ProgressContextValue {
  state: ProgressStateV3;
  isHydrated: boolean;
  isReadOnly: boolean;
  persistenceAvailable: boolean;
  recoveredFromCheckpoint: boolean;
  saveStatus: SaveStatus;
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
  dispatchGameEvent: (event: GameEvent) => DispatchResult;
  setFlag: (flag: string) => void;
  markFileRead: (fileId: string) => void;
  markEmailRead: (emailId: string) => void;
  discoverEvidence: (evidenceId: string, resourceId?: string) => void;
  visitPage: (pageId: string) => void;
  solvePuzzle: (puzzleId: PuzzleId) => void;
  attemptPuzzle: (puzzleId: PuzzleId) => void;
  unlockHint: (puzzleId: PuzzleId, level?: number) => void;
  collectReference: (reference: string) => void;
  recordSequenceAction: (action: string) => DispatchResult;
  runCommand: (command: string) => DispatchResult;
  chooseEnding: (ending: EndingId) => void;
  setPlayerName: (name: string | null) => void;
  setCaseNotes: (notes: string) => void;
  newCase: () => Promise<void>;
  exportCode: () => Promise<string>;
  previewCode: (code: string) => Promise<ProgressStateV3>;
  importCode: (code: string) => Promise<ProgressStateV3>;
  hasFlag: (flag: string) => boolean;
  hasEvidence: (evidenceId: string) => boolean;
  isPuzzleSolved: (puzzleId: PuzzleId) => boolean;
}

const SSR_STATE = createInitialProgress(0, "pending");
const ProgressContext = createContext<ProgressContextValue | null>(null);

const reducer = (state: ProgressStateV3, event: GameEvent): ProgressStateV3 =>
  reduceGameEvent(state, event).state;

const milestoneSignature = (state: ProgressStateV3): string =>
  `${Object.values(state.puzzles)
    .map((puzzle) => puzzle.solvedAt ?? 0)
    .join(":")}:${state.ending ?? ""}:${state.caseId}`;

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
  const previousMilestone = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      setIsHydrated(true);
      setSaveStatus("saved");
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const dispatchGameEvent = useCallback(
    (event: GameEvent): DispatchResult => {
      if (isReadOnly) return {};
      const result = reduceGameEvent(stateRef.current, event);
      dispatch(event);
      return {
        solvedPuzzle: result.solvedPuzzle,
        sequenceFault: result.sequenceFault,
        commandAccepted: result.commandAccepted,
      };
    },
    [isReadOnly]
  );

  const newCase = useCallback(async () => {
    if (isReadOnly) return;
    await persistProgress(stateRef.current, true);
    await clearCurrentProgress();
    const next = createInitialProgress();
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
  const recordSequenceAction = useCallback(
    (action: string) =>
      dispatchGameEvent({ type: "FUTURE_SEQUENCE_ACTION", action }),
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
      dispatchGameEvent,
      setFlag,
      markFileRead,
      markEmailRead,
      discoverEvidence,
      visitPage,
      solvePuzzle,
      attemptPuzzle,
      unlockHint,
      collectReference,
      recordSequenceAction,
      runCommand,
      chooseEnding,
      setPlayerName,
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
      newCase,
      persistenceAvailable,
      previewCode,
      recordSequenceAction,
      recoveredFromCheckpoint,
      runCommand,
      saveStatus,
      setCaseNotes,
      setFlag,
      setPlayerName,
      solvePuzzle,
      state,
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
