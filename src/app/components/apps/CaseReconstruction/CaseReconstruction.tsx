"use client";

import React, { useMemo, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import {
  CASE_QUESTIONS,
  localized,
} from "@/app/game/campaign";
import { CaseQuestionId } from "@/app/game/progress";
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

/** Record-only cards that live in the recovered web cache, not the filesystem. */
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
  const {
    state,
    discoveredEvidenceIds,
    dispatchGameEvent,
  } = useProgress();
  const { locale, t } = useI18n();
  const { play } = useSound();
  const { openWindow } = useWindowManager();
  const visibleQuestions = CASE_QUESTIONS.filter(
    (question) =>
      question.act === 1 ||
      state.leadsUnlocked.includes("observer") ||
      Boolean(state.puzzles.future_log.solvedAt)
  );
  const firstUnsolved =
    visibleQuestions.find((question) => !state.caseAnswers[question.id])?.id ??
    visibleQuestions[0].id;
  const [questionId, setQuestionId] =
    useState<CaseQuestionId>(firstUnsolved);
  const [answerId, setAnswerId] = useState("");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [evidenceFilter, setEvidenceFilter] = useState("");
  const [dossierCard, setDossierCard] = useState<BoardCard | null>(null);

  const question =
    visibleQuestions.find((candidate) => candidate.id === questionId) ??
    visibleQuestions[0];
  const solved = state.caseAnswers[question.id];
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
  const people = PERSON_CARDS.map((card) => ({
    ...card,
    ...localizedBoardCard(card.id, card, locale),
  }));
  const cards = [...people, ...evidenceCards];
  const requiredIds = new Set(question.evidence.allOf ?? []);
  const relevantIds = new Set([
    ...(question.evidence.allOf ?? []),
    ...(question.evidence.anyOf ?? []),
  ]);
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

  const selectQuestion = (id: CaseQuestionId) => {
    setQuestionId(id);
    setAnswerId("");
    setEvidenceIds([]);
    setFeedback("");
    setEvidenceFilter("");
  };

  const toggleEvidence = (id: string) => {
    if (solved) return;
    setFeedback("");
    setEvidenceIds((current) =>
      current.includes(id)
        ? current.filter((candidate) => candidate !== id)
        : current.length < 5
          ? [...current, id]
          : [...current.slice(1), id]
    );
  };

  const openRecord = (card: BoardCard) => {
    if (card.category === "person") {
      setDossierCard(card);
      return;
    }
    const file = files.find((candidate) => candidate.evidenceId === card.id);
    if (file) {
      const appType =
        file.kind === "image" ? "image" : file.kind === "audio" ? "audio" : "notepad";
      openWindow({
        id: `${appType}-${file.id}`,
        appType,
        title: file.name,
        props: { fileId: file.id },
      });
      return;
    }
    const email = emails.find((candidate) => candidate.evidenceId === card.id);
    if (email) {
      openWindow({ id: "inbox", appType: "email", title: "Outlook Express" });
      return;
    }
    if (card.category === "conversation") {
      openWindow({ id: "msn-messenger", appType: "messenger", title: "MSN Messenger" });
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

  const submit = () => {
    if (!answerId) {
      setFeedback(
        locale === "pt-BR"
          ? "Escolha uma conclusão antes de arquivar."
          : "Choose a conclusion before filing it."
      );
      play("error");
      return;
    }
    const result = dispatchGameEvent({
      type: "SUBMIT_CASE_ANSWER",
      questionId: question.id,
      answerId,
      evidenceIds,
    });
    const outcome = result.caseAnswerResult;
    if (outcome?.accepted) {
      setFeedback(
        locale === "pt-BR"
          ? "As evidências permanecem juntas. A workstation reage em algum lugar atrás desta janela."
          : "The evidence holds together. The workstation reacts somewhere behind this window."
      );
      play("chime");
      return;
    }
    const messages: Record<string, { en: string; pt: string }> = {
      wrong_conclusion: {
        en: "That conclusion contradicts at least one attached record.",
        pt: "Essa conclusão contradiz pelo menos um registro anexado.",
      },
      not_enough_evidence: {
        en: "One record is a clue. The archive requires corroboration.",
        pt: "Um registro é uma pista. O arquivo exige confirmação.",
      },
      missing_required_evidence: {
        en: "The conclusion may be plausible, but its primary record is missing.",
        pt: "A conclusão pode ser plausível, mas falta o registro principal.",
      },
    };
    const copy = messages[outcome?.reason ?? "wrong_conclusion"];
    setFeedback(locale === "pt-BR" ? copy.pt : copy.en);
    play("error");
  };

  return (
    <div className="arg-tool case-reconstruction">
      <div className="arg-tool__menubar">
        <span>Case</span><span>Evidence</span><span>View</span><span>Help</span>
      </div>
      <div className="case-reconstruction__header">
        <div>
          <p>MISKATONIC INCIDENT REVIEW / SB-0316</p>
          <h2>
            {locale === "pt-BR"
              ? "Reconstrução do Caso"
              : "Case Reconstruction"}
          </h2>
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
          <strong>{locale === "pt-BR" ? "Questões do caso" : "Case questions"}</strong>
          {visibleQuestions.map((candidate, index) => {
            const retained = state.caseAnswers[candidate.id];
            return (
              <button
                key={candidate.id}
                className={`button ${
                  candidate.id === question.id ? "active" : ""
                } ${retained ? "retained" : ""}`}
                onClick={() => selectQuestion(candidate.id)}
              >
                <i>{retained ? "✓" : String(index + 1).padStart(2, "0")}</i>
                <span>{localized(candidate.prompt, locale)}</span>
              </button>
            );
          })}
        </nav>

        <main className="case-reconstruction__workspace">
          <header>
            <small>
              {question.act === 1
                ? locale === "pt-BR" ? "ATO I / A PESSOA" : "ACT I / THE PERSON"
                : locale === "pt-BR" ? "ATO III / O OBSERVADOR" : "ACT III / THE OBSERVER"}
            </small>
            <h3>{localized(question.prompt, locale)}</h3>
            <p>{localized(question.context, locale)}</p>
          </header>

          <section className="case-reconstruction__conclusions">
            <strong>{locale === "pt-BR" ? "Conclusão" : "Conclusion"}</strong>
            {question.options.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name={`answer-${question.id}`}
                  value={option.id}
                  checked={
                    solved
                      ? solved.answerId === option.id
                      : answerId === option.id
                  }
                  disabled={Boolean(solved)}
                  onChange={() => setAnswerId(option.id)}
                />
                <span>{localized(option.label, locale)}</span>
              </label>
            ))}
          </section>

          <section className="case-reconstruction__evidence">
            <div className="case-reconstruction__evidence-heading">
              <strong>{locale === "pt-BR" ? "Evidências anexadas" : "Attached evidence"}</strong>
              <span className="case-reconstruction__evidence-count">
                {(solved?.evidenceIds ?? evidenceIds).length}/5
              </span>
            </div>
            {!solved && (
              <p className="case-reconstruction__evidence-hint">
                {locale === "pt-BR"
                  ? "Marcado com ★ = registro que essa conclusão exige. Os demais só corroboram."
                  : "Marked with ★ = the record this conclusion requires. Everything else only corroborates."}
              </p>
            )}
            <input
              type="search"
              className="case-reconstruction__evidence-search"
              value={evidenceFilter}
              disabled={Boolean(solved)}
              onChange={(event) => setEvidenceFilter(event.target.value)}
              placeholder={
                locale === "pt-BR"
                  ? "Filtrar por nome ou palavra-chave…"
                  : "Filter by name or keyword…"
              }
            />
            <div className="case-reconstruction__evidence-groups">
              {groupedCards.length === 0 && (
                <p className="case-reconstruction__evidence-empty">
                  {locale === "pt-BR"
                    ? "Nenhum registro descoberto corresponde a esse filtro."
                    : "No discovered record matches that filter."}
                </p>
              )}
              {groupedCards.map((group) => (
                <div
                  className="case-reconstruction__evidence-group"
                  key={group.category}
                >
                  <h4>{categoryLabel(group.category)}</h4>
                  <div className="case-reconstruction__evidence-grid">
                    {group.cards.map((card) => {
                      const selected = (
                        solved?.evidenceIds ?? evidenceIds
                      ).includes(card.id);
                      const required = requiredIds.has(card.id);
                      const relevant = relevantIds.has(card.id);
                      return (
                        <div
                          className={`case-reconstruction__evidence-card ${
                            selected ? "selected" : ""
                          } ${
                            !solved && relevant ? "relevant" : ""
                          }`}
                          key={card.id}
                        >
                          <button
                            className="case-reconstruction__evidence-toggle"
                            title={card.summary}
                            onClick={() => toggleEvidence(card.id)}
                            disabled={Boolean(solved)}
                          >
                            <span className="case-reconstruction__evidence-check" aria-hidden="true">
                              {selected ? "✔" : ""}
                            </span>
                            <span className="case-reconstruction__evidence-body">
                              <strong>
                                {card.title}
                                {!solved && required && (
                                  <i className="case-reconstruction__evidence-required">★</i>
                                )}
                              </strong>
                              <small>{card.summary}</small>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="case-reconstruction__evidence-view"
                            title={
                              card.category === "person"
                                ? locale === "pt-BR"
                                  ? "Abrir ficha"
                                  : "Open dossier"
                                : locale === "pt-BR"
                                  ? "Ver registro novamente"
                                  : "View record again"
                            }
                            onClick={() => openRecord(card)}
                          >
                            {card.category === "person" ? "🗎" : "👁"}
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
              disabled={Boolean(solved)}
              onClick={submit}
            >
              {solved
                ? locale === "pt-BR" ? "CONCLUSÃO RETIDA" : "FINDING RETAINED"
                : locale === "pt-BR" ? "Testar reconstrução" : "Test reconstruction"}
            </button>
            {feedback && <p>{feedback}</p>}
          </footer>
        </main>
      </div>
      <div className="arg-tool__status">
        <span>
          {Object.keys(state.caseAnswers).length} / {CASE_QUESTIONS.length}{" "}
          {locale === "pt-BR" ? "conclusões retidas" : "findings retained"}
        </span>
        <span>ARCHIVE MODE / NO AUTOMATIC ASSUMPTIONS</span>
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
                aria-label={locale === "pt-BR" ? "Fechar" : "Close"}
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
