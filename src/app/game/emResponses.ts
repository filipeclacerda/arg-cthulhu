import type { ProgressStateV5 } from "./progress";

export interface EmResponse {
  id: string;
  choiceId: string;
  available: (state: ProgressStateV5) => boolean;
  prompt: { en: string; pt: string };
  response: { en: string; pt: string };
}

export const EM_RESPONSES: readonly EmResponse[] = [
  {
    id: "recipe",
    choiceId: "em_optional_recipe",
    available: (state) => state.readFileIds.includes("dad_recipe"),
    prompt: { en: "Ask Em about Dad's recipe", pt: "Perguntar a Em sobre a receita do pai" },
    response: {
      en: "She never followed the recipe. She called him and let him explain it again. Twenty minutes, every time.",
      pt: "Ela nunca seguia a receita. Ligava para ele e deixava que explicasse tudo de novo. Vinte minutos, toda vez.",
    },
  },
  {
    id: "cafe",
    choiceId: "em_optional_cafe",
    available: (state) => state.readFileIds.includes("gull_0310_receipt"),
    prompt: { en: "Ask about window table 4", pt: "Perguntar sobre a mesa 4 junto à janela" },
    response: {
      en: "She arrived late and stole half my chowder. That receipt is proof we finished one dinner without talking about Mom.",
      pt: "Ela chegou atrasada e roubou metade da minha sopa. Esse recibo prova que terminamos um jantar sem falar da mamãe.",
    },
  },
  {
    id: "voicemail",
    choiceId: "em_optional_voicemail",
    available: (state) => state.readFileIds.includes("voicemail_to_em"),
    prompt: { en: "Tell Em you heard the voicemail", pt: "Dizer a Em que ouviu a mensagem de voz" },
    response: {
      en: "That is the last time I heard Sarah talking about something that could still happen. Dinner. A bus. Getting home.",
      pt: "Foi a última vez que ouvi Sarah falando de algo que ainda podia acontecer. Jantar. Um ônibus. Chegar em casa.",
    },
  },
  {
    id: "dad-draft",
    choiceId: "em_optional_dad_draft",
    available: (state) => state.readFileIds.includes("unsent_to_dad"),
    prompt: { en: "Ask whether to send the draft", pt: "Perguntar se deve enviar o rascunho" },
    response: {
      en: "Don't send it. Please. Some unfinished things still belong to the person who wrote them.",
      pt: "Não envie. Por favor. Algumas coisas inacabadas ainda pertencem a quem escreveu.",
    },
  },
];

export const answeredEmResponses = (state: ProgressStateV5): EmResponse[] =>
  EM_RESPONSES.filter((response) =>
    state.playerChoices.some((choice) => choice.choiceId === response.choiceId)
  );

export const nextEmResponse = (state: ProgressStateV5): EmResponse | null =>
  EM_RESPONSES.find(
    (response) =>
      response.available(state) &&
      !state.playerChoices.some((choice) => choice.choiceId === response.choiceId)
  ) ?? null;
