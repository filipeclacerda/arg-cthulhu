"use client";
import React, { createContext, useContext, useEffect, useReducer } from "react";

interface ProgressState {
  version: 1;
  flags: Record<string, boolean>;
  readFileIds: string[];
  readEmailIds: string[];
}

const STORAGE_KEY = "arg-cthulhu-progress";

const initialState: ProgressState = {
  version: 1,
  flags: {},
  readFileIds: [],
  readEmailIds: [],
};

type Action =
  | { type: "SET_FLAG"; flag: string }
  | { type: "MARK_FILE_READ"; fileId: string }
  | { type: "MARK_EMAIL_READ"; emailId: string }
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
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

interface ProgressContextValue {
  flags: Record<string, boolean>;
  readFileIds: string[];
  readEmailIds: string[];
  setFlag: (flag: string) => void;
  markFileRead: (fileId: string) => void;
  markEmailRead: (emailId: string) => void;
  hasFlag: (flag: string) => boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export const ProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Mount-only: reading localStorage during initial render would mismatch
  // the server-rendered HTML (App Router renders this tree on the server first).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.version === 1) {
          dispatch({ type: "HYDRATE", state: parsed });
        }
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — play without persistence.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore — see above.
    }
  }, [state]);

  const value: ProgressContextValue = {
    flags: state.flags,
    readFileIds: state.readFileIds,
    readEmailIds: state.readEmailIds,
    setFlag: (flag) => dispatch({ type: "SET_FLAG", flag }),
    markFileRead: (fileId) => dispatch({ type: "MARK_FILE_READ", fileId }),
    markEmailRead: (emailId) => dispatch({ type: "MARK_EMAIL_READ", emailId }),
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
