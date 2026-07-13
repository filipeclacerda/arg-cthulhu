"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import { createUuid } from "@/app/utils/utils";
import { useSound } from "./SoundContext";
import type { CasefileLens } from "../game/casefile";
import type { CaseQuestionId, InsightId } from "../game/progress";

export type AppType =
  | "explorer"
  | "notepad"
  | "email"
  | "finale"
  | "browser"
  | "messenger"
  | "image"
  | "audio"
  | "cipher-lab"
  | "casefile"
  | "case-notes"
  | "archive-viewer"
  | "clock-properties"
  | "properties"
  | "help"
  | "calculator"
  | "paint"
  | "system-properties"
  | "recycle-bin"
  | "generic";

type BaseWindowProps = {
  windowClassName?: string;
};

/**
 * Props accepted by each emulated application.  Keeping this map close to the
 * window reducer makes an invalid app/prop pairing a type error while leaving
 * optional fields available to legacy callers that open a blank application.
 */
export type AppPropsByType = {
  explorer: BaseWindowProps & { folderId?: string };
  notepad: BaseWindowProps & { fileId?: string };
  email: BaseWindowProps;
  finale: BaseWindowProps;
  browser: BaseWindowProps & { initialAddress?: string };
  messenger: BaseWindowProps & { initialThreadId?: string };
  image: BaseWindowProps & { fileId?: string; recallDisplay?: boolean };
  audio: BaseWindowProps & { fileId?: string; recallDisplay?: boolean };
  "cipher-lab": BaseWindowProps & { initialCiphertext?: string };
  casefile: BaseWindowProps & {
    initialLens?: CasefileLens;
    initialThreadId?: InsightId;
    initialFindingId?: CaseQuestionId;
  };
  "case-notes": BaseWindowProps;
  "archive-viewer": BaseWindowProps;
  "clock-properties": BaseWindowProps;
  properties: BaseWindowProps & { fileId?: string };
  help: BaseWindowProps;
  calculator: BaseWindowProps;
  paint: BaseWindowProps;
  "system-properties": BaseWindowProps;
  "recycle-bin": BaseWindowProps;
  generic: BaseWindowProps & { children?: React.ReactNode };
};

export type WindowInstance = {
  [Type in AppType]: {
    id: string;
    appType: Type;
    title: string;
    props: AppPropsByType[Type];
    position: { x: number; y: number };
    zIndex: number;
    minimized: boolean;
    maximized: boolean;
  };
}[AppType];

type NewWindowInstance = {
  [Type in AppType]: {
    id: string;
    appType: Type;
    title: string;
    props: AppPropsByType[Type];
    position: { x: number; y: number };
  };
}[AppType];

interface WindowManagerState {
  windows: WindowInstance[];
  nextZIndex: number;
}

type Action =
  | {
      type: "OPEN_WINDOW";
      window: NewWindowInstance & {
        maximized?: boolean;
      };
    }
  | { type: "CLOSE_WINDOW"; id: string }
  | { type: "FOCUS_WINDOW"; id: string }
  | { type: "TOGGLE_MINIMIZE"; id: string }
  | { type: "TOGGLE_MAXIMIZE"; id: string }
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
            w.id === action.window.id
              ? ({
                   ...w,
                   props: { ...w.props, ...action.window.props },
                   minimized: false,
                   zIndex: state.nextZIndex,
                 } as WindowInstance)
              : w
          ),
          nextZIndex: state.nextZIndex + 1,
        };
      }
      return {
        ...state,
        windows: [
          ...state.windows,
          ({
            ...action.window,
            minimized: false,
            maximized: action.window.maximized ?? false,
            zIndex: state.nextZIndex,
          } as WindowInstance),
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
          w.id === action.id
            ? { ...w, minimized: false, zIndex: state.nextZIndex }
            : w
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    case "TOGGLE_MINIMIZE":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, minimized: !w.minimized } : w
        ),
      };
    case "TOGGLE_MAXIMIZE":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? { ...w, minimized: false, maximized: !w.maximized }
            : w
        ),
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

export interface OpenWindowOptions<Type extends AppType = AppType> {
  id?: string;
  appType: Type;
  title: string;
  props?: AppPropsByType[Type];
  maximized?: boolean;
}

interface WindowManagerContextValue {
  windows: WindowInstance[];
  openWindow: <Type extends AppType>(options: OpenWindowOptions<Type>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
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
  const { play } = useSound();

  const openWindow = useCallback(
    <Type extends AppType>(options: OpenWindowOptions<Type>) => {
      const id = options.id ?? createUuid();
      play("click");
      dispatch({
        type: "OPEN_WINDOW",
        window: {
          id,
          appType: options.appType,
          title: options.title,
          props: (options.props ?? {}) as AppPropsByType[Type],
          position: randomPosition(),
          maximized: options.maximized,
        } as NewWindowInstance,
      });
    },
    [play]
  );

  const closeWindow = useCallback(
    (id: string) => {
      play("click");
      dispatch({ type: "CLOSE_WINDOW", id });
    },
    [play]
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
  const toggleMinimize = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_MINIMIZE", id }),
    []
  );
  const toggleMaximize = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_MAXIMIZE", id }),
    []
  );

  return (
    <WindowManagerContext.Provider
      value={{
        windows: state.windows,
        openWindow,
        closeWindow,
        focusWindow,
        toggleMinimize,
        toggleMaximize,
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
