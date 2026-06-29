"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import { createUuid } from "@/app/utils/utils";

export type AppType = "explorer" | "notepad" | "email" | "registration" | "finale" | "generic";

export interface WindowInstance {
  id: string;
  appType: AppType;
  title: string;
  props: Record<string, any>;
  position: { x: number; y: number };
  zIndex: number;
}

interface WindowManagerState {
  windows: WindowInstance[];
  nextZIndex: number;
}

type Action =
  | { type: "OPEN_WINDOW"; window: Omit<WindowInstance, "zIndex"> }
  | { type: "CLOSE_WINDOW"; id: string }
  | { type: "FOCUS_WINDOW"; id: string }
  | { type: "MOVE_WINDOW"; id: string; x: number; y: number };

const initialState: WindowManagerState = { windows: [], nextZIndex: 10 };

function reducer(
  state: WindowManagerState,
  action: Action
): WindowManagerState {
  switch (action.type) {
    case "OPEN_WINDOW": {
      const existing = state.windows.find((w) => w.id === action.window.id);
      if (existing) {
        return {
          ...state,
          windows: state.windows.map((w) =>
            w.id === action.window.id ? { ...w, zIndex: state.nextZIndex } : w
          ),
          nextZIndex: state.nextZIndex + 1,
        };
      }
      return {
        ...state,
        windows: [
          ...state.windows,
          { ...action.window, zIndex: state.nextZIndex },
        ],
        nextZIndex: state.nextZIndex + 1,
      };
    }
    case "CLOSE_WINDOW":
      return {
        ...state,
        windows: state.windows.filter((w) => w.id !== action.id),
      };
    case "FOCUS_WINDOW":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, zIndex: state.nextZIndex } : w
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    case "MOVE_WINDOW":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? { ...w, position: { x: action.x, y: action.y } }
            : w
        ),
      };
    default:
      return state;
  }
}

interface OpenWindowOptions {
  id?: string;
  appType: AppType;
  title: string;
  props?: Record<string, any>;
}

interface WindowManagerContextValue {
  windows: WindowInstance[];
  openWindow: (options: OpenWindowOptions) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
  null
);

const randomPosition = () => {
  // Keep even the largest apps inside a typical browser viewport. A little
  // jitter preserves the old-Windows pile-of-dialogs feel without making the
  // player chase windows that opened beyond the screen.
  const maxX = Math.max(8, window.innerWidth - 960);
  const maxY = Math.max(8, window.innerHeight - 680);
  return {
    x: Math.round(Math.min(maxX, 24 + Math.random() * 120)),
    y: Math.round(Math.min(maxY, 24 + Math.random() * 70)),
  };
};

export const WindowManagerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const openWindow = useCallback((options: OpenWindowOptions) => {
    const id = options.id ?? createUuid();
    dispatch({
      type: "OPEN_WINDOW",
      window: {
        id,
        appType: options.appType,
        title: options.title,
        props: options.props ?? {},
        position: randomPosition(),
      },
    });
  }, []);

  const closeWindow = useCallback(
    (id: string) => dispatch({ type: "CLOSE_WINDOW", id }),
    []
  );
  const focusWindow = useCallback(
    (id: string) => dispatch({ type: "FOCUS_WINDOW", id }),
    []
  );
  const moveWindow = useCallback(
    (id: string, x: number, y: number) =>
      dispatch({ type: "MOVE_WINDOW", id, x, y }),
    []
  );

  return (
    <WindowManagerContext.Provider
      value={{
        windows: state.windows,
        openWindow,
        closeWindow,
        focusWindow,
        moveWindow,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) {
    throw new Error(
      "useWindowManager must be used within a WindowManagerProvider"
    );
  }
  return ctx;
};
