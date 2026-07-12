import { ProgressStateV3, PuzzleId } from "./progress";
import { UnlockCondition, UnlockContext, isUnlocked } from "./unlock";
import { diegeticContext } from "./diegeticEvents";

/**
 * "The computer remembers." Pure interpretation layer for the ambient
 * manifestations of the archive — the projected duplicates, the files that
 * move, and the contaminated window titles and search echoes that appear once
 * the machine starts recording the observer.
 *
 * Every function here is a pure selector over the persisted save. Nothing
 * mutates state and nothing invents evidence:
 *
 *  - A `ProjectedFile` is a VISUAL appearance of an existing canonical file.
 *    It carries its own `instanceId` (stable, so it never re-fires on reload)
 *    but points back to a real `sourceFileId`. Two appearances of the same
 *    content therefore open the same file — evidence, progress and puzzle
 *    gates are keyed on the canonical id, never on the projection.
 *  - A "move" is modelled as a projection into the new folder plus a
 *    suppression of the canonical entry from its origin (see
 *    `suppressedFiles`). A critical file is only ever suppressed AFTER it has
 *    served its purpose, so nothing the campaign needs can disappear early.
 *  - Titles and search are additive contamination only. `resolveWindowTitle`
 *    decorates a title; `browserSearchEchoes` adds suggestions alongside the
 *    real results and is suppressed whenever it would collide with the live
 *    query — a valid puzzle search is never intercepted.
 *
 * The registries below are the single source of truth the UI surfaces read
 * from in later steps (Explorer, Recycle Bin, Start Menu recents, window
 * chrome, the Recovered Browser).
 */

export interface ProjectedFile {
  /** Stable id for this appearance; distinct from `sourceFileId`. */
  instanceId: string;
  /** The canonical VFile whose content this projection opens. */
  sourceFileId: string;
  displayName: string;
  /** Target folder id (or `RECYCLE_BIN_FOLDER_ID` for the bin). */
  folderId: string;
  /** May contain `{TOMORROW}` / `{PLAYER}` tokens; resolved at render time. */
  modified?: string;
  size?: string;
}

/** A canonical file to hide from a folder because it has visually "moved". */
export interface FileSuppression {
  sourceFileId: string;
  folderId: string;
}

/** Nominal folder id used for projections into the Recycle Bin. */
export const RECYCLE_BIN_FOLDER_ID = "recycle-bin";

type ManifestationSurface = "filesystem" | "recycle" | "recent";

interface ManifestationDefinition extends ProjectedFile {
  surface: ManifestationSurface;
  /** When this projection becomes visible. */
  when: UnlockCondition;
  /** If this ever holds, the projection is retired. */
  obsoleteWhen?: UnlockCondition;
}

interface SuppressionDefinition extends FileSuppression {
  when: UnlockCondition;
}

const lineageSolved: UnlockCondition = {
  type: "puzzleSolved",
  puzzleId: "lineage",
};

/**
 * The escalation table, expressed as projections. Ordering follows the
 * campaign timeline: a duplicate the machine kept, a file it relocated, an
 * apology it moved out of the trash and later returned dated tomorrow.
 */
