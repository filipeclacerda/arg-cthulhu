"use client";

import React from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useI18n } from "@/app/i18n";
import { ClueMarker } from "@/app/game/campaign";
import "./style.scss";

interface ClueTextProps {
  text: string;
  clues?: ClueMarker[];
  /** Element to render the body into. `pre` preserves whitespace (Notepad). */
  as?: "pre" | "div" | "p" | "span";
  className?: string;
}

/**
 * Renders a document body and turns authored phrases into clickable "clue"
 * chips. Clicking a clue extracts a token into the player's bank — the
 * Golden-Idol / Simulacra style of invasive, gradual discovery. Snippets that
 * do not occur in the current-locale text are silently ignored.
 */
const ClueText = ({ text, clues, as = "div", className }: ClueTextProps) => {
  const { state, collectedTokens, collectToken } = useProgress();
  const { t } = useI18n();
  const Tag = as as keyof JSX.IntrinsicElements;

  const markers = (clues ?? [])
    .map((clue) => ({
      tokenId: clue.tokenId,
      snippet: clue.snippet[state.locale],
    }))
    .filter((marker) => marker.snippet && text.includes(marker.snippet))
    // Longest snippets first so a short phrase never pre-empts a longer overlap.
    .sort((a, b) => b.snippet.length - a.snippet.length);

  if (markers.length === 0) {
    return <Tag className={className}>{text}</Tag>;
  }

  const nodes: React.ReactNode[] = [];
  let buffer = "";
  let key = 0;
  const flush = () => {
    if (buffer) {
      nodes.push(buffer);
      buffer = "";
    }
  };

  let index = 0;
  while (index < text.length) {
    const marker = markers.find((candidate) =>
      text.startsWith(candidate.snippet, index)
    );
    if (marker) {
      flush();
      const collected = collectedTokens.includes(marker.tokenId);
      nodes.push(
        <button
          key={`clue-${key++}`}
          type="button"
          className={`clue-token ${collected ? "clue-token--collected" : ""}`}
          onClick={() => collectToken(marker.tokenId)}
          title={collected ? t("clueCollected") : t("collectClue")}
          aria-pressed={collected}
        >
          {marker.snippet}
        </button>
      );
      index += marker.snippet.length;
    } else {
      buffer += text[index];
      index += 1;
    }
  }
  flush();

  return <Tag className={className}>{nodes}</Tag>;
};

export default ClueText;
