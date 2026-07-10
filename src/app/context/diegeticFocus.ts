"use client";
import { useSyncExternalStore } from "react";

/**
 * Tiny cross-tree signal: the desktop's diegetic event coordinator raises it
 * while a mandatory focal set piece (priority-1 event window or the 1998
 * desktop overlay) is covering the screen. The Messenger consumes it to
 * pause Sarah's live-contact timer. A module store (not a React context)
 * because the desktop page and the WindowLayer live in sibling trees.
 */

let focalSetPieceActive = false;
const listeners = new Set<() => void>();

export const setFocalSetPieceActive = (value: boolean): void => {
  if (focalSetPieceActive === value) return;
  focalSetPieceActive = value;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useFocalSetPieceActive = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => focalSetPieceActive,
    () => false
  );
