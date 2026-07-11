import {
  Locale,
  OptionalDiscoveryId,
  ProgressStateV3,
  PuzzleId,
  WorldReactionId,
} from "./progress";
import { isUnlocked, UnlockCondition } from "./unlock";

export const OPTIONAL_MISSION_IDS = [
  "two_days_out",
  "tom_held_block",
  "eleanor_record",
] as const satisfies readonly OptionalDiscoveryId[];

export type OptionalMissionId = (typeof OPTIONAL_MISSION_IDS)[number];

export interface OptionalMissionDefinition {
  id: OptionalMissionId;
  availableWhen: UnlockCondition;
  completionWhen: UnlockCondition;
  completionArtifactId: string;
  reactionId: WorldReactionId;
}

export const OPTIONAL_MISSIONS: readonly OptionalMissionDefinition[] = [
  {
    id: "two_days_out",
    availableWhen: { type: "puzzleSolved", puzzleId: "lot_114" },
    completionWhen: {
      type: "evidenceOpened",
      evidenceId: "graymoor_return_receipt",
    },
    completionArtifactId: "graymoor_return_receipt",
    reactionId: "unindexed_interval",
  },
  {
    id: "tom_held_block",
    availableWhen: { type: "puzzleSolved", puzzleId: "lineage" },
    completionWhen: {
      type: "allOf",
      conditions: [
        { type: "evidenceOpened", evidenceId: "tom_hold_fragment" },
        { type: "evidenceOpened", evidenceId: "hash_manifest" },
      ],
    },
    completionArtifactId: "tom_hold_log",
    reactionId: "tom_hold_seek",
  },
  {
    id: "eleanor_record",
    availableWhen: { type: "puzzleSolved", puzzleId: "future_log" },
    completionWhen: {
      type: "evidenceOpened",
      evidenceId: "eleanor_reconciliation",
    },
    completionArtifactId: "eleanor_vcard",
    reactionId: "eleanor_owner_reconciled",
  },
];

export const optionalMission = (
  id: OptionalDiscoveryId
): OptionalMissionDefinition | undefined =>
  OPTIONAL_MISSIONS.find((mission) => mission.id === id);

const unlockContextFor = (state: ProgressStateV3) => ({
  flags: state.flags,
  discoveredEvidenceIds: state.discoveredEvidenceIds,
  solvedPuzzleIds: Object.entries(state.puzzles)
    .filter(([, puzzle]) => Boolean(puzzle.solvedAt))
    .map(([id]) => id as PuzzleId),
  insightsUnlocked: state.insightsUnlocked,
  worldReactionsSeen: state.worldReactionsSeen,
  playerChoices: state.playerChoices,
  liveContactStatus: state.liveContact.status,
});

export const canCompleteOptionalMission = (
  state: ProgressStateV3,
  id: OptionalDiscoveryId
): boolean => {
  const mission = optionalMission(id);
  if (!mission || state.optionalDiscoveries.includes(mission.id)) return false;
  const context = unlockContextFor(state);
  return (
    isUnlocked(mission.availableWhen, context) &&
    isUnlocked(mission.completionWhen, context)
  );
};

export const completedOptionalMissionCount = (
  discoveries: readonly OptionalDiscoveryId[]
): number =>
  OPTIONAL_MISSION_IDS.filter((id) => discoveries.includes(id)).length;

export const optionalMissionCodaLines = (
  discoveries: readonly OptionalDiscoveryId[],
  locale: Locale
): string[] => {
  const lines: string[] = [];
  if (discoveries.includes("two_days_out")) {
    lines.push(
      locale === "pt-BR"
        ? "ROTA DE DEVOLUÇÃO: criada antes de o pacote ser aceito."
        : "RETURN ROUTE: created before the parcel was accepted."
    );
  }
  if (discoveries.includes("tom_held_block")) {
    lines.push(
      locale === "pt-BR"
        ? "BLOCO RETIDO 04: não sobreviveu à verificação."
        : "HELD BLOCK 04: did not survive verification."
    );
  }
  if (discoveries.includes("eleanor_record")) {
    lines.push(
      locale === "pt-BR"
        ? "PROPRIETÁRIO 2014: continua sendo um checksum, não uma pessoa."
        : "2014 OWNER: remains a checksum, not a person."
    );
  }
  return lines;
};
