import { ChapterId, InsightId, PuzzleId, chapterUnlocked } from "./progress";

/**
 * Shared gating vocabulary for every surface that reveals content over time:
 * the virtual filesystem, Outlook Express, MSN Messenger and — in later
 * phases — the Recovered Browser and the Recycle Bin.
 *
 * Prefer explicit `flag` / `puzzleSolved` / `evidenceOpened` gates for new
 * content. The `chapter` condition remains supported for stage-level gating;
 * since chapters (investigation stages) are derived exclusively from the
 * main puzzle chain, a chapter gate is effectively a puzzle gate.
 */
export type UnlockCondition =
  | { type: "always" }
  | { type: "flag"; flag: string }
  | { type: "puzzleSolved"; puzzleId: PuzzleId }
  | { type: "chapter"; chapterId: ChapterId }
  | { type: "evidenceOpened"; evidenceId: string }
  | { type: "fileRead"; fileId: string }
  | { type: "worldReaction"; reactionId: string }
  | { type: "choiceMade"; choiceId: string; optionId?: string }
  | { type: "liveContactClosed" }
  | { type: "not"; condition: UnlockCondition }
  | { type: "allOf"; conditions: UnlockCondition[] }
  | { type: "anyOf"; conditions: UnlockCondition[] };

export interface UnlockContext {
  flags: Record<string, boolean>;
  discoveredEvidenceIds?: string[];
  solvedPuzzleIds?: PuzzleId[];
  insightsUnlocked?: InsightId[];
  /** Optional richer context used by the diegetic event coordinator. */
  worldReactionsSeen?: string[];
  playerChoices?: { choiceId: string; optionId: string }[];
  liveContactStatus?: "unseen" | "active" | "closed";
  /**
   * Files the player has actually opened. Only the "computer remembers"
   * manifestations need this — a projected duplicate or move keys off whether
   * its canonical file was ever read.
   */
  readFileIds?: string[];
}

const isUnlockContext = (
  value: UnlockContext | Record<string, boolean>
): value is UnlockContext =>
  typeof (value as UnlockContext).flags === "object" &&
  (value as UnlockContext).flags !== null;

export function isUnlocked(
  condition: UnlockCondition,
  contextOrFlags: UnlockContext | Record<string, boolean>
): boolean {
  const context: UnlockContext = isUnlockContext(contextOrFlags)
    ? contextOrFlags
    : { flags: contextOrFlags };
  switch (condition.type) {
    case "always":
      return true;
    case "flag":
      return Boolean(context.flags[condition.flag]);
    case "puzzleSolved":
      return Boolean(context.solvedPuzzleIds?.includes(condition.puzzleId));
    case "chapter":
      return chapterUnlocked(context, condition.chapterId);
    case "evidenceOpened":
      return Boolean(
        context.discoveredEvidenceIds?.includes(condition.evidenceId)
      );
    case "fileRead":
      return Boolean(context.readFileIds?.includes(condition.fileId));
    case "worldReaction":
      return Boolean(
        context.worldReactionsSeen?.includes(condition.reactionId)
      );
    case "choiceMade":
      return Boolean(
        context.playerChoices?.some(
          (choice) =>
            choice.choiceId === condition.choiceId &&
            (condition.optionId === undefined ||
              choice.optionId === condition.optionId)
        )
      );
    case "liveContactClosed":
      return context.liveContactStatus === "closed";
    case "not":
      return !isUnlocked(condition.condition, context);
    case "allOf":
      return condition.conditions.every((child) => isUnlocked(child, context));
    case "anyOf":
      return condition.conditions.some((child) => isUnlocked(child, context));
  }
}
