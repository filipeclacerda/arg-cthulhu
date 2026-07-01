"use client";

import React, { useMemo, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import {
  CASE_STATEMENTS,
  collectedTokensOfType,
  localized,
  TOKENS_BY_ID,
} from "@/app/game/campaign";
import { CaseQuestionId } from "@/app/game/progress";
import { displayedEvidenceIds } from "@/app/game/caseReconstruction";
import {
  BoardCard,
  BoardCategory,
  EVIDENCE_CARDS,
  PERSON_CARDS,
} from "@/app/data/evidenceBoard";
import { localizedBoardCard } from "@/app/data/localizedNarrative";
import { files } from "@/app/data/filesystem";
import { emails } from "@/app/data/emails";
import { PAGE_ADDRESS } from "@/app/components/apps/RecoveredBrowser/RecoveredBrowser";
import { useI18n } from "@/app/i18n";
import "../ArgTools/style.scss";
import "./style.scss";

const CATEGORY_ORDER: BoardCategory[] = [
  "person",
  "photo",
  "document",
  "audio",
  "email",
  "conversation",
  "record",
];

const RECORD_PAGE_ADDRESS: Partial<Record<string, string>> = {
  catalogue_lot_114: PAGE_ADDRESS.lot,
  coastline_archive: PAGE_ADDRESS.coast,
  sarah_future_record: PAGE_ADDRESS.sarah,
  whitfield_memo: PAGE_ADDRESS.memo,
  tom_homepage: PAGE_ADDRESS.tom,
  danforth_cache: PAGE_ADDRESS.danforth,
  pabodie_archive: PAGE_ADDRESS.expedition,
};

const CaseReconstruction = () => {
  const { state, discoveredEvidenceIds, dispatchGameEvent } = useProgress();
  const { locale, t } = useI18n();
  const { play } = useSound();
  const { openWindow } = useWindowManager();

  const visibleStatements = CASE_STATEMENTS.filter(
    (statement) =>
      statement.act === 1 ||
      (statement.act === 2 && state.leadsUnlocked.includes(statement.leadId)) ||
      (statement.act === 3 &&
        (state.leadsUnlocked.includes("observer") ||
          Boolean(state.puzzles.future_log.solvedAt)))
  );
  const firstOpen =
    visibleStatements.find(
      (statement) => !state.caseAnswers[statement.id]?.solvedAt
    )?.id ?? visibleStatements[0].id;

  const [statementId, setStatementId] =
    useState<CaseQuestionId>(firstOpen);
  const [slotSelections, setSlotSelections] = useState<Record<string, string>>(
    {}
  );
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [evidenceIds, setEvidenceIds] = useState<string[]>(
    state.caseAnswers[firstOpen]?.evidenceIds ?? []
  );
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<
    "neutral" | "warm" | "cold"
  >("neutral");
  const [evidenceFilter, setEvidenceFilter] = useState("");
  const [dossierCard, setDossierCard] = useState<BoardCard | null>(null);

  const statement =
    visibleStatements.find((candidate) => candidate.id === statementId) ??
    visibleStatements[0];
  const retained = state.caseAnswers[statement.id];
  const solved = Boolean(retained?.solvedAt);
  const attachedEvidenceIds = displayedEvidenceIds(
    solved,
    retained?.evidenceIds,
    evidenceIds
  );
  const lockedSlots = retained?.lockedSlots ?? [];
  const effectiveSlots = { ...(retained?.slots ?? {}), ...slotSelections };
  const selectedSlot =
    statement.slots.find((slot) => slot.key === activeSlot) ??
    statement.slots.find((slot) => !lockedSlots.includes(slot.key)) ??
    statement.slots[0];
  const candidates = selectedSlot
    ? collectedTokensOfType(selectedSlot.type, state.collectedTokens)
    : [];

  const evidenceCards = useMemo(
    () =>
      discoveredEvidenceIds
        .map((id) => EVIDENCE_CARDS[id])
        .filter(Boolean)
        .map((card) => ({
          ...card,
          ...localizedBoardCard(card.id, card, locale),
        })),
    [discoveredEvidenceIds, locale]
  );
  const cards = [
    ...PERSON_CARDS.map((card) => ({
      ...card,
      ...localizedBoardCard(card.id, card, locale),
    })),
    ...evidenceCards,
  ];
  const normalizedFilter = evidenceFilter.trim().toLowerCase();
  const filteredCards = cards.filter(
    (card) =>
      !normalizedFilter ||
      card.title.toLowerCase().includes(normalizedFilter) ||
      card.summary.toLowerCase().includes(normalizedFilter)
  );
  const groupedCards = CATEGORY_ORDER.map((category) => ({
    category,
    cards: filteredCards.filter((card) => card.category === category),
  })).filter((group) => group.cards.length > 0);

  const categoryLabel = (category: BoardCategory): string => {
    if (category === "person") return t("people");
    if (category === "photo") return t("images");
    if (category === "document") return t("documentsCategory");
    if (category === "audio") return t("audio");
    if (category === "email") return t("mail");
    if (category === "conversation") return t("chats");
    return t("webRecords");
  };

  const selectStatement = (id: CaseQuestionId) => {
    const saved = state.caseAnswers[id];
    setStatementId(id);
    setSlotSelections(saved?.slots ?? {});
    setEvidenceIds(saved?.evidenceIds ?? []);
    setActiveSlot(null);
    setFeedback("");
    setFeedbackTone("neutral");
    setEvidenceFilter("");
  };

  const chooseToken = (tokenId: string) => {
    if (!selectedSlot || lockedSlots.includes(selectedSlot.key) || solved) return;
    setSlotSelections((current) => ({
      ...current,
      [selectedSlot.key]: tokenId,
    }));
    const next = statement.slots.find(
      (slot) =>
        slot.key !== selectedSlot.key &&
        !lockedSlots.includes(slot.key) &&
        !effectiveSlots[slot.key]
    );
    setActiveSlot(next?.key ?? selectedSlot.key);
    setFeedback("");
  };

  const toggleEvidence = (id: string) => {
    if (solved) return;
    setEvidenceIds((current) =>
      current.includes(id)
        ? current.filter((candidate) => candidate !== id)
        : current.length < 5
          ? [...current, id]
          : [...current.slice(1), id]
    );
    setFeedback("");
  };

  const openRecord = (card: BoardCard) => {
    if (card.category === "person") {
      setDossierCard(card);
      return;
    }
    const file = files.find((candidate) => candidate.evidenceId === card.id);
    if (file) {
      const appType =
        file.kind === "image"
          ? "image"
          : file.kind === "audio"
            ? "audio"
            : "notepad";
      openWindow({
        id: `${appType}-${file.id}`,
        appType,
        title: file.name,
        props: { fileId: file.id },
      });
      return;
    }
    if (emails.some((candidate) => candidate.evidenceId === card.id)) {
      openWindow({ id: "inbox", appType: "email", title: "Outlook Express" });
      return;
    }
    if (card.category === "conversation") {
      openWindow({
        id: "msn-messenger",
        appType: "messenger",
        title: "MSN Messenger",
      });
      return;
    }
    const address = RECORD_PAGE_ADDRESS[card.id];
    openWindow({
      id: "internet-explorer",
      appType: "browser",
      title: "Internet Explorer",
      props: address ? { initialAddress: address } : undefined,
    });
  };

  const renderStatement = () => {
    const template = localized(statement.template, locale);
    const parts = template.split(/(\{\w+\})/g);
    return parts.map((part, index) => {
      const match = part.match(/^\{(\w+)\}$/);
      if (!match) return <React.Fragment key={index}>{part}</React.Fragment>;
      const key = match[1];
      const token = effectiveSlots[key]
        ? TOKENS_BY_ID[effectiveSlots[key]]
        : undefined;
      const locked = lockedSlots.includes(key);
      return (
        <button
          type="button"
          key={key}
          className={`case-reconstruction__slot ${
            activeSlot === key ? "active" : ""
          } ${locked ? "locked" : ""}`}
          disabled={locked || solved}
          onClick={() => setActiveSlot(key)}
        >
          {token
            ? localized(token.label, locale)
            : locale === "pt-BR"
              ? `[${statement.slots.find((slot) => slot.key === key)?.type}]`
              : `[${statement.slots.find((slot) => slot.key === key)?.type}]`}
        </button>
      );
    });
  };

  const submit = () => {
    const missing = statement.slots.some(
      (slot) => !effectiveSlots[slot.key] && !lockedSlots.includes(slot.key)
    );
    if (missing) {
      setFeedback(
        locale === "pt-BR"
          ? "A frase ainda tem lacunas. Extraia fatos dos registros e preencha cada uma."
          : "The finding still has blanks. Extract facts from records and fill each one."
      );
      setFeedbackTone("cold");
      play("error");
      return;
    }
    const result = dispatchGameEvent({
      type: "SUBMIT_CASE_ANSWER",
      questionId: statement.id,
      slotSelections: effectiveSlots,
      evidenceIds,
    });
    const outcome = result.caseAnswerResult;
    const newlyLocked = outcome?.lockedSlots ?? [];
    setSlotSelections((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => newlyLocked.includes(key))
      )
    );
    if (outcome?.accepted) {
      setFeedback(
        locale === "pt-BR"
          ? "A frase permanece inteira. Alguma coisa respondeu atrás desta janela."
          : "The sentence holds. Something answered behind this window."
      );
      setFeedbackTone("warm");
      play("chime");
      return;
    }
    const messages: Record<string, { en: string; pt: string }> = {
      partial_lock: {
        en: "Part of the finding holds. The gold words stay; the rest slips out of the record.",
        pt: "Parte do achado se sustenta. As palavras douradas ficam; o restante escapa do registro.",
      },
      slots_rejected: {
        en: "Cold. None of those words agrees with the attached records.",
        pt: "Frio. Nenhuma dessas palavras concorda com os registros anexados.",
      },
      not_enough_evidence: {
        en: "The words may fit, but one record is only a clue. Corroborate them.",
        pt: "As palavras podem servir, mas um registro é só uma pista. Corrobore-as.",
      },
      missing_required_evidence: {
        en: "The finding lacks its primary record. Search the source, not its echo.",
        pt: "Falta o registro primário. Procure a fonte, não o eco.",
      },
    };
    const copy = messages[outcome?.reason ?? "slots_rejected"];
    setFeedback(locale === "pt-BR" ? copy.pt : copy.en);
    setFeedbackTone(outcome?.reason === "partial_lock" ? "warm" : "cold");
    play(outcome?.reason === "partial_lock" ? "click" : "error");
  };

  const retainedCount = CASE_STATEMENTS.filter(
    (candidate) => state.caseAnswers[candidate.id]?.solvedAt
  ).length;

  return (
    <div className="arg-tool case-reconstruction">
      <div className="arg-tool__menubar">
        <span>Case</span><span>Evidence</span><span>View</span><span>Help</span>
      </div>
      <div className="case-reconstruction__header">
        <div>
          <p>MISKATONIC INCIDENT REVIEW / SB-0316</p>
          <h2>{locale === "pt-BR" ? "Reconstrução do Caso" : "Case Reconstruction"}</h2>
        </div>
        <button
          className="button case-reconstruction__timeline-link"
          onClick={() =>
            openWindow({
              id: "case-timeline",
              appType: "timeline",
              title: locale === "pt-BR" ? "Linha do Tempo" : "Case Timeline",
            })
          }
        >
          {locale === "pt-BR" ? "Abrir linha do tempo" : "Open timeline"}
        </button>
      </div>

      <div className="case-reconstruction__layout">
        <nav className="case-reconstruction__questions">
          <strong>{locale === "pt-BR" ? "Achados" : "Findings"}</strong>
          {visibleStatements.map((candidate) => {
            const saved = state.caseAnswers[candidate.id];
            const locked = saved?.lockedSlots.length ?? 0;
            return (
              <button
                key={candidate.id}
                className={`button ${
                  candidate.id === statement.id ? "active" : ""
                } ${saved?.solvedAt ? "retained" : ""}`}
                onClick={() => selectStatement(candidate.id)}
              >
                <i>{saved?.solvedAt ? "✓" : `${locked}/${candidate.slots.length}`}</i>
                <span>{localized(candidate.context, locale)}</span>
              </button>
            );
          })}
        </nav>

        <main className="case-reconstruction__workspace">
          <header>
            <small>
              {locale === "pt-BR"
                ? `ATO ${statement.act} / ACHADO EM MONTAGEM`
                : `ACT ${statement.act} / FINDING IN PROGRESS`}
            </small>
            <h3 className="case-reconstruction__statement">{renderStatement()}</h3>
            <p>
              {locale === "pt-BR"
                ? "Clique numa lacuna e escolha apenas fatos que você extraiu dos registros."
                : "Select a blank, then use only facts you extracted from the records."}
            </p>
          </header>

          <section className="case-reconstruction__token-bank">
            <div>
              <strong>{locale === "pt-BR" ? "Banco de fatos" : "Fact bank"}</strong>
              <small>
                {selectedSlot
                  ? `${
                      locale === "pt-BR" ? "LACUNA" : "BLANK"
                    }: ${selectedSlot.key.toUpperCase()}`
                  : ""}
              </small>
            </div>
            <div className="case-reconstruction__tokens">
              {candidates.map((token) => (
                <button
                  type="button"
                  className={`button ${
                    effectiveSlots[selectedSlot?.key ?? ""] === token.id
                      ? "selected"
                      : ""
                  }`}
                  key={token.id}
                  disabled={solved || Boolean(selectedSlot && lockedSlots.includes(selectedSlot.key))}
                  onClick={() => chooseToken(token.id)}
                >
                  {localized(token.label, locale)}
                </button>
              ))}
              {candidates.length === 0 && (
                <p>
                  {locale === "pt-BR"
                    ? "Nenhum fato desse tipo foi extraído. Abra documentos e clique em trechos significativos."
                    : "No fact of this type has been extracted. Open records and click significant phrases."}
                </p>
              )}
            </div>
          </section>

          <section className="case-reconstruction__evidence">
            <div className="case-reconstruction__evidence-heading">
              <strong>{locale === "pt-BR" ? "Registros anexados" : "Attached records"}</strong>
              <span className="case-reconstruction__evidence-count">
                {attachedEvidenceIds.length}/5
              </span>
            </div>
            <input
              type="search"
              className="case-reconstruction__evidence-search"
              value={evidenceFilter}
              disabled={solved}
              onChange={(event) => setEvidenceFilter(event.target.value)}
              placeholder={
                locale === "pt-BR"
                  ? "Filtrar os registros descobertos…"
                  : "Filter discovered records…"
              }
            />
            <div className="case-reconstruction__evidence-groups">
              {groupedCards.map((group) => (
                <div className="case-reconstruction__evidence-group" key={group.category}>
                  <h4>{categoryLabel(group.category)}</h4>
                  <div className="case-reconstruction__evidence-grid">
                    {group.cards.map((card) => {
                      const selected = attachedEvidenceIds.includes(card.id);
                      return (
                        <div
                          className={`case-reconstruction__evidence-card ${
                            selected ? "selected" : ""
                          }`}
                          key={card.id}
                        >
                          <button
                            type="button"
                            className="case-reconstruction__evidence-toggle"
                            title={card.summary}
                            aria-pressed={selected}
                            onClick={() => toggleEvidence(card.id)}
                            disabled={solved}
                          >
                            <span className="case-reconstruction__evidence-check">
                              {selected ? "✔" : ""}
                            </span>
                            <span className="case-reconstruction__evidence-body">
                              <strong>{card.title}</strong>
                              <small>{card.summary}</small>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="case-reconstruction__evidence-view"
                            onClick={() => openRecord(card)}
                            title={locale === "pt-BR" ? "Abrir registro" : "Open record"}
                          >
                            {card.category === "person" ? "▣" : "◉"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer>
            <button
              className="button case-reconstruction__file"
              disabled={solved}
              onClick={submit}
            >
              {solved
                ? locale === "pt-BR" ? "ACHADO RETIDO" : "FINDING RETAINED"
                : locale === "pt-BR" ? "Testar achado" : "Test finding"}
            </button>
            {feedback && (
              <p className={`case-reconstruction__feedback ${feedbackTone}`}>
                {feedback}
              </p>
            )}
          </footer>
        </main>
      </div>

      <div className="arg-tool__status">
        <span>
          {retainedCount} / {CASE_STATEMENTS.length}{" "}
          {locale === "pt-BR" ? "achados retidos" : "findings retained"}
        </span>
        <span>
          {state.collectedTokens.length}{" "}
          {locale === "pt-BR" ? "fatos extraídos" : "facts extracted"}
        </span>
      </div>

      {dossierCard && (
        <div
          className="case-reconstruction__dossier-overlay"
          onClick={() => setDossierCard(null)}
        >
          <div
            className="case-reconstruction__dossier"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <strong>{locale === "pt-BR" ? "Ficha pessoal" : "Personal file"}</strong>
              <button
                type="button"
                className="case-reconstruction__dossier-close"
                onClick={() => setDossierCard(null)}
              >
                ✕
              </button>
            </header>
            <h3>{dossierCard.title}</h3>
            <p>{dossierCard.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseReconstruction;
