import type { ProgressStateV5, PuzzleId } from "./progress";

export type ActivityProgram =
  | "email"
  | "explorer"
  | "messenger"
  | "casefile"
  | "case-notes"
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
    program: "case-notes",
    title: { en: "A canonical decision is available", pt: "Uma decisão canônica está disponível" },
    summary: {
      en: "The recovered program is waiting. Review the human record before deciding.",
      pt: "O programa recuperado está esperando. Reveja o registro humano antes de decidir.",
    },
    priority: "critical",
    occurred: (state) => Boolean(state.flags.endgame_available),
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
