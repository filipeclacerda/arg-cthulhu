import { LiveContactStatus } from "./progress";

/**
 * Pure gating logic for Sarah's one live Messenger window (120s of *focused*
 * time, not wall-clock). The Messenger component samples these conditions
 * every tick and only reports elapsed time to the reducer
 * (`ADVANCE_LIVE_CONTACT`) while every gate holds.
 */
export interface LiveContactGate {
  /** Persisted status; only "active" spends the window. */
  status: LiveContactStatus;
  /** Page Visibility API — a hidden tab never spends the window. */
  documentHidden: boolean;
  /**
   * The Messenger window is open, not minimized, and is the top-most
   * (focused) window in the WindowManager.
   */
  messengerFocused: boolean;
  /**
   * A mandatory focal set piece (priority-1 diegetic event: the 1998 desktop
   * overlay or a focal alert window) is covering the desktop.
   */
  focalSetPieceActive: boolean;
}

export const shouldAdvanceLiveContact = (gate: LiveContactGate): boolean =>
  gate.status === "active" &&
  !gate.documentHidden &&
  gate.messengerFocused &&
  !gate.focalSetPieceActive;

/** Accumulated focused time is committed to the save at this cadence. */
export const LIVE_CONTACT_PERSIST_INTERVAL_MS = 5_000;

/** Sampling resolution of the live-contact timer. */
export const LIVE_CONTACT_TICK_MS = 1_000;
