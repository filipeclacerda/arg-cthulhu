import type { ProgressStateV5, PuzzleId } from "./progress";

export type ActivityProgram =
  | "email"
  | "explorer"
  | "messenger"
  | "casefile"
  | "case-notes"
  | "finale"
  | "audio"
  | "browser";

export interface RecentActivity {
  id: string;
  program: ActivityProgram;
  title: { en: string; pt: string };
  summary: { en: string; pt: string };
  priority: "critical" | "supporting" | "atmospheric";
  artifactId?: string;
}

export type CriticalProgressRoute =
  | { kind: "recent-activity"; activityId: string }
  | { kind: "diegetic-event"; eventId: string }
  | {
      kind: "persistent-program";
      program: ActivityProgram;
      artifactId?: string;
    }
  | { kind: "resumable-session"; flag: string; program: ActivityProgram };

/**
 * The critical chain is deliberately represented separately from the copy
 * shown in Case Notes. This makes "two ways forward" a testable product
 * contract instead of a walkthrough promise that can silently drift.
 *
 * `recent-activity` is the recovery route when a transient alert was missed.
 * Every milestone also has a distinct persistent program, resumable session,
 * or queued diegetic event. The definitions are additive and derive entirely
 * from existing progress, so old saves need no migration.
 */
export interface CriticalProgressContract {
  id: string;
  routes: readonly CriticalProgressRoute[];
}

interface ActivityDefinition extends RecentActivity {
  occurred: (state: ProgressStateV5) => boolean;
}

const solved = (state: ProgressStateV5, id: PuzzleId) =>
  Boolean(state.puzzles[id].solvedAt);

const DEFINITIONS: readonly ActivityDefinition[] = [
  {
    id: "sarah-mail",
    program: "email",
    title: { en: "A delayed message arrived", pt: "Uma mensagem atrasada chegou" },
    summary: {
      en: "Outlook Express recovered mail sent from Sarah's account.",
      pt: "O Outlook Express recuperou uma mensagem enviada pela conta de Sarah.",
    },
    priority: "critical",
    occurred: (state) => Boolean(state.flags.sarah_email_arrived),
  },
  {
    id: "lot-114",
    program: "casefile",
    title: { en: "Lot 114 was identified", pt: "O Lote 114 foi identificado" },
    summary: {
      en: "Casefile.exe can now retain the first provenance findings.",
      pt: "O Casefile.exe agora pode reter os primeiros achados de procedência.",
    },
    priority: "critical",
    occurred: (state) => solved(state, "lot_114"),
  },
  {
    id: "palimpsest-recovered",
    program: "explorer",
    title: { en: "A second surface was recovered", pt: "Uma segunda superfície foi recuperada" },
    summary: {
      en: "margin_ch7.enc is waiting in Sarah's recovered folder.",
      pt: "margin_ch7.enc está esperando na pasta recuperada de Sarah.",
    },
    priority: "critical",
    artifactId: "cipher_1",
    occurred: (state) => solved(state, "palimpsest"),
  },
  {
    id: "margin-decoded",
    program: "explorer",
    title: { en: "The margin was decoded", pt: "A margem foi decodificada" },
    summary: {
      en: "A recovered audio file is now accessible in Sarah's folders.",
      pt: "Um áudio recuperado agora está acessível nas pastas de Sarah.",
    },
    priority: "critical",
    artifactId: "counting_audio",
    occurred: (state) => solved(state, "margin_cipher"),
  },
  {
    id: "counting-recovered",
    program: "audio",
    title: { en: "A second voice was rendered", pt: "Uma segunda voz foi renderizada" },
    summary: {
      en: "The left, reversed channel of counting.wav produced a stable transcript.",
      pt: "O canal esquerdo e reverso de counting.wav produziu uma transcrição estável.",
    },
    priority: "critical",
    artifactId: "counting_audio",
    occurred: (state) => solved(state, "counting_audio"),
  },
  {
    id: "lineage-opened",
    program: "explorer",
    title: { en: "The blank year moved", pt: "O ano em branco se moveu" },
    summary: {
      en: "access_log.txt now records actions dated tomorrow. The sequence can be reproduced.",
      pt: "access_log.txt agora registra ações datadas de amanhã. A sequência pode ser reproduzida.",
    },
    priority: "critical",
    artifactId: "access_log",
    occurred: (state) => solved(state, "lineage"),
  },
  {
    id: "future-log-reproduced",
    program: "explorer",
    title: { en: "The future log answered", pt: "O log futuro respondeu" },
    summary: {
      en: "INDEX.HLP is available in Chapter Seven. It describes how the references join.",
      pt: "INDEX.HLP está disponível no Capítulo Sete. Ele descreve como as referências se unem.",
    },
    priority: "critical",
    artifactId: "index_help",
    occurred: (state) => solved(state, "future_log"),
  },
  {
    id: "index-joined",
    program: "finale",
    title: { en: "The recovered program installed", pt: "O programa recuperado foi instalado" },
    summary: {
      en: "The index accepted the four references. Its unresolved owner is waiting.",
      pt: "O índice aceitou as quatro referências. Seu proprietário não resolvido está esperando.",
    },
    priority: "critical",
    occurred: (state) => solved(state, "index_name"),
  },
  {
    id: "ordinary-voicemail",
    program: "explorer",
    title: { en: "An ordinary voicemail surfaced", pt: "Uma mensagem de voz comum apareceu" },
    summary: {
      en: "Sarah left Em a message about coffee, dinner and a bus.",
      pt: "Sarah deixou para Em uma mensagem sobre café, jantar e um ônibus.",
    },
    priority: "supporting",
    artifactId: "voicemail_to_em",
    occurred: (state) => Boolean(state.flags.post_end_transcript_seen),
  },
  {
    id: "next-user-pending",
    program: "messenger",
    title: { en: "The 1998 carrier is still open", pt: "A portadora de 1998 ainda está aberta" },
    summary: {
      en: "NEXT_USER is waiting inside Miriam Bishop's desktop. The interrupted session can be resumed.",
      pt: "NEXT_USER está esperando no desktop de Miriam Bishop. A sessão interrompida pode ser retomada.",
    },
    priority: "critical",
    occurred: (state) =>
      Boolean(state.flags.next_user_handshake_sent) &&
      !state.flags.next_user_1998_complete,
  },
  {
    id: "next-user",
    program: "messenger",
    title: { en: "The 1998 session answered", pt: "A sessão de 1998 respondeu" },
    summary: {
      en: "NEXT_USER left a reply inside Miriam Bishop's desktop.",
      pt: "NEXT_USER deixou uma resposta dentro do desktop de Miriam Bishop.",
    },
    priority: "critical",
    occurred: (state) => Boolean(state.flags.next_user_1998_complete),
  },
  {
    id: "gull-receipt",
    program: "explorer",
    title: { en: "A café receipt was recovered", pt: "Um recibo do café foi recuperado" },
    summary: {
      en: "Window table 4 records a dinner Sarah and Em managed to finish.",
      pt: "A mesa 4 junto à janela registra um jantar que Sarah e Em conseguiram terminar.",
    },
    priority: "atmospheric",
    artifactId: "gull_0310_receipt",
    occurred: (state) => state.readFileIds.includes("gull_0310_receipt"),
  },
  {
    id: "endgame",
    program: "finale",
    title: { en: "A canonical decision is available", pt: "Uma decisão canônica está disponível" },
    summary: {
      en: "The recovered program is waiting. Review the human record before deciding.",
      pt: "O programa recuperado está esperando. Reveja o registro humano antes de decidir.",
    },
    priority: "critical",
    occurred: (state) => Boolean(state.flags.endgame_available),
  },
];

