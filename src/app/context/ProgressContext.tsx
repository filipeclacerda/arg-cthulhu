"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import {
  ABSENCE_THRESHOLD_MS,
  MAX_CORRUPTION_STAGE,
  SARAH_EMAIL_STAGE,
} from "../utils/narrative";

interface ProgressState {
  version: 2;
  flags: Record<string, boolean>;
  readFileIds: string[];
  readEmailIds: string[];
  /** 0 = pristine .. 4 = the whole machine is wrong. See narrative.ts. */
  corruptionStage: number;
  /** Captured diegetically early; weaponized in Act 3. null until registered. */
  playerName: string | null;
  /** Epoch ms. Lets the desktop "remember" the player across sessions. */
  firstSeenAt: number | null;
  lastSeenAt: number | null;
}

const STORAGE_KEY = "arg-cthulhu-progress";
const SEEN_INTERVAL_MS = 15 * 1000;

const initialState: ProgressState = {
  version: 2,
  flags: {},
  readFileIds: [],
  readEmailIds: [],
  corruptionStage: 0,
  playerName: null,
  firstSeenAt: null,
  lastSeenAt: null,
};

/**
 * Brings any persisted blob up to the current shape. v1 saves (flags + read
 * arrays only) keep their progress — testers don't get wiped on upgrade.
 */
function migrate(parsed: any): ProgressState | null {
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.version !== 1 && parsed.version !== 2) return null;
  return {
    ...initialState,
    ...parsed,
    version: 2,
    flags: parsed.flags ?? {},
    readFileIds: parsed.readFileIds ?? [],
    readEmailIds: parsed.readEmailIds ?? [],
  };
}

type Action =
  | { type: "SET_FLAG"; flag: string }
  | { type: "MARK_FILE_READ"; fileId: string }
  | { type: "MARK_EMAIL_READ"; emailId: string }
  | { type: "RAISE_CORRUPTION"; stage: number }
  | { type: "SET_PLAYER_NAME"; name: string | null }
  | { type: "TOUCH_SEEN"; now: number }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: ProgressState };

function reducer(state: ProgressState, action: Action): ProgressState {
  switch (action.type) {
    case "SET_FLAG":
      if (state.flags[action.flag]) return state;
      return { ...state, flags: { ...state.flags, [action.flag]: true } };
    case "MARK_FILE_READ":
      if (state.readFileIds.includes(action.fileId)) return state;
      return { ...state, readFileIds: [...state.readFileIds, action.fileId] };
    case "MARK_EMAIL_READ":
      if (state.readEmailIds.includes(action.emailId)) return state;
      return {
        ...state,
        readEmailIds: [...state.readEmailIds, action.emailId],
      };
    case "RAISE_CORRUPTION": {
      const next = Math.min(
        MAX_CORRUPTION_STAGE,
        Math.max(state.corruptionStage, action.stage)
      );
      if (next === state.corruptionStage) return state;
      // Some flags are downstream of how deep the rot has gone: once the clock
      // starts skewing, Sarah's live email "arrives".
      const flags = { ...state.flags };
      if (next >= SARAH_EMAIL_STAGE) flags.sarah_email_arrived = true;
      return { ...state, corruptionStage: next, flags };
    }
    case "SET_PLAYER_NAME":
      return { ...state, playerName: action.name };
    case "TOUCH_SEEN":
      return {
        ...state,
        firstSeenAt: state.firstSeenAt ?? action.now,
        lastSeenAt: action.now,
      };
    case "RESET":
      return { ...initialState };
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

interface ProgressContextValue {
  isHydrated: boolean;
  flags: Record<string, boolean>;
  readFileIds: string[];
  readEmailIds: string[];
  corruptionStage: number;
  playerName: string | null;
  /** Real time (ms) the player was away when this session started. */
  absenceMs: number;
  setFlag: (flag: string) => void;
  markFileRead: (fileId: string) => void;
  markEmailRead: (emailId: string) => void;
  raiseCorruption: (stage: number) => void;
  setPlayerName: (name: string | null) => void;
  reset: () => void;
  hasFlag: (flag: string) => boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export const ProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [absenceMs, setAbsenceMs] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Mount-only: reading localStorage during initial render would mismatch
  // the server-rendered HTML (App Router renders this tree on the server first).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const migrated = migrate(JSON.parse(raw));
        if (migrated) {
          // Measure the gap BEFORE we overwrite lastSeenAt — this is the
          // "while you were gone" beat. The desktop kept time; you didn't.
          const now = Date.now();
          const gap = migrated.lastSeenAt ? now - migrated.lastSeenAt : 0;
          dispatch({ type: "HYDRATE", state: migrated });
          if (gap > ABSENCE_THRESHOLD_MS) {
            setAbsenceMs(gap);
            dispatch({ type: "SET_FLAG", flag: "returned_after_absence" });
          }
        }
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — play without persistence.
    }
    dispatch({ type: "TOUCH_SEEN", now: Date.now() });
    setIsHydrated(true);
  }, []);

  // Keep a heartbeat so the next visit can tell how long the player was away.
  useEffect(() => {
    const id = setInterval(
      () => dispatch({ type: "TOUCH_SEEN", now: Date.now() }),
      SEEN_INTERVAL_MS
    );
    const onLeave = () => dispatch({ type: "TOUCH_SEEN", now: Date.now() });
    window.addEventListener("beforeunload", onLeave);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore — see above.
    }
  }, [isHydrated, state]);

  // Expose the rot level to CSS the same way ZoomContext exposes --ui-scale,
  // so stylesheets can react with [data-corruption="N"] selectors.
  useEffect(() => {
    document.documentElement.dataset.corruption = String(state.corruptionStage);
  }, [state.corruptionStage]);

  const value: ProgressContextValue = {
    isHydrated,
    flags: state.flags,
    readFileIds: state.readFileIds,
    readEmailIds: state.readEmailIds,
    corruptionStage: state.corruptionStage,
    playerName: state.playerName,
    absenceMs,
    setFlag: (flag) => dispatch({ type: "SET_FLAG", flag }),
    markFileRead: (fileId) => dispatch({ type: "MARK_FILE_READ", fileId }),
    markEmailRead: (emailId) => dispatch({ type: "MARK_EMAIL_READ", emailId }),
    raiseCorruption: (stage) => dispatch({ type: "RAISE_CORRUPTION", stage }),
    setPlayerName: (name) => dispatch({ type: "SET_PLAYER_NAME", name }),
    reset: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      dispatch({ type: "RESET" });
    },
    hasFlag: (flag) => !!state.flags[flag],
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return ctx;
};
