import type { AppType, WindowInstance } from "../context/WindowManagerContext";
import type { ProgressStateV5 } from "./progress";
import {
  activitySeenFlag,
  programsNeedingAttention,
  unseenRecentActivities,
  type ActivityProgram,
  type RecentActivity,
} from "./recentActivity";

/**
 * A digest acknowledges the summary, not the records it points at. Including
 * the current unseen ids makes the flag self-invalidating when a later event
 * arrives, without adding a new persisted save field.
 */
export const activityDigestFlag = (state: ProgressStateV5): string => {
  const signature = unseenRecentActivities(state)
    .map((activity) => activity.id)
    .sort()
    .join("_");
  return `recent_activity_digest_seen_${signature || "empty"}`;
};

export const activityDigestNeedsAttention = (state: ProgressStateV5): boolean =>
  unseenRecentActivities(state).length > 0 &&
  !state.flags[activityDigestFlag(state)];

export const programsWithVisibleAttention = (
  state: ProgressStateV5,
): ReadonlySet<ActivityProgram> => {
  const programs = new Set(programsNeedingAttention(state));
  if (activityDigestNeedsAttention(state)) programs.add("case-notes");
  else programs.delete("case-notes");
  return programs;
};

const activityMatchesWindow = (
  activity: RecentActivity,
  win: Pick<WindowInstance, "appType" | "props">,
): boolean => {
  if (activity.id === "endgame") return win.appType === "finale";
  if (activity.artifactId) return win.props.fileId === activity.artifactId;
  return win.appType === activity.program;
};

export const activityIdsOpenedByWindow = (
  state: ProgressStateV5,
  win: Pick<WindowInstance, "appType" | "props">,
): string[] =>
  unseenRecentActivities(state)
    .filter((activity) => activityMatchesWindow(activity, win))
    .map((activity) => activity.id);

export const windowNeedsAttention = (
  state: ProgressStateV5,
  win: Pick<WindowInstance, "appType" | "props">,
): boolean =>
  unseenRecentActivities(state).some((activity) =>
    activityMatchesWindow(activity, win),
  );

export const acknowledgeActivitiesOpenedByWindow = (
  state: ProgressStateV5,
  win: Pick<WindowInstance, "appType" | "props">,
  setFlag: (flag: string) => void,
) => {
  activityIdsOpenedByWindow(state, win).forEach((id) =>
    setFlag(activitySeenFlag(id)),
  );
};

export const appTypeNeedsAttention = (
  programs: ReadonlySet<ActivityProgram>,
  appType: AppType,
): boolean => {
  if (appType === "notepad" || appType === "image") {
    return programs.has("explorer");
  }
  return programs.has(appType as ActivityProgram);
};
