import {
  Locale,
  OptionalDiscoveryId,
  ProgressStateV3,
  PuzzleId,
  WorldReactionId,
  EndingId,
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

const ENDING_CODAS: Record<OptionalMissionId, Record<EndingId, { en: string; pt: string }>> = {
  two_days_out: {
    restore: { en: "The parcel reaches its destination. Sarah does not remember sending it.", pt: "O pacote chega ao destino. Sarah não se lembra de tê-lo enviado." },
    shutdown: { en: "Two days later, Em receives the return notification.", pt: "Dois dias depois, Em recebe a notificação de devolução." },
    seal: { en: "The tracking route disappears. Em keeps the café receipt.", pt: "A rota de rastreamento desaparece. Em conserva o recibo do café." },
    leave_blank: { en: "The return route remains open, waiting for a parcel already accepted.", pt: "A rota de devolução permanece aberta, esperando um pacote já aceito." },
    archive_self: { en: "The return label now names the observer as recipient.", pt: "A etiqueta de devolução agora nomeia o observador como destinatário." },
  },
  tom_held_block: {
    restore: { en: "A retained block recovers one last line from Tom: “Tell Rosa I called.”", pt: "Um bloco retido recupera uma última frase de Tom: “Diga à Rosa que liguei.”" },
    shutdown: { en: "Tom's hash remains in the police report as a corrupted file.", pt: "O hash de Tom permanece no relatório policial como arquivo corrompido." },
    seal: { en: "The block is removed. Tom's name returns to the custody manifest.", pt: "O bloco é removido. O nome de Tom retorna ao manifesto de custódia." },
    leave_blank: { en: "HELD BLOCK 04 continues seeking the operator who mounted it.", pt: "BLOCO RETIDO 04 continua procurando o operador que o montou." },
    archive_self: { en: "Tom Alvarez is no longer the last operator in the manifest.", pt: "Tom Alvarez deixa de ser o último operador no manifesto." },
  },
  eleanor_record: {
    restore: { en: "Eleanor receives a corrected copy of the record bearing her name.", pt: "Eleanor recebe uma cópia corrigida do registro que leva seu nome." },
    shutdown: { en: "The contact remains ownerless, but it is not deleted.", pt: "O contato permanece sem proprietário, mas não é apagado." },
    seal: { en: "The checksum no longer resolves to a living person.", pt: "O checksum deixa de apontar para uma pessoa viva." },
    leave_blank: { en: "Eleanor's record keeps one empty owner field.", pt: "O registro de Eleanor conserva um campo de proprietário vazio." },
    archive_self: { en: "The record lists Eleanor Vale and the observer as witnesses.", pt: "O registro lista Eleanor Vale e o observador como testemunhas." },
  },
};

export const optionalMissionEndingCodas = (
  discoveries: readonly OptionalDiscoveryId[],
  ending: EndingId,
  locale: Locale
): string[] => OPTIONAL_MISSION_IDS
  .filter((id) => discoveries.includes(id))
  .map((id) => ENDING_CODAS[id][ending][locale === "pt-BR" ? "pt" : "en"]);
