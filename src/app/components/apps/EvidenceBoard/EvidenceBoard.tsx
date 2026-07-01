"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { useSound } from "@/app/context/SoundContext";
import {
  BOARD_WIDTH,
  BoardCard,
  BoardCategory,
  CARD_HEIGHT,
  CARD_WIDTH,
  EVIDENCE_CARDS,
  PERSON_CARDS,
  PERSON_POSITIONS,
  boardCanvasHeight,
  defaultEvidencePosition,
} from "@/app/data/evidenceBoard";
import { localizedBoardCard } from "@/app/data/localizedNarrative";
import { InsightId } from "@/app/game/progress";
import {
  HYPOTHESES,
  INSIGHT_LABELS,
  localized,
} from "@/app/game/campaign";
import { useI18n } from "@/app/i18n";
import "./style.scss";

interface PositionedCard {
  card: BoardCard;
  position: { x: number; y: number };
}

const CATEGORY_META: Record<
  BoardCategory,
  { label: string; short: string }
> = {
  person: { label: "People", short: "ID" },
  photo: { label: "Images", short: "IMG" },
  document: { label: "Documents", short: "TXT" },
  audio: { label: "Audio", short: "WAV" },
  email: { label: "Mail", short: "MAIL" },
  conversation: { label: "Chats", short: "MSN" },
  record: { label: "Web records", short: "WEB" },
};

const DRAG_THRESHOLD = 4;
const HYPOTHESIS_REQUIREMENTS = {
  tom_forged_image: ["tom_last_message", "future_access_log"],
  sarah_fled: ["incident_report", "chat_em_archive"],
  innsmouth_theft: ["lot_114_order", "catalogue_lot_114"],
} as const;

/** A string pinned taut has a little weight to it — never a perfectly straight line. */
const sagPath = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy) || 1;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const sag = Math.min(38, distance * 0.14);
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const controlX = midX + normalX * sag;
  const controlY = midY + normalY * sag;
  return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
};

