import type { EndingId, ProgressStateV5 } from "./progress";

/** The fullscreen Finale's presentational phases, independent of persistence. */
export type FinalePresentationScreen =
  | "intro"
  | "choice"
  | "seal_confirm"
  | "restore_incomplete"
  | "coda";

export interface FinalePresentationState {
  screen: FinalePresentationScreen;
  /** Present only once a canonical ending has already been recorded. */
  ending?: EndingId;
}

export type FinalePresentationSource = Pick<ProgressStateV5, "ending" | "flags">;

/**
 * Chooses the first fullscreen phase for the current save.
 *
 * An incomplete restoration deliberately takes precedence over the recorded
 * `restore` ending: it has its own presentation and aftermath. Other recorded
 * endings always reopen directly into their read-only coda.
 */
export const selectInitialFinalePresentation = (
  state: FinalePresentationSource
): FinalePresentationState => {
  if (state.flags.ending_restore_incomplete) {
    return { screen: "restore_incomplete", ending: "restore" };
  }

  if (state.ending) {
    return { screen: "coda", ending: state.ending };
  }

  if (state.flags.seal_relay_prepared) {
    return { screen: "seal_confirm" };
  }

  return { screen: "intro" };
};

/** The only phase where viewing the finale counts as seeing its main choice. */
export const shouldRecordFinaleChoiceSeen = (
  presentation: Pick<FinalePresentationState, "screen">
): boolean => presentation.screen === "choice";