export const DESKTOP_MANIFESTATIONS: readonly ManifestationDefinition[] = [
  // STATUS_QUERY.PRN — the first demonstration that the system duplicates what
  // it observes. After the printer answers a query nobody sent and the sheet
  // flips PRESENT -> DUPLICATED, a second instance settles into RECOVERED with
  // a timestamp that has not happened yet.
  {
    instanceId: "status_query_recovered_dupe",
    surface: "filesystem",
    sourceFileId: "status_query_sheet",
    displayName: "STATUS_QUERY.PRN",
    folderId: "restricted",
    modified: "{TOMORROW} 03:14",
    when: { type: "flag", flag: "status_sheet_duplicated" },
  },
  // The same duplicate advertises itself in Recent Documents before the player
  // ever opens it — retired the moment the canonical sheet is actually read.
  {
    instanceId: "status_query_recent_precognition",
    surface: "recent",
    sourceFileId: "status_query_sheet",
    displayName: "STATUS_QUERY.PRN",
    folderId: "sarah",
    modified: "{TOMORROW} 03:14",
    when: { type: "flag", flag: "status_sheet_duplicated" },
    obsoleteWhen: { type: "fileRead", fileId: "status_query_sheet" },
  },
  // margin_ch7.enc moves into RECOVERED once its cipher is spent. The canonical
  // copy is suppressed from Sarah's folder (see CANONICAL_SUPPRESSIONS); this
  // projection keeps the content reachable at the new location. Only ever fires
  // AFTER margin_cipher is solved — the puzzle input never vanishes early.
  {
    instanceId: "margin_ch7_relocated",
    surface: "filesystem",
    sourceFileId: "cipher_1",
    displayName: "margin_ch7.enc",
    folderId: "restricted",
    modified: "{TOMORROW} 03:11",
    when: { type: "puzzleSolved", puzzleId: "margin_cipher" },
  },
  // counting.wav re-enters Recent Documents carrying a date later than the
  // playback that recovered it.
  {
    instanceId: "counting_recent_future_dated",
    surface: "recent",
    sourceFileId: "counting_audio",
    displayName: "counting.wav",
    folderId: "restricted",
    modified: "{TOMORROW} 03:13",
    size: "43.1 MB",
    when: { type: "puzzleSolved", puzzleId: "counting_audio" },
  },
  // APOLOGY.TMP: an optional artifact the machine relocates. Once the player
  // opens it in the bin it leaves the trash (suppressed) and reappears under
  // Work — this Work copy persists for the rest of the campaign.
  {
    instanceId: "apology_moved_to_work",
    surface: "filesystem",
    sourceFileId: "apology_tmp",
    displayName: "APOLOGY.TMP",
    folderId: "work",
    size: "2 KB",
    when: { type: "fileRead", fileId: "apology_tmp" },
  },
  // ...and after the future log is solved a fresh instance returns to the bin,
  // dated tomorrow, while the Work copy remains. Because the canonical bin
  // entry stays suppressed once opened, exactly one APOLOGY sits in the trash.
  {
    instanceId: "apology_returned_to_bin",
    surface: "recycle",
    sourceFileId: "apology_tmp",
    displayName: "APOLOGY.TMP",
    folderId: RECYCLE_BIN_FOLDER_ID,
    modified: "{TOMORROW}",
    size: "2 KB",
    when: {
      type: "allOf",
      conditions: [
        { type: "fileRead", fileId: "apology_tmp" },
        { type: "puzzleSolved", puzzleId: "future_log" },
      ],
    },
  },
];

/**
 * Canonical entries to hide from a surface because their content has moved.
 * The suppression is what turns a "duplicate projection" into a "move".
 */
export const CANONICAL_SUPPRESSIONS: readonly SuppressionDefinition[] = [
  // margin_ch7.enc left Sarah's folder for RECOVERED (only after it was solved).
  {
    sourceFileId: "cipher_1",
    folderId: "sarah",
    when: { type: "puzzleSolved", puzzleId: "margin_cipher" },
  },
  // Once opened, the original APOLOGY.TMP is gone from the bin for good; any
  // later appearance there is the returned projection, dated tomorrow.
  {
    sourceFileId: "apology_tmp",
    folderId: RECYCLE_BIN_FOLDER_ID,
    when: { type: "fileRead", fileId: "apology_tmp" },
  },
];

/** Builds the gating context, extended with the files the player has read. */
export const manifestationContext = (state: ProgressStateV3): UnlockContext => ({
  ...diegeticContext(state),
  readFileIds: state.readFileIds,
});

const isProjectionActive = (
  definition: ManifestationDefinition,
  context: UnlockContext
): boolean =>
  isUnlocked(definition.when, context) &&
  !(definition.obsoleteWhen && isUnlocked(definition.obsoleteWhen, context));

const toProjectedFile = (definition: ManifestationDefinition): ProjectedFile => ({
  instanceId: definition.instanceId,
  sourceFileId: definition.sourceFileId,
  displayName: definition.displayName,
  folderId: definition.folderId,
  modified: definition.modified,
  size: definition.size,
});

const projectSurface = (
  state: ProgressStateV3,
  surface: ManifestationSurface,
  definitions: readonly ManifestationDefinition[] = DESKTOP_MANIFESTATIONS
): ProjectedFile[] => {
  const context = manifestationContext(state);
  return definitions
    .filter(
      (definition) =>
        definition.surface === surface && isProjectionActive(definition, context)
    )
    .map(toProjectedFile);
};

/** Extra files the machine has projected into the folder tree. */
export const projectFilesystem = (
  state: ProgressStateV3,
  definitions?: readonly ManifestationDefinition[]
): ProjectedFile[] => projectSurface(state, "filesystem", definitions);

/** Extra entries the machine has projected into the Recycle Bin. */
export const projectRecycleBin = (
  state: ProgressStateV3,
  definitions?: readonly ManifestationDefinition[]
): ProjectedFile[] => projectSurface(state, "recycle", definitions);

/**
 * The impossible Recent Documents entries. This returns only the projected
 * (anomalous) shortcuts; the real recently-opened list and the static
 * onboarding shortcuts are merged in by the Start Menu itself.
 */
export const projectRecentDocuments = (
  state: ProgressStateV3,
  definitions?: readonly ManifestationDefinition[]
): ProjectedFile[] => projectSurface(state, "recent", definitions);

