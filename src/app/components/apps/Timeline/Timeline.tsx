"use client";

import React, { useMemo, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { useI18n } from "@/app/i18n";
import "../ArgTools/style.scss";
import "./style.scss";

interface TimelineEvent {
  id: string;
  date: string;
  sort: number;
  evidenceId: string;
  en: string;
  pt: string;
}

const EVENTS: TimelineEvent[] = [
  { id: "miriam-note", date: "1998-09-03", sort: 1, evidenceId: "miriam_1998", en: "Miriam leaves the accession note unfinished.", pt: "Miriam deixa a nota de incorporação inacabada." },
  { id: "miriam-missing", date: "1998-09-14", sort: 2, evidenceId: "miriam_letter_1998", en: "Miriam Bishop is reported missing.", pt: "Miriam Bishop é declarada desaparecida." },
  { id: "lot-ships", date: "2026-02-28", sort: 3, evidenceId: "lot_114_order", en: "Graymoor ships Lot 114 to Sarah.", pt: "A Graymoor envia o Lote 114 para Sarah." },
  { id: "audio", date: "2026-03-14", sort: 4, evidenceId: "counting_audio", en: "Sarah records the counting.", pt: "Sarah grava a contagem." },
  { id: "sarah-missing", date: "2026-03-16", sort: 5, evidenceId: "incident_report", en: "Sarah disappears from the locked office.", pt: "Sarah desaparece da sala trancada." },
  { id: "office-photo", date: "2026-03-19", sort: 6, evidenceId: "office_after_photo", en: "Campus Security photographs the empty office.", pt: "A Segurança fotografa o escritório vazio." },
  { id: "tom-image", date: "2026-03-23", sort: 7, evidenceId: "tom_last_message", en: "Tom mounts the forensic image.", pt: "Tom monta a imagem forense." },
  { id: "future-log", date: "{TOMORROW}", sort: 8, evidenceId: "future_access_log", en: "The image records the observer's actions.", pt: "A imagem registra as ações do observador." },
];

const Timeline = () => {
  const { discoveredEvidenceIds, dispatchGameEvent, state } = useProgress();
  const { locale } = useI18n();
  const { play } = useSound();
  const known = useMemo(
    () => EVENTS.filter((event) => discoveredEvidenceIds.includes(event.evidenceId)),
    [discoveredEvidenceIds]
  );
  const [order, setOrder] = useState<string[]>(() =>
    [...known].sort((a, b) => a.id.localeCompare(b.id)).map((event) => event.id)
  );
  const [feedback, setFeedback] = useState("");
  const visibleOrder = [
    ...order.filter((id) => known.some((event) => event.id === id)),
    ...known.filter((event) => !order.includes(event.id)).map((event) => event.id),
  ];

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= visibleOrder.length) return;
    const next = [...visibleOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setFeedback("");
  };

  const test = () => {
    const sorted = visibleOrder
      .map((id) => known.find((event) => event.id === id)!)
      .every((event, index, values) => index === 0 || values[index - 1].sort < event.sort);
    if (sorted && known.length >= 5) {
      setFeedback(
        locale === "pt-BR"
          ? "A cronologia permanece estável — exceto pelo último registro."
          : "The chronology holds — except for the final record."
      );
      dispatchGameEvent({ type: "SEE_ASSET_VARIANT", variantId: "timeline-reconstructed" });
      play("chime");
    } else {
      setFeedback(
        locale === "pt-BR"
          ? "Uma ou mais evidências aparecem antes da causa que deveriam registrar."
          : "One or more records appear before the cause they should document."
      );
      play("error");
    }
  };

  return (
    <div className="arg-tool case-timeline">
      <div className="arg-tool__menubar">
        <span>File</span><span>Arrange</span><span>Evidence</span><span>Help</span>
      </div>
      <header>
        <div>
          <small>SB-0316 / CHRONOLOGY WORKSHEET</small>
          <h2>{locale === "pt-BR" ? "Linha do Tempo do Caso" : "Case Timeline"}</h2>
        </div>
        <strong>{known.length} / {EVENTS.length}</strong>
      </header>
      <div className="case-timeline__ruler" aria-hidden="true">
        <span>1998</span><i /><span>2014</span><i /><span>2026</span><i /><span>{locale === "pt-BR" ? "AMANHÃ" : "TOMORROW"}</span>
      </div>
      <ol>
        {visibleOrder.map((id, index) => {
          const event = known.find((candidate) => candidate.id === id)!;
          const impossible = event.date === "{TOMORROW}";
          return (
            <li key={id} className={impossible ? "impossible" : ""}>
              <div className="case-timeline__controls">
                <button className="button" onClick={() => move(index, -1)} disabled={index === 0}>▲</button>
                <button className="button" onClick={() => move(index, 1)} disabled={index === visibleOrder.length - 1}>▼</button>
              </div>
              <time>{event.date}</time>
              <span>{locale === "pt-BR" ? event.pt : event.en}</span>
              <small>{event.evidenceId}</small>
            </li>
          );
        })}
      </ol>
      <footer>
        <button
          className="button case-timeline__test-button"
          onClick={test}
          disabled={known.length < 5}
        >
          {locale === "pt-BR" ? "Testar cronologia" : "Test chronology"}
        </button>
        <p>{feedback || (locale === "pt-BR" ? "Ordene apenas o que as evidências sustentam." : "Order only what the evidence supports.")}</p>
      </footer>
      <div className="arg-tool__status">
        <span>{state.assetVariantsSeen.includes("timeline-reconstructed") ? "SEQUENCE RETAINED" : "WORKING COPY"}</span>
        <span>Dates inside braces follow the observer clock.</span>
      </div>
    </div>
  );
};

export default Timeline;
