import type { Locale, ProgressStateV5 } from "./progress";

export type HumanRecordKind = "cafe" | "voicemail" | "recipe" | "fallback";

export interface HumanRecord {
  kind: HumanRecordKind;
  body: string;
}

const pt = (locale: Locale) => locale === "pt-BR";

/**
 * The final index deliberately chooses the most concrete ordinary memory the
 * player actually touched. Horror is allowed to alter the record, but never
 * to erase the human event underneath it.
 */
export const selectHumanRecord = (
  state: Pick<ProgressStateV5, "readFileIds" | "playerChoices">,
  locale: Locale
): HumanRecord => {
  if (state.readFileIds.includes("gull_0310_receipt")) {
    const legacyReply = state.playerChoices.find(
      (choice) => choice.choiceId === "next_user_1998_reply"
    )?.optionId;
    const residue = legacyReply === "silence"
      ? pt(locale)
        ? "A terceira cadeira estava seca. Do lado de fora, chovia."
        : "The third chair was dry. Outside, it was raining."
      : legacyReply === "warn"
        ? pt(locale)
          ? "No verso, a letra de Sarah acrescentou: NÃO ESCREVA O NOME DE QUEM SENTOU CONOSCO."
          : "On the reverse, Sarah's handwriting added: DO NOT WRITE THE NAME OF WHO SAT WITH US."
        : pt(locale)
          ? "Nenhuma das duas registrou o terceiro lugar. O sistema se lembra dele."
          : "Neither of them recorded the third place. The system remembers it.";
    return {
      kind: "cafe",
      body: pt(locale)
        ? `MESA: JANELA 4\nPEDIDOS: 2\nPESSOAS QUE CHEGARAM: 3\n\nEm pagou a conta. Sarah anotou no verso. ${residue}`
        : `TABLE: WINDOW 4\nORDERS: 2\nPEOPLE ARRIVED: 3\n\nEm paid the bill. Sarah wrote on the reverse. ${residue}`,
    };
  }

  if (state.readFileIds.includes("voicemail_to_em")) {
    return {
      kind: "voicemail",
      body: pt(locale)
        ? "Sarah perdeu o ônibus das seis. Em ainda esperava pelo jantar.\nPor alguns minutos, esse era o único problema.\nA gravação agora tem a duração exata do trajeto até a casa dela."
        : "Sarah missed the six o'clock bus. Em was still waiting for dinner.\nFor a few minutes, that was the only problem.\nThe recording is now exactly as long as the route to her house.",
    };
  }

  if (state.readFileIds.includes("dad_recipe")) {
    return {
      kind: "recipe",
      body: pt(locale)
        ? "A receita ainda pede uma ligação de vinte minutos.\nO pai de Sarah ainda explicaria tudo desde o começo.\nO telefone registra uma chamada atendida amanhã."
        : "The recipe still asks for a twenty-minute call.\nSarah's father would still explain it from the beginning.\nThe phone records an answered call tomorrow.",
    };
  }

  return {
    kind: "fallback",
    body: pt(locale)
      ? "Sarah prometeu voltar para jantar.\nTom levou sopa ao escritório.\nEm continuou esperando uma ligação.\nO índice classifica as três ações como ainda em andamento."
      : "Sarah promised to come home for dinner.\nTom brought soup to the office.\nEm kept waiting for a call.\nThe index classifies all three actions as still in progress.",
  };
};