/** Canonical files that should be hidden from a folder because they moved. */
export const suppressedFiles = (
  state: ProgressStateV3,
  definitions: readonly SuppressionDefinition[] = CANONICAL_SUPPRESSIONS
): FileSuppression[] => {
  const context = manifestationContext(state);
  return definitions
    .filter((definition) => isUnlocked(definition.when, context))
    .map(({ sourceFileId, folderId }) => ({ sourceFileId, folderId }));
};

/** True once titles start reflecting the observer (after lineage). */
export const titlesContaminated = (state: ProgressStateV3): boolean =>
  isUnlocked(lineageSolved, manifestationContext(state));

interface TitleContamination {
  id: string;
  matches: (title: string) => boolean;
  decorate: (title: string, observerDesignation: string) => string;
}

const OBSERVER_DESIGNATION_FALLBACK = "CURRENT OBSERVER";

const TITLE_CONTAMINATIONS: readonly TitleContamination[] = [
  {
    // Sarah's name degrades toward the observer's designation.
    id: "sarah_name",
    matches: (title) => title.includes("Sarah Bishop"),
    decorate: (title, designation) => title.replace("Sarah Bishop", designation),
  },
  {
    // The RECOVERED folder acquires the current observer — but never the
    // "RECOVERED PROGRAM" finale window, which is a different surface.
    id: "recovered_folder",
    matches: (title) =>
      title.includes("RECOVERED") && !title.includes("PROGRAM"),
    decorate: (title) =>
      title.includes("CURRENT OBSERVER") ? title : `${title} — CURRENT OBSERVER`,
  },
  {
    id: "messenger_tomorrow",
    matches: (title) => title.includes("MSN Messenger"),
    decorate: (title) =>
      title.includes("archived tomorrow") ? title : `${title} — archived tomorrow`,
  },
  {
    id: "office_after_instances",
    matches: (title) => title.includes("office_after.jpg"),
    decorate: (title) =>
      title.includes("2 instances") ? title : `${title} — 2 instances`,
  },
];

/**
 * Contaminates a window title once the machine reflects the observer. Uses the
 * same selector on the frame and the taskbar so the two can never diverge.
 * Returns the original title unchanged before `lineage`, or when nothing
 * matches.
 */
export const resolveWindowTitle = (
  target: { title: string },
  state: ProgressStateV3
): string => {
  if (!titlesContaminated(state)) return target.title;
  const designation =
    state.playerName?.trim() || OBSERVER_DESIGNATION_FALLBACK;
  for (const rule of TITLE_CONTAMINATIONS) {
    if (rule.matches(target.title)) return rule.decorate(target.title, designation);
  }
  return target.title;
};

export interface SearchEcho {
  id: string;
  kind: "suggestion" | "history" | "unperformed";
  text: string;
}

interface SearchEchoDefinition {
  id: string;
  kind: SearchEcho["kind"];
  when: UnlockCondition;
  text: (observerDesignation: string) => string;
}

// Observer/future-themed echoes only — by construction these can never be a
// valid catalogue query (which are about lots, coastlines and lineage years),
// so a real puzzle search is never intercepted. They are additive: displayed
// beside the real results, never replacing them.
const SEARCH_ECHOES: readonly SearchEchoDefinition[] = [
  {
    id: "future_search_unperformed",
    kind: "unperformed",
    when: lineageSolved,
    text: (designation) => `${designation.toLowerCase()} — search not performed`,
  },
  {
    id: "observer_autocomplete",
    kind: "suggestion",
    when: { type: "puzzleSolved", puzzleId: "future_log" },
    text: (designation) => `who is ${designation.toLowerCase()}`,
  },
];

const normalizeQuery = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Additive search contamination for the Recovered Browser. Emits observer/
 * future echoes once titles are contaminated, suppressing any echo that would
 * duplicate the live query. Never returns anything that could stand in for a
 * valid puzzle search.
 */
export const browserSearchEchoes = (
  state: ProgressStateV3,
  query: string,
  definitions: readonly SearchEchoDefinition[] = SEARCH_ECHOES
): SearchEcho[] => {
  const context = manifestationContext(state);
  const designation = state.playerName?.trim() || OBSERVER_DESIGNATION_FALLBACK;
  const normalizedQuery = normalizeQuery(query);
  return definitions
    .filter((definition) => isUnlocked(definition.when, context))
    .map((definition) => ({
      id: definition.id,
      kind: definition.kind,
      text: definition.text(designation),
    }))
    .filter((echo) => normalizeQuery(echo.text) !== normalizedQuery);
};

/** Convenience for callers that only need the anomalous stage gate. */
export const MANIFESTATION_LINEAGE_GATE: PuzzleId = "lineage";
