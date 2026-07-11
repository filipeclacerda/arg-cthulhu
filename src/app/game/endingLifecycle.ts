import type { ProgressStateV4 } from "./progress";

/**
 * Story-completion rules are deliberately derived from the canonical ending
 * field. The companion flag records presentation state only; it must never be
 * used to infer or replace the selected ending.
 */
export const isStoryComplete = (state: Pick<ProgressStateV4, "ending">): boolean =>
  state.ending !== null;

export const hasSeenEndingClosure = (
  state: Pick<ProgressStateV4, "flags">
): boolean => state.flags.ending_closure_seen === true;

export const isEndingClosurePending = (
  state: Pick<ProgressStateV4, "ending" | "flags">
): boolean => isStoryComplete(state) && !hasSeenEndingClosure(state);

export type DesktopMode = "ending" | "aftermath";

/** Only the two explicit post-ending routes are valid desktop modes. */
export const desktopModeFromSearch = (
  search: string | URLSearchParams
): DesktopMode | null => {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  const mode = params.get("mode");
  return mode === "ending" || mode === "aftermath" ? mode : null;
};

export const endingDesktopHref = "/desktop/?mode=ending";
export const aftermathDesktopHref = "/desktop/?mode=aftermath";
