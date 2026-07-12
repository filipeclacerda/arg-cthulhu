import type { ProgressStateV5 } from "./progress";

export interface ContextualGuide {
  id: string;
  en: string;
  pt: string;
}

export const contextualGuidance = (state: ProgressStateV5): ContextualGuide[] => {
  const guides: ContextualGuide[] = [];
  const audio = state.puzzles.counting_audio;
  if ((audio.nearMisses.audio_channel ?? 0) > 0 || (audio.nearMisses.audio_reverse ?? 0) > 0) {
    guides.push({
      id: "audio-reverse",
      en: "Audio buffers can be isolated by channel and played in reverse. Keep any setting the player identifies as correct.",
      pt: "Buffers de áudio podem ser isolados por canal e reproduzidos ao contrário. Mantenha qualquer ajuste que o player identificar como correto.",
    });
  }
  if (state.flags.image_compare_friction && !state.flags.image_compare_used) {
    guides.push({
      id: "image-compare",
      en: "Both office frames are available. In Image Viewer, open either one and use Compare frames; zoom changes only the view.",
      pt: "Os dois registros do escritório estão disponíveis. No Visualizador de Imagens, abra um deles e use Comparar quadros; o zoom altera apenas a visualização.",
    });
  }
  if (state.flags.correlation_tutorial_seen && !state.flags.casefile_card_dragged) {
    guides.push({
      id: "card-drag",
      en: "Casefile cards can be dragged into a personal layout without changing their evidentiary meaning.",
      pt: "Os cartões do Casefile podem ser arrastados para uma organização pessoal sem alterar seu significado como evidência.",
    });
  }
  if (state.flags.casefile_pan_friction && !state.flags.casefile_board_panned) {
    guides.push({
      id: "board-pan",
      en: "Drag an empty part of the Casefile board to move across the evidence field.",
      pt: "Arraste uma área vazia do quadro do Casefile para percorrer o campo de evidências.",
    });
  }
  if (state.flags.casefile_zoom_friction && !state.flags.casefile_board_zoomed) {
    guides.push({
      id: "board-zoom",
      en: "Hold Ctrl while using the mouse wheel to zoom the Casefile board.",
      pt: "Segure Ctrl enquanto usa a roda do mouse para ampliar o quadro do Casefile.",
    });
  }
  return guides;
};