const initials = (title: string) =>
  title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const EvidenceBoard = () => {
  const {
    discoveredEvidenceIds,
    boardPositions,
    boardConnections,
    confirmedConnections,
    moveBoardCard,
    toggleBoardConnection,
    resetBoardLayout,
    testTheory,
    insightsUnlocked,
    caseNotes,
    setCaseNotes,
    state,
    dispatchGameEvent,
  } = useProgress();
  const { t, locale } = useI18n();
  const { openWindow } = useWindowManager();
  const { play } = useSound();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theoryMode, setTheoryMode] = useState(false);
  const [theoryIds, setTheoryIds] = useState<string[]>([]);
  const [theoryFeedback, setTheoryFeedback] = useState("");
  const [filter, setFilter] = useState<"all" | BoardCategory>("all");
  const [showUnexplainedOnly, setShowUnexplainedOnly] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dragPreview, setDragPreview] = useState<
    { id: string; x: number; y: number } | null
  >(null);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCaseNotes = () => {
    openWindow({ id: "case-notes", appType: "case-notes", title: t("caseNotesLabel") });
  };

  const addToCaseNotes = (key: string, text: string) => {
    const separator = caseNotes.trim() ? "\n" : "";
    setCaseNotes(`${caseNotes}${separator}- ${text}`);
    setJustAddedKey(key);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAddedKey(null), 1600);
  };
  const canvasRef = useRef<HTMLDivElement>(null);
  const categoryLabel = (category: BoardCategory): string => {
    if (category === "person") return t("people");
    if (category === "photo") return t("images");
    if (category === "document") return t("documentsCategory");
    if (category === "audio") return t("audio");
    if (category === "email") return t("mail");
    if (category === "conversation") return t("chats");
    return t("webRecords");
  };

  const localizeCard = (card: BoardCard): BoardCard => ({
    ...card,
    ...localizedBoardCard(card.id, card, locale),
  });

  const evidenceCards = useMemo(
    () =>
      discoveredEvidenceIds
        .map((id) => EVIDENCE_CARDS[id])
        .filter((card): card is BoardCard => Boolean(card))
        .map(localizeCard),
    [discoveredEvidenceIds, locale]
  );

  const allPositioned: PositionedCard[] = useMemo(() => {
    const people = PERSON_CARDS.map((card) => ({
      card: localizeCard(card),
      position: boardPositions[card.id] ?? PERSON_POSITIONS[card.id],
    }));
    const evidence = evidenceCards.map((card, index) => ({
      card,
      position: boardPositions[card.id] ?? defaultEvidencePosition(index),
    }));
    return [...people, ...evidence];
  }, [boardPositions, evidenceCards, locale]);

  const normalizedQuery = query.trim().toLowerCase();
  const explainedIds = useMemo(() => {
    const ids = new Set<string>();
    confirmedConnections.forEach((key) =>
      key.split("|").forEach((id) => ids.add(id))
    );
    return ids;
  }, [confirmedConnections]);
  const positioned = useMemo(
    () =>
      allPositioned.filter(({ card }) => {
        const matchesCategory =
          filter === "all" || card.category === filter;
        const matchesQuery =
          !normalizedQuery ||
          card.title.toLowerCase().includes(normalizedQuery) ||
          card.summary.toLowerCase().includes(normalizedQuery);
        const matchesExplanation =
          !showUnexplainedOnly || !explainedIds.has(card.id);
        return matchesCategory && matchesQuery && matchesExplanation;
      }),
    [allPositioned, explainedIds, filter, normalizedQuery, showUnexplainedOnly]
  );

  const positionsById = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    allPositioned.forEach(({ card, position }) => {
      map[card.id] =
        dragPreview?.id === card.id
          ? { x: dragPreview.x, y: dragPreview.y }
          : position;
    });
    return map;
  }, [allPositioned, dragPreview]);

  const cardsById = useMemo(
    () =>
      Object.fromEntries(
        allPositioned.map(({ card }) => [card.id, card])
      ) as Record<string, BoardCard>,
    [allPositioned]
  );
  const visibleIds = useMemo(
    () => new Set(positioned.map(({ card }) => card.id)),
    [positioned]
  );
  const selectedCard = selectedId ? cardsById[selectedId] : undefined;
  const confirmedSet = useMemo(
    () => new Set(confirmedConnections),
    [confirmedConnections]
  );
  const confirmedCardIds = useMemo(() => {
    const ids = new Set<string>();
    confirmedConnections.forEach((key) =>
      key.split("|").forEach((id) => ids.add(id))
    );
    return ids;
  }, [confirmedConnections]);
  const [justRevealed, setJustRevealed] = useState<Set<string>>(new Set());
  const previousConfirmedRef = useRef<Set<string>>(new Set(confirmedConnections));

  useEffect(() => {
    const previous = previousConfirmedRef.current;
    const fresh = confirmedConnections.filter((key) => !previous.has(key));
    previousConfirmedRef.current = new Set(confirmedConnections);
    if (fresh.length === 0) return;
    setJustRevealed(
      (current) => new Set([...Array.from(current), ...fresh])
    );
    const timer = setTimeout(() => {
      setJustRevealed((current) => {
        const next = new Set(current);
        fresh.forEach((key) => next.delete(key));
        return next;
      });
    }, 1400);
    return () => clearTimeout(timer);
  }, [confirmedConnections]);

  const allThreadKeys = useMemo(
    () =>
      Array.from(new Set([...confirmedConnections, ...boardConnections])),
    [confirmedConnections, boardConnections]
  );
  const canvasHeight = boardCanvasHeight(evidenceCards.length);
  const categoryCounts = useMemo(
    () =>
      allPositioned.reduce(
        (counts, { card }) => ({
          ...counts,
          [card.category]: counts[card.category] + 1,
        }),
        {
          person: 0,
          photo: 0,
          document: 0,
          audio: 0,
          email: 0,
          conversation: 0,
          record: 0,
        } as Record<BoardCategory, number>
      ),
    [allPositioned]
  );

  const handleCardClick = (cardId: string) => {
    if (theoryMode) {
      setTheoryFeedback("");
      setTheoryIds((current) =>
        current.includes(cardId)
          ? current.filter((id) => id !== cardId)
          : current.length < 4
            ? [...current, cardId]
            : [...current.slice(1), cardId]
      );
      return;
    }
    if (selectedId && selectedId !== cardId) {
      toggleBoardConnection(selectedId, cardId);
      setSelectedId(null);
      return;
    }
    setSelectedId((previous) => (previous === cardId ? null : cardId));
  };

  const insightMessage = (insightId: InsightId): string => {
    return localized(INSIGHT_LABELS[insightId], locale);
  };

  const submitTheory = () => {
    if (theoryIds.length === 0) {
      setTheoryFeedback(t("theoryEmpty"));
      return;
    }
    const result = testTheory(theoryIds);
    const insightId = result.theoryResult?.insightId as InsightId | null;
    setTheoryFeedback(
      insightId ? insightMessage(insightId) : t("theoryFailed")
    );
    if (insightId && !result.theoryResult?.alreadyKnown) {
      play("chime");
    }
  };

  const refuteHypothesis = (
    hypothesisId: keyof typeof HYPOTHESIS_REQUIREMENTS
  ) => {
    const evidenceIds = [...HYPOTHESIS_REQUIREMENTS[hypothesisId]];
    if (!evidenceIds.every((id) => discoveredEvidenceIds.includes(id))) {
      setTheoryFeedback(
        locale === "pt-BR"
          ? "Ainda faltam dois registros independentes para testar essa hipótese."
          : "Two independent records are still required to test that hypothesis."
      );
      play("error");
      return;
    }
    dispatchGameEvent({
      type: "SET_HYPOTHESIS",
      hypothesisId,
      status: "refuted",
      evidenceIds,
    });
    setTheoryFeedback(localized(HYPOTHESES[hypothesisId].truth, locale));
    play("chime");
  };

  const startDrag = (
    event: React.MouseEvent<HTMLButtonElement>,
    cardId: string
  ) => {
    if (event.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const startRect = canvas.getBoundingClientRect();
    const current = positionsById[cardId] ?? { x: 0, y: 0 };
    const offsetX = event.clientX - startRect.left - current.x;
    const offsetY = event.clientY - startRect.top - current.y;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;

    const handleMove = (moveEvent: MouseEvent) => {
      if (!moved) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
          return;
        }
        moved = true;
      }
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(
          BOARD_WIDTH - CARD_WIDTH,
          moveEvent.clientX - rect.left - offsetX
        )
      );
      const y = Math.max(0, moveEvent.clientY - rect.top - offsetY);
      setDragPreview({ id: cardId, x, y });
    };

    const handleUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      if (moved) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(
          0,
          Math.min(
            BOARD_WIDTH - CARD_WIDTH,
            upEvent.clientX - rect.left - offsetX
          )
        );
        const y = Math.max(0, upEvent.clientY - rect.top - offsetY);
        moveBoardCard(cardId, x, y);
        setDragPreview(null);
      } else {
        handleCardClick(cardId);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  return (
    <div className="arg-tool evidence-board">
      <div className="arg-tool__menubar">
        <span>{t("menuFile")}</span>
        <span>{t("menuView")}</span>
        <span>{t("menuConnections")}</span>
        <span>{t("help")}</span>
      </div>

      <div className="evidence-board__toolbar">
        <label>
          {t("find")}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("findPlaceholder")}
          />
        </label>
        <div className="evidence-board__filters" aria-label="Evidence filters">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All <small>{allPositioned.length}</small>
          </button>
          {(Object.keys(CATEGORY_META) as BoardCategory[]).map((category) => (
            <button
              type="button"
              key={category}
              className={filter === category ? "active" : ""}
              aria-pressed={filter === category}
              disabled={categoryCounts[category] === 0}
              onClick={() => setFilter(category)}
            >
              {categoryLabel(category)}{" "}
              <small>{categoryCounts[category]}</small>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`button ${showUnexplainedOnly ? "active" : ""}`}
          aria-pressed={showUnexplainedOnly}
          onClick={() => setShowUnexplainedOnly((value) => !value)}
        >
          {locale === "pt-BR" ? "Sem explicação" : "Unexplained"}
        </button>
        <button
          type="button"
          className={`button ${timelineOpen ? "active" : ""}`}
          aria-pressed={timelineOpen}
          onClick={() => setTimelineOpen((value) => !value)}
        >
          {locale === "pt-BR" ? "Linha do tempo" : "Timeline"}
        </button>
        <button
          type="button"
          className="button evidence-board__reset"
          disabled={Object.keys(boardPositions).length === 0}
          onClick={() => {
            resetBoardLayout();
            setSelectedId(null);
          }}
        >
          {t("resetLayout")}
        </button>
        <button
          type="button"
          className={`button evidence-board__mode ${
            theoryMode ? "active" : ""
          }`}
          onClick={() => {
            setTheoryMode((value) => !value);
            setSelectedId(null);
            setTheoryFeedback("");
          }}
        >
          {theoryMode ? t("linkMode") : t("theoryMode")}
        </button>
        <button
          type="button"
          className="button evidence-board__notes-link"
          onClick={openCaseNotes}
        >
          <Image src="/icons/notepad.png" alt="" width={16} height={16} />
          {t("caseNotesLabel")}
        </button>
      </div>

      <div className="evidence-board__workspace">
        {timelineOpen && (
          <div className="evidence-board__timeline-strip">
            {[
              ["1998-09-03", "Miriam / accession"],
              ["1998-09-14", "Miriam / missing"],
              ["2026-03-16", "Sarah / missing"],
              ["2026-03-23", "Tom / relay image"],
              ["{TOMORROW}", state.playerName || "NEXT USER"],
            ].map(([date, label]) => (
              <div key={`${date}-${label}`}>
                <time>{date}</time>
                <span>{label}</span>
              </div>
            ))}
            <button
              className="button"
              onClick={() =>
                openWindow({
                  id: "case-timeline",
                  appType: "timeline",
                  title:
                    locale === "pt-BR" ? "Linha do Tempo" : "Case Timeline",
                })
              }
            >
              {locale === "pt-BR" ? "Organizar eventos…" : "Arrange events…"}
            </button>
          </div>
        )}
        <div className="evidence-board__scroll">
          <div
            ref={canvasRef}
            className="evidence-board__canvas"
            style={{ width: BOARD_WIDTH, height: canvasHeight }}
          >
            <div className="evidence-board__zone evidence-board__zone--people">
              {t("peopleAnchors")}
            </div>
            <div className="evidence-board__zone evidence-board__zone--evidence">
              {t("discoveredEvidenceZone")}
            </div>

            <svg
              className="evidence-board__strings"
              width={BOARD_WIDTH}
              height={canvasHeight}
              aria-hidden="true"
            >
              {boardConnections
                .filter((key) => !confirmedSet.has(key))
                .map((key) => {
                  const [fromId, toId] = key.split("|");
                  const from = positionsById[fromId];
                  const to = positionsById[toId];
                  if (
                    !from ||
                    !to ||
                    !visibleIds.has(fromId) ||
                    !visibleIds.has(toId)
                  ) {
                    return null;
                  }
                  const x1 = from.x + CARD_WIDTH / 2;
                  const y1 = from.y + CARD_HEIGHT / 2;
                  const x2 = to.x + CARD_WIDTH / 2;
                  const y2 = to.y + CARD_HEIGHT / 2;
                  const d = sagPath(x1, y1, x2, y2);
                  return (
                    <g key={key}>
                      <path d={d} className="evidence-board__string-shadow" />
                      <path d={d} className="evidence-board__string" />
                    </g>
                  );
                })}

              {confirmedConnections.map((key) => {
                const [fromId, toId] = key.split("|");
                const from = positionsById[fromId];
                const to = positionsById[toId];
                if (
                  !from ||
                  !to ||
                  !visibleIds.has(fromId) ||
                  !visibleIds.has(toId)
                ) {
                  return null;
                }
                const x1 = from.x + CARD_WIDTH / 2;
                const y1 = from.y + CARD_HEIGHT / 2;
                const x2 = to.x + CARD_WIDTH / 2;
                const y2 = to.y + CARD_HEIGHT / 2;
                const d = sagPath(x1, y1, x2, y2);
                const revealing = justRevealed.has(key);
                return (
                  <g
                    key={key}
                    className={`evidence-board__confirmed-group ${
                      revealing ? "evidence-board__confirmed-group--reveal" : ""
                    }`}
                  >
                    <path d={d} className="evidence-board__string-shadow" />
                    <path d={d} className="evidence-board__string evidence-board__string--confirmed">
                      <title>{t("confirmedCorrelation")}</title>
                    </path>
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      r={5}
                      className="evidence-board__confirmed-seal"
                    >
                      <title>{t("confirmedCorrelation")}</title>
                    </circle>
                  </g>
                );
              })}
            </svg>

            {positioned.map(({ card }) => {
              const position = positionsById[card.id];
              const meta = CATEGORY_META[card.category];
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`evidence-card evidence-card--${card.category} ${
                    selectedId === card.id ? "evidence-card--selected" : ""
                  } ${
                    theoryIds.includes(card.id)
                      ? "evidence-card--theory"
                      : ""
                  } ${
                    confirmedCardIds.has(card.id)
                      ? "evidence-card--confirmed"
                      : ""
                  }`}
                  style={{ left: position.x, top: position.y }}
                  onMouseDown={(event) => startDrag(event, card.id)}
                  aria-label={`${card.title}. ${card.summary}`}
                  title={t("clickSelectEndpointHint")}
                >
                  <span className="evidence-card__pin" aria-hidden="true" />
                  {confirmedCardIds.has(card.id) && (
                    <span
                      className="evidence-card__seal"
                      aria-hidden="true"
                      title={t("confirmedCorrelation")}
                    />
                  )}
                  <span className="evidence-card__lead">
                    {card.preview ? (
                      <span className="evidence-card__preview">
                        <Image
                          src={card.preview}
                          alt=""
                          fill
                          sizes="52px"
                        />
                      </span>
                    ) : (
                      <span className="evidence-card__type" aria-hidden="true">
                        {card.category === "person"
                          ? initials(card.title)
                          : meta.short}
                      </span>
                    )}
                    <span>
                      <small>{categoryLabel(card.category)}</small>
                      <strong>{card.title}</strong>
                    </span>
                  </span>
                  <p>{card.summary}</p>
                </button>
              );
            })}

            {positioned.length === 0 && (
              <div className="evidence-board__empty">
                {t("noEvidenceMatch")}
              </div>
            )}
          </div>
        </div>

        <aside className="evidence-board__inspector">
          <p className="arg-tool__kicker">{t("connectionDesk")}</p>
          {theoryMode ? (
            <div className="evidence-board__theory">
              <span>{t("hypothesisTray")}</span>
              <strong>{t("theoryPrompt")}</strong>
              <div className="evidence-board__theory-cards">
                {theoryIds.length === 0 ? (
                  <em>—</em>
                ) : (
                  theoryIds.map((id) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() =>
                        setTheoryIds((current) =>
                          current.filter((item) => item !== id)
                        )
                      }
                    >
                      {cardsById[id]?.title ?? id} ×
                    </button>
                  ))
                )}
              </div>
              <div className="evidence-board__theory-actions">
                <button type="button" className="button" onClick={submitTheory}>
                  {t("testTheory")}
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={theoryIds.length === 0}
                  onClick={() => {
                    setTheoryIds([]);
                    setTheoryFeedback("");
                  }}
                >
                  {t("clearTheory")}
                </button>
              </div>
              {theoryFeedback && (
                <p className="evidence-board__theory-feedback">
                  {theoryFeedback}
                </p>
              )}
              {insightsUnlocked.length > 0 && (
                <div className="evidence-board__insights">
                  <strong>RECOVERED CORRELATIONS</strong>
                  {insightsUnlocked.map((insightId) => (
                    <div className="evidence-board__insight-row" key={insightId}>
                      <p>{insightMessage(insightId)}</p>
                      <button
                        type="button"
                        className="button evidence-board__add-note"
                        onClick={() =>
                          addToCaseNotes(insightId, insightMessage(insightId))
                        }
                      >
                        {justAddedKey === insightId
                          ? t("addedConfirmation")
                          : t("addToCaseNotes")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="evidence-board__hypotheses">
                <strong>
                  {locale === "pt-BR"
                    ? "HIPÓTESES CONCORRENTES"
                    : "COMPETING HYPOTHESES"}
                </strong>
                {(Object.keys(HYPOTHESES) as Array<keyof typeof HYPOTHESES>).map(
                  (hypothesisId) => {
                    const record = state.hypotheses[hypothesisId];
                    return (
                      <div key={hypothesisId}>
                        <span>{localized(HYPOTHESES[hypothesisId].title, locale)}</span>
                        <button
                          className="button"
                          disabled={record?.status === "refuted"}
                          onClick={() => refuteHypothesis(hypothesisId)}
                        >
                          {record?.status === "refuted"
                            ? locale === "pt-BR" ? "REFUTADA" : "REFUTED"
                            : locale === "pt-BR" ? "Testar" : "Test"}
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ) : selectedCard ? (
            <div className="evidence-board__selection">
              <span>{t("firstEndpointSelected")}</span>
              <strong>{selectedCard.title}</strong>
              <p>{selectedCard.summary}</p>
              <em>{t("chooseSecondCard")}</em>
              <button
                type="button"
                className="button evidence-board__add-note"
                onClick={() =>
                  addToCaseNotes(
                    selectedCard.id,
                    `${selectedCard.title}: ${selectedCard.summary}`
                  )
                }
              >
                {justAddedKey === selectedCard.id
                  ? t("addedConfirmation")
                  : t("addToCaseNotes")}
              </button>
              <button
                type="button"
                className="button"
                onClick={() => setSelectedId(null)}
              >
                {t("cancelLink")}
              </button>
            </div>
          ) : (
            <div className="evidence-board__instructions">
              <strong>{t("buildTheory")}</strong>
              <ol>
                <li>{t("instructionStep1")}</li>
                <li>{t("instructionStep2")}</li>
                <li>{t("instructionStep3")}</li>
              </ol>
              <p>{t("dragGroupsHint")}</p>
            </div>
          )}

          <div className="evidence-board__connection-list">
            <header>
              <strong>{t("recordedThreads")}</strong>
              <span>{allThreadKeys.length}</span>
            </header>
            {allThreadKeys.length === 0 ? (
              <p>{t("noTheory")}</p>
            ) : (
              allThreadKeys.map((key) => {
                const [fromId, toId] = key.split("|");
                const from = cardsById[fromId];
                const to = cardsById[toId];
                if (!from || !to) return null;
                const confirmed = confirmedSet.has(key);
                return (
                  <div
                    key={key}
                    className={
                      confirmed ? "evidence-board__thread--confirmed" : ""
                    }
                  >
                    <span>{from.title}</span>
                    <i>{confirmed ? "✦" : "↔"}</i>
                    <span>{to.title}</span>
                    {confirmed ? (
                      <span
                        className="evidence-board__thread-confirmed-tag"
                        title={t("confirmedCorrelation")}
                      >
                        {t("confirmedTag")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`${t("removeConnectionPrefix")} ${from.title} ${t("andWord")} ${to.title}`}
                        onClick={() => toggleBoardConnection(fromId, toId)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="evidence-board__legend">
            {(Object.keys(CATEGORY_META) as BoardCategory[]).map((category) => (
              <span key={category}>
                <i className={`legend-${category}`} />
                {categoryLabel(category)}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <div className="arg-tool__status">
        <span>
          {t("showingPrefix")} {positioned.length} {t("ofLabel")} {allPositioned.length} {t("pinnedCardsSuffix")}
        </span>
        <span>
          {theoryMode
            ? `${theoryIds.length}/4 ${t("cardsInTraySuffix")}`
            : selectedCard
              ? t("chooseAnotherCard")
              : t("clickToLinkHint")}
        </span>
      </div>
    </div>
  );
};

export default EvidenceBoard;