export const CRITICAL_PROGRESS_CONTRACTS: readonly CriticalProgressContract[] = [
  {
    id: "lot_114",
    routes: [
      { kind: "recent-activity", activityId: "lot-114" },
      { kind: "diegetic-event", eventId: "restricted_folder" },
      { kind: "persistent-program", program: "casefile" },
    ],
  },
  {
    id: "palimpsest",
    routes: [
      { kind: "recent-activity", activityId: "palimpsest-recovered" },
      { kind: "diegetic-event", eventId: "margin_file" },
      { kind: "persistent-program", program: "explorer", artifactId: "cipher_1" },
    ],
  },
  {
    id: "margin_cipher",
    routes: [
      { kind: "recent-activity", activityId: "margin-decoded" },
      { kind: "diegetic-event", eventId: "counting_file" },
      { kind: "persistent-program", program: "audio", artifactId: "counting_audio" },
    ],
  },
  {
    id: "counting_audio",
    routes: [
      { kind: "recent-activity", activityId: "counting-recovered" },
      { kind: "diegetic-event", eventId: "chapter_seven" },
      { kind: "persistent-program", program: "explorer" },
    ],
  },
  {
    id: "lineage",
    routes: [
      { kind: "recent-activity", activityId: "lineage-opened" },
      { kind: "persistent-program", program: "explorer", artifactId: "access_log" },
    ],
  },
  {
    id: "future_log",
    routes: [
      { kind: "recent-activity", activityId: "future-log-reproduced" },
      { kind: "persistent-program", program: "explorer", artifactId: "index_help" },
      { kind: "persistent-program", program: "casefile" },
    ],
  },
  {
    id: "next_user_1998",
    routes: [
      { kind: "recent-activity", activityId: "next-user-pending" },
      {
        kind: "resumable-session",
        flag: "next_user_handshake_sent",
        program: "messenger",
      },
      { kind: "diegetic-event", eventId: "next_user_1998_session" },
    ],
  },
  {
    id: "index_name",
    routes: [
      { kind: "recent-activity", activityId: "index-joined" },
      { kind: "diegetic-event", eventId: "endgame_program" },
      { kind: "persistent-program", program: "finale" },
    ],
  },
  {
    id: "endgame",
    routes: [
      { kind: "recent-activity", activityId: "endgame" },
      { kind: "diegetic-event", eventId: "endgame_program" },
      { kind: "persistent-program", program: "finale" },
    ],
  },
];

export const activitySeenFlag = (id: string) => `recent_activity_seen_${id}`;

export const recentActivities = (state: ProgressStateV5): RecentActivity[] =>
  DEFINITIONS.filter((definition) => definition.occurred(state)).map(
    ({ occurred: _occurred, ...activity }) => activity
  );

export const unseenRecentActivities = (state: ProgressStateV5): RecentActivity[] =>
  recentActivities(state).filter((activity) => !state.flags[activitySeenFlag(activity.id)]);

export const programsNeedingAttention = (
  state: ProgressStateV5
): ReadonlySet<ActivityProgram> =>
  new Set(unseenRecentActivities(state).map((activity) => activity.program));
