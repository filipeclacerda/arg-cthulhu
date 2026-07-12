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
  if (state.puzzles.palimpsest.attempts > 0 && !state.puzzles.palimpsest.solvedAt) {
    guides.push({
      id: "image-compare",
      en: "In Image Viewer, open both related scans and use Compare. Zoom changes the view, not the evidence.",
      pt: "No Visualizador de Imagens, abra os dois scans relacionados e use Comparar. O zoom altera a visualização, não a evidência.",
    });
  }
  if (state.flags.correlation_tutorial_seen || state.confirmedConnections.length > 0) {
    guides.push({
      id: "board-drag",
      en: "Casefile cards can be dragged. Drag the empty board to pan; Ctrl + mouse wheel zooms only the board.",
      pt: "Os cartões do Casefile podem ser arrastados. Arraste o fundo para mover; Ctrl + roda do mouse amplia somente o quadro.",
    });
  }
  return guides;
};
