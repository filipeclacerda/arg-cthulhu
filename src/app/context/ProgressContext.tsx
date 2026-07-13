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
  ChapterId,
  currentChapter,
  createInitialProgress,
  EndingId,
  firstUnsolvedPuzzle,
  GameEvent,
  InsightId,
  Locale,
  ProgressStateV4,
  progressChapterSnapshot,
  puzzleCorruptionStage,
  PuzzleId,
} from "../game/progress";
import { reduceGameEvent } from "../game/puzzles";
import { puzzleGatePromptRequestedFlag } from "../game/investigativeProgression";
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
import { isStoryComplete } from "../game/endingLifecycle";
import { SessionWriteLock } from "../game/sessionLock";

type SaveStatus = "loading" | "saving" | "saved" | "error" | "readonly";

interface DispatchResult {
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
  hintUnlocked?: { puzzleId: PuzzleId; level: number };
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
  collectedTokens: string[];
  corruptionStage: number;
  playerName: string | null;
  absenceMs: number;
  caseNotes: string;
  activePuzzle: PuzzleId | null;
  currentChapter: ChapterId;
  boardPositions: Record<string, { x: number; y: number }>;
  boardConnections: string[];
  confirmedConnections: string[];
  insightsUnlocked: InsightId[];
  dispatchGameEvent: (event: GameEvent) => DispatchResult;
  setFlag: (flag: string) => void;
  clearFlag: (flag: string) => void;
  markFileRead: (fileId: string) => void;
  markEmailRead: (emailId: string) => void;
  discoverEvidence: (evidenceId: string, resourceId?: string) => void;
  visitPage: (pageId: string) => void;
  solvePuzzle: (puzzleId: PuzzleId) => DispatchResult;
  attemptPuzzle: (puzzleId: PuzzleId) => void;
  recordNearMiss: (puzzleId: PuzzleId, kind: AttemptKind) => void;
  unlockHint: (puzzleId: PuzzleId, level?: number) => void;
  collectReference: (reference: string) => void;
  collectToken: (tokenId: string) => void;
  moveBoardCard: (cardId: string, x: number, y: number) => void;
  toggleBoardConnection: (fromId: string, toId: string) => void;
  testTheory: (evidenceIds: string[], targetInsightId?: InsightId) => DispatchResult;
  resetBoardLayout: () => void;
  recordSequenceAction: (action: string) => DispatchResult;
  runCommand: (command: string) => DispatchResult;
  chooseEnding: (ending: EndingId) => void;
  markEndingClosureSeen: () => void;
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

const HINT_NOTICE = {
  en: "The archive changed a related record. A new fragment is filed under Start -> Help.",
  pt: "O arquivo alterou um registro relacionado. Um novo fragmento está em Iniciar -> Ajuda.",
};

const FIRST_FACT_NOTICE = {
  en: "Fact extracted — filed to Casefile.exe.",
  pt: "Fato extraído — arquivado no Casefile.exe.",
};

const CHAPTER_TITLES: Record<ChapterId, { en: string; pt: string }> = {
  chapter_1: { en: "Sarah Meant to Return", pt: "Sarah Ia Voltar" },
  chapter_2: { en: "The Volume Returned", pt: "O Volume Voltou" },
  chapter_3: { en: "Miriam Left Blanks", pt: "Miriam Deixou Espaços" },
  chapter_4: { en: "Not Counting Days", pt: "Não Contava Dias" },
  chapter_5: { en: "The Observer Field", pt: "O Campo do Observador" },
  chapter_6: { en: "Operations of Cost", pt: "Operações de Custo" },
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
  const writeLockRef = useRef<SessionWriteLock | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((result) => {
      if (cancelled) return;
      const now = Date.now();
      const gap = result.state.lastSeenAt ? now - result.state.lastSeenAt : 0;
      // Walking away from the open final field is a recoverable pending return,
      // not an implicit canonical ending. The Finale must ask explicitly.
      const flags = result.state.flags;
      const pendingReturn =
        gap > ABSENCE_THRESHOLD_MS &&
        Boolean(flags.finale_choice_seen) &&
        Boolean(flags.endgame_available) &&
        !flags.ending_restore &&
        !flags.ending_shutdown &&
        !flags.ending_seal &&
        !flags.ending_archive_self &&
        !flags.ending_leave_blank;
      const hydratedBase = {
        ...result.state,
        absenceMs: gap > ABSENCE_THRESHOLD_MS ? gap : 0,
        flags: {
          ...flags,
          ...(gap > ABSENCE_THRESHOLD_MS
            ? { returned_after_absence: true }
            : {}),
          ...(pendingReturn ? { pending_return_after_absence: true } : {}),
        },
        lastSeenAt: now,
      };
      const hydrated = hydratedBase;
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
    if (!isHydrated) return;
    const tabId = crypto.randomUUID?.() ?? Math.random().toString(36);
    const lock = new SessionWriteLock({
      caseId: state.caseId,
      tabId,
      onChange: (writable) => {
        setIsReadOnly(!writable);
        setSaveStatus(writable ? "saved" : "readonly");
      },
    });
    writeLockRef.current = lock;
    lock.start();
    return () => {
      lock.stop();
      writeLockRef.current = null;
    };
  }, [isHydrated, state.caseId]);

  useEffect(() => {
    if (!isHydrated || isReadOnly || isStoryComplete(stateRef.current)) return;
    let lastTick = Date.now();
    const timer = window.setInterval(() => {
      if (
        document.visibilityState !== "visible" ||
        isStoryComplete(stateRef.current)
      ) {
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
      const newest = Object.entries(state.puzzles)
        .flatMap(([puzzleId, puzzle]) =>
          puzzle.hintHistory.map((entry) => ({
            puzzleId: puzzleId as PuzzleId,
            ...entry,
          }))
        )
        .sort((a, b) => b.unlockedAt - a.unlockedAt)[0];
      setSystemNotice(
        state.locale === "pt-BR" ? HINT_NOTICE.pt : HINT_NOTICE.en
      );
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setSystemNotice(null), 3200);
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
      const beforeTokenCount = stateRef.current.collectedTokens.length;
      const beforeLocale = stateRef.current.locale;
      const beforeChapter = currentChapter(progressChapterSnapshot(stateRef.current));
      const result = reduceGameEvent(stateRef.current, event);
      const afterChapter = currentChapter(progressChapterSnapshot(result.state));
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
            target_insight_id: event.targetInsightId ?? null,
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
      if (
        event.type === "COLLECT_TOKEN" &&
        beforeTokenCount === 0 &&
        result.state.collectedTokens.length > beforeTokenCount
      ) {
        setSystemNotice(
          beforeLocale === "pt-BR" ? FIRST_FACT_NOTICE.pt : FIRST_FACT_NOTICE.en
        );
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setSystemNotice(null), 3800);
      }
      if (beforeChapter !== afterChapter) {
        const copy = CHAPTER_TITLES[afterChapter];
        const number = afterChapter.replace("chapter_", "");
        // "Chapter" stays reserved for the lore's Chapter Seven; the player's
        // progression is described as an investigation stage.
        setSystemNotice(
          beforeLocale === "pt-BR"
            ? `Estágio ${number} da investigação arquivado: ${copy.pt}. Novos registros liberados.`
            : `Investigation stage ${number} filed: ${copy.en}. New records released.`
        );
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setSystemNotice(null), 4200);
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
        if (beforeChapter === afterChapter) {
          setSystemNotice(
            stateRef.current.locale === "pt-BR" ? reaction.pt : reaction.en
          );
          if (noticeTimer.current) clearTimeout(noticeTimer.current);
          noticeTimer.current = setTimeout(() => setSystemNotice(null), 3800);
        }
      }
      if (result.puzzleBlocked) {
        // Do not turn a blocked completion into a dead-end system message.
        // The desktop coordinator turns this persisted signal into a one-time,
        // actionable Casefile lead after its normal narrative pause.
        dispatch({
          type: "SET_FLAG",
          flag: puzzleGatePromptRequestedFlag(result.puzzleBlocked.puzzleId),
        });
        captureTelemetry({
          name: "puzzle_gate_redirected",
          properties: {
            puzzle_id: result.puzzleBlocked.puzzleId,
            reason: result.puzzleBlocked.reason,
          },
        });
      }

      return {
        solvedPuzzle: result.solvedPuzzle,
        sequenceFault: result.sequenceFault,
        commandAccepted: result.commandAccepted,
        commandError: result.commandError,
        puzzleBlocked: result.puzzleBlocked,
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
  const clearFlag = useCallback(
    (flag: string) => dispatchGameEvent({ type: "CLEAR_FLAG", flag }),
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
  const collectToken = useCallback(
    (tokenId: string) => dispatchGameEvent({ type: "COLLECT_TOKEN", tokenId }),
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
    (evidenceIds: string[], targetInsightId?: InsightId) =>
      dispatchGameEvent({ type: "TEST_THEORY", evidenceIds, targetInsightId }),
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
  const markEndingClosureSeen = useCallback(
    () => {
      if (isReadOnly) return;
      const event: GameEvent = {
        type: "SET_FLAG",
        flag: "ending_closure_seen",
      };
      const next = reduceGameEvent(stateRef.current, event).state;
      // Finale deliberately navigates immediately after acknowledgement. Keep
      // this small lifecycle checkpoint durable even before React has had a
      // chance to commit the dispatch and run the normal debounce.
      if (saveTimer.current) clearTimeout(saveTimer.current);
      stateRef.current = next;
      dispatch(event);
      void persistProgress(next, false)
        .then((destination) => {
          setPersistenceAvailable(destination === "indexeddb");
          setSaveStatus("saved");
        })
        .catch(() => setSaveStatus("error"));
    },
    [isReadOnly]
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
      collectedTokens: state.collectedTokens,
      corruptionStage: puzzleCorruptionStage(state.puzzles),
      playerName: state.playerName,
      absenceMs: state.absenceMs,
      caseNotes: state.caseNotes,
      activePuzzle: firstUnsolvedPuzzle(state),
      currentChapter: currentChapter(progressChapterSnapshot(state)),
      boardPositions: state.boardPositions,
      boardConnections: state.boardConnections,
      confirmedConnections: state.confirmedConnections,
      insightsUnlocked: state.insightsUnlocked,
      dispatchGameEvent,
      setFlag,
      clearFlag,
      markFileRead,
      markEmailRead,
      discoverEvidence,
      visitPage,
      solvePuzzle,
      attemptPuzzle,
      recordNearMiss,
      unlockHint,
      collectReference,
      collectToken,
      moveBoardCard,
      toggleBoardConnection,
      testTheory,
      resetBoardLayout,
      recordSequenceAction,
      runCommand,
      chooseEnding,
      markEndingClosureSeen,
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
      clearFlag,
      collectReference,
      collectToken,
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
      markEndingClosureSeen,
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
