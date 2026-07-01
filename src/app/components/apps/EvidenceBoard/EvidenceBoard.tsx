"use client";

import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
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
    moveBoardCard,
    toggleBoardConnection,
    resetBoardLayout,
  } = useProgress();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | BoardCategory>("all");
  const [query, setQuery] = useState("");
  const [dragPreview, setDragPreview] = useState<
    { id: string; x: number; y: number } | null
  >(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const evidenceCards = useMemo(
    () =>
      discoveredEvidenceIds
        .map((id) => EVIDENCE_CARDS[id])
        .filter((card): card is BoardCard => Boolean(card)),
    [discoveredEvidenceIds]
  );

  const allPositioned: PositionedCard[] = useMemo(() => {
    const people = PERSON_CARDS.map((card) => ({
      card,
      position: boardPositions[card.id] ?? PERSON_POSITIONS[card.id],
    }));
    const evidence = evidenceCards.map((card, index) => ({
      card,
      position: boardPositions[card.id] ?? defaultEvidencePosition(index),
    }));
    return [...people, ...evidence];
  }, [boardPositions, evidenceCards]);

  const normalizedQuery = query.trim().toLowerCase();
  const positioned = useMemo(
    () =>
      allPositioned.filter(({ card }) => {
        const matchesCategory =
          filter === "all" || card.category === filter;
        const matchesQuery =
          !normalizedQuery ||
          card.title.toLowerCase().includes(normalizedQuery) ||
          card.summary.toLowerCase().includes(normalizedQuery);
        return matchesCategory && matchesQuery;
      }),
    [allPositioned, filter, normalizedQuery]
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
    setSelectedId((previous) => {
      if (!previous) return cardId;
      if (previous === cardId) return null;
      toggleBoardConnection(previous, cardId);
      return null;
    });
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
        <span>File</span>
        <span>View</span>
        <span>Connections</span>
        <span>Help</span>
      </div>

      <div className="evidence-board__toolbar">
        <label>
          Find
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="name, file or clue"
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
              {CATEGORY_META[category].label}{" "}
              <small>{categoryCounts[category]}</small>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="button evidence-board__reset"
          disabled={Object.keys(boardPositions).length === 0}
          onClick={() => {
            resetBoardLayout();
            setSelectedId(null);
          }}
        >
          Reset layout
        </button>
      </div>

      <div className="evidence-board__workspace">
        <div className="evidence-board__scroll">
          <div
            ref={canvasRef}
            className="evidence-board__canvas"
            style={{ width: BOARD_WIDTH, height: canvasHeight }}
          >
            <div className="evidence-board__zone evidence-board__zone--people">
              PEOPLE / ANCHORS
            </div>
            <div className="evidence-board__zone evidence-board__zone--evidence">
              DISCOVERED EVIDENCE
            </div>

            <svg
              className="evidence-board__strings"
              width={BOARD_WIDTH}
              height={canvasHeight}
              aria-hidden="true"
            >
              {boardConnections.map((key) => {
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
                return (
                  <g key={key}>
                    <line
                      x1={from.x + CARD_WIDTH / 2}
                      y1={from.y + CARD_HEIGHT / 2}
                      x2={to.x + CARD_WIDTH / 2}
                      y2={to.y + CARD_HEIGHT / 2}
                      className="evidence-board__string-shadow"
                    />
                    <line
                      x1={from.x + CARD_WIDTH / 2}
                      y1={from.y + CARD_HEIGHT / 2}
                      x2={to.x + CARD_WIDTH / 2}
                      y2={to.y + CARD_HEIGHT / 2}
                      className="evidence-board__string"
                    />
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
                  }`}
                  style={{ left: position.x, top: position.y }}
                  onMouseDown={(event) => startDrag(event, card.id)}
                  aria-label={`${card.title}. ${card.summary}`}
                  title="Click to select a connection endpoint; drag to move"
                >
                  <span className="evidence-card__pin" aria-hidden="true" />
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
                      <small>{meta.label}</small>
                      <strong>{card.title}</strong>
                    </span>
                  </span>
                  <p>{card.summary}</p>
                </button>
              );
            })}

            {positioned.length === 0 && (
              <div className="evidence-board__empty">
                No discovered evidence matches this view.
              </div>
            )}
          </div>
        </div>

        <aside className="evidence-board__inspector">
          <p className="arg-tool__kicker">CONNECTION DESK</p>
          {selectedCard ? (
            <div className="evidence-board__selection">
              <span>FIRST ENDPOINT SELECTED</span>
              <strong>{selectedCard.title}</strong>
              <p>{selectedCard.summary}</p>
              <em>Choose a second card to add or remove a red thread.</em>
              <button
                type="button"
                className="button"
                onClick={() => setSelectedId(null)}
              >
                Cancel link
              </button>
            </div>
          ) : (
            <div className="evidence-board__instructions">
              <strong>Build your own theory.</strong>
              <ol>
                <li>Click one card.</li>
                <li>Click a second card.</li>
                <li>A red thread records the connection.</li>
              </ol>
              <p>Drag cards into groups. New evidence is pinned automatically.</p>
            </div>
          )}

          <div className="evidence-board__connection-list">
            <header>
              <strong>Recorded threads</strong>
              <span>{boardConnections.length}</span>
            </header>
            {boardConnections.length === 0 ? (
              <p>No theory has been recorded yet.</p>
            ) : (
              boardConnections.map((key) => {
                const [fromId, toId] = key.split("|");
                const from = cardsById[fromId];
                const to = cardsById[toId];
                if (!from || !to) return null;
                return (
                  <div key={key}>
                    <span>{from.title}</span>
                    <i>↔</i>
                    <span>{to.title}</span>
                    <button
                      type="button"
                      aria-label={`Remove connection between ${from.title} and ${to.title}`}
                      onClick={() => toggleBoardConnection(fromId, toId)}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="evidence-board__legend">
            {(Object.keys(CATEGORY_META) as BoardCategory[]).map((category) => (
              <span key={category}>
                <i className={`legend-${category}`} />
                {CATEGORY_META[category].label}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <div className="arg-tool__status">
        <span>
          Showing {positioned.length} of {allPositioned.length} pinned cards
        </span>
        <span>
          {selectedCard
            ? "Choose another card to complete the thread"
            : "Click to link · drag to rearrange"}
        </span>
      </div>
    </div>
  );
};

export default EvidenceBoard;
