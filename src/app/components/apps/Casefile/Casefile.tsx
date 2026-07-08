"use client";

import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { useSound } from "@/app/context/SoundContext";
import {
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
import { files } from "@/app/data/filesystem";
import { emails } from "@/app/data/emails";
import { PAGE_ADDRESS } from "@/app/components/apps/RecoveredBrowser/RecoveredBrowser";
import { useI18n } from "@/app/i18n";
import {
  CASE_STATEMENTS,
  HYPOTHESES,
  INSIGHT_LABELS,
  TOKENS_BY_ID,
  collectedTokensOfType,
  localized,
} from "@/app/game/campaign";
import {
  CASEFILE_TIMELINE_EVENTS,
  CasefileClaimId,
  CasefileLens,
  HYPOTHESIS_EVIDENCE_REQUIREMENTS,
  claimIdForFinding,
  collectedTokensForEvidence,
  findingIdFromClaim,
} from "@/app/game/casefile";
import { displayedEvidenceIds } from "@/app/game/caseReconstruction";
import {
  CaseQuestionId,
  HypothesisId,
  InsightId,
} from "@/app/game/progress";
import "../ArgTools/style.scss";
import "../EvidenceBoard/style.scss";
import "../CaseReconstruction/style.scss";
import "./style.scss";

type CasefileCategory =
  | BoardCategory
  | "finding"
  | "correlation"
  | "hypothesis"
  | "event";

interface CasefileCard extends Omit<BoardCard, "category"> {
  category: CasefileCategory;
  claimId?: CasefileClaimId;
  sourceId?: CaseQuestionId | InsightId | HypothesisId;
}

interface PositionedCard {
  card: CasefileCard;
  position: { x: number; y: number };
}

const CATEGORY_META: Record<
  CasefileCategory,
  { en: string; pt: string; short: string }
> = {
  person: { en: "People", pt: "Pessoas", short: "ID" },
  photo: { en: "Images", pt: "Imagens", short: "IMG" },
  document: { en: "Documents", pt: "Documentos", short: "TXT" },
  audio: { en: "Audio", pt: "Áudio", short: "WAV" },
  email: { en: "Mail", pt: "E-mail", short: "MAIL" },
  conversation: { en: "Chats", pt: "Conversas", short: "MSN" },
  record: { en: "Web records", pt: "Registros web", short: "WEB" },
  finding: { en: "Findings", pt: "Achados", short: "FND" },
  correlation: { en: "Correlations", pt: "Correlações", short: "RET" },
  hypothesis: { en: "Contradictions", pt: "Contradições", short: "HYP" },
  event: { en: "Timeline", pt: "Linha do tempo", short: "TIME" },
};

const LENS_LABELS: Record<CasefileLens, { en: string; pt: string }> = {
  reconstruct: { en: "Findings", pt: "Achados" },
  organize: { en: "Correlations", pt: "Correlações" },
  timeline: { en: "Chronology", pt: "Cronologia" },
  contradictions: { en: "Refute", pt: "Refutar" },
};

const DRAG_THRESHOLD = 4;
const CASEFILE_BOARD_WIDTH = 1680;
const FINDING_LEFT = 856;
const CORRELATION_LEFT = 1088;
const HYPOTHESIS_LEFT = 1220;
const RECORD_PAGE_ADDRESS: Partial<Record<string, string>> = {
  catalogue_lot_114: PAGE_ADDRESS.lot,
  coastline_archive: PAGE_ADDRESS.coast,
  sarah_future_record: PAGE_ADDRESS.sarah,
  whitfield_memo: PAGE_ADDRESS.memo,
  tom_homepage: PAGE_ADDRESS.tom,
  danforth_cache: PAGE_ADDRESS.danforth,
  pabodie_archive: PAGE_ADDRESS.expedition,
};

const pairKey = (a: string, b: string): string => [a, b].sort().join("|");

const sagPath = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy) || 1;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const sag = Math.min(38, distance * 0.14);
  const normalX = -dy / distance;
  const normalY = dx / distance;
  return `M ${x1} ${y1} Q ${midX + normalX * sag} ${
    midY + normalY * sag
  } ${x2} ${y2}`;
};

const initials = (title: string) =>
  title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const defaultClaimPosition = (
  index: number,
  category: CasefileCategory
): { x: number; y: number } => {
  if (category === "correlation") {
    return { x: CORRELATION_LEFT, y: 212 + index * 156 };
  }
  if (category === "hypothesis") {
    return { x: HYPOTHESIS_LEFT, y: 48 + index * 156 };
  }
  return { x: FINDING_LEFT, y: 44 + index * 150 };
};

const isCorrelationCandidate = (card?: CasefileCard): boolean =>
  Boolean(
    card &&
      ["person", "photo", "document", "audio", "email", "conversation", "record"]
        .includes(card.category)
  );

const useVisibleStatements = () => {
  const { state } = useProgress();
  return CASE_STATEMENTS.filter(
    (statement) =>
      statement.act === 1 ||
      (statement.act === 2 && state.leadsUnlocked.includes(statement.leadId)) ||
      (statement.act === 3 &&
        (state.leadsUnlocked.includes("observer") ||
          Boolean(state.puzzles.future_log.solvedAt)))
  );
};

const Casefile = ({
  initialLens = "reconstruct",
}: {
  initialLens?: CasefileLens;
}) => {
  const {
    discoveredEvidenceIds,
    boardPositions,
    confirmedConnections,
    moveBoardCard,
    resetBoardLayout,
    testTheory,
    insightsUnlocked,
    caseNotes,
    setCaseNotes,
    state,
    dispatchGameEvent,
  } = useProgress();
  const { locale, t } = useI18n();
  const { openWindow } = useWindowManager();
  const { play } = useSound();
  const visibleStatements = useVisibleStatements();
  const firstOpen =
    visibleStatements.find(
      (statement) => !state.caseAnswers[statement.id]?.solvedAt
    )?.id ?? visibleStatements[0].id;

  const [lens, setLens] = useState<CasefileLens>(initialLens);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theoryIds, setTheoryIds] = useState<string[]>([]);
  const [theoryFeedback, setTheoryFeedback] = useState("");
  const [filter, setFilter] = useState<"all" | CasefileCategory>("all");
  const [showUnexplainedOnly, setShowUnexplainedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [dragPreview, setDragPreview] = useState<
    { id: string; x: number; y: number } | null
  >(null);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [statementId, setStatementId] =
    useState<CaseQuestionId>(firstOpen);
  const statement =
    visibleStatements.find((candidate) => candidate.id === statementId) ??
    visibleStatements[0];
  const retained = state.caseAnswers[statement.id];
  const solved = Boolean(retained?.solvedAt);
  const [slotSelections, setSlotSelections] = useState<Record<string, string>>(
    retained?.slots ?? {}
  );
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [evidenceIds, setEvidenceIds] = useState<string[]>(
    retained?.evidenceIds ?? []
  );
  const [caseFeedback, setCaseFeedback] = useState("");
  const [caseFeedbackTone, setCaseFeedbackTone] = useState<
    "neutral" | "warm" | "cold"
  >("neutral");
  const [evidenceFilter, setEvidenceFilter] = useState("");
  const [dossierCard, setDossierCard] = useState<CasefileCard | null>(null);
  const [timelineOrder, setTimelineOrder] = useState<string[]>([]);

  useEffect(() => {
    setLens(initialLens);
  }, [initialLens]);

  useEffect(() => {
    if (visibleStatements.some((candidate) => candidate.id === statementId)) {
      return;
    }
    setStatementId(firstOpen);
  }, [firstOpen, statementId, visibleStatements]);

  const activeClaimId = claimIdForFinding(statement.id);
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

  const localizeCard = useCallback(
    (card: BoardCard): BoardCard => ({
      ...card,
      ...localizedBoardCard(card.id, card, locale),
    }),
    [locale]
  );

  const categoryLabel = (category: CasefileCategory): string => {
    const meta = CATEGORY_META[category];
    return locale === "pt-BR" ? meta.pt : meta.en;
  };

  const evidenceCards = useMemo(
    () =>
      discoveredEvidenceIds
        .map((id) => EVIDENCE_CARDS[id])
        .filter((card): card is BoardCard => Boolean(card))
        .map(localizeCard),
    [discoveredEvidenceIds, localizeCard]
  );

  const findingCards = useMemo<CasefileCard[]>(
    () =>
      visibleStatements.map((candidate) => ({
        id: claimIdForFinding(candidate.id),
        title: localized(candidate.context, locale),
        summary: localized(candidate.template, locale),
        category: "finding",
        claimId: claimIdForFinding(candidate.id),
        sourceId: candidate.id,
      })),
    [locale, visibleStatements]
  );

  const correlationCards = useMemo<CasefileCard[]>(
    () =>
      insightsUnlocked.map((insightId) => ({
        id: `correlation:${insightId}`,
        title: localized(INSIGHT_LABELS[insightId], locale),
        summary:
          locale === "pt-BR"
            ? "Conclusão retida pelo arquivo. Pode sustentar leituras posteriores."
            : "A retained conclusion. It can support later readings.",
        category: "correlation",
        claimId: `correlation:${insightId}`,
        sourceId: insightId,
      })),
    [insightsUnlocked, locale]
  );

  const hypothesisCards = useMemo<CasefileCard[]>(
    () =>
      (Object.keys(HYPOTHESES) as HypothesisId[]).map((hypothesisId) => {
        const refuted = state.hypotheses[hypothesisId]?.status === "refuted";
        return {
          id: `hypothesis:${hypothesisId}`,
          title: localized(HYPOTHESES[hypothesisId].title, locale),
          summary: refuted
            ? localized(HYPOTHESES[hypothesisId].truth, locale)
            : locale === "pt-BR"
              ? "Hipótese em aberto. Encontre dois registros que a derrubem."
              : "Open hypothesis. Find two records that make it collapse.",
          category: "hypothesis",
          claimId: `hypothesis:${hypothesisId}`,
          sourceId: hypothesisId,
        };
      }),
    [locale, state.hypotheses]
  );

  const allPositioned: PositionedCard[] = useMemo(() => {
    const people = PERSON_CARDS.map((card) => ({
      card: localizeCard(card) as CasefileCard,
      position: boardPositions[card.id] ?? PERSON_POSITIONS[card.id],
    }));
    const evidence = evidenceCards.map((card, index) => ({
      card: card as CasefileCard,
      position: boardPositions[card.id] ?? defaultEvidencePosition(index),
    }));
    const findings = findingCards.map((card, index) => ({
      card,
      position:
        boardPositions[card.id] ?? defaultClaimPosition(index, "finding"),
    }));
    const correlations = correlationCards.map((card, index) => ({
      card,
      position:
        boardPositions[card.id] ?? defaultClaimPosition(index, "correlation"),
    }));
    const hypotheses =
      lens === "contradictions"
        ? hypothesisCards.map((card, index) => ({
            card,
            position:
              boardPositions[card.id] ??
              defaultClaimPosition(index, "hypothesis"),
          }))
        : [];
    return [...people, ...evidence, ...findings, ...correlations, ...hypotheses];
  }, [
    boardPositions,
    correlationCards,
    evidenceCards,
    findingCards,
    hypothesisCards,
    lens,
    localizeCard,
  ]);

  const normalizedQuery = query.trim().toLowerCase();
  const solvedFindingKeys = useMemo(
    () =>
      Object.entries(state.caseAnswers).flatMap(([id, answer]) =>
        answer?.solvedAt
          ? (answer.evidenceIds ?? []).map((evidenceId) =>
              pairKey(claimIdForFinding(id as CaseQuestionId), evidenceId)
            )
          : []
      ),
    [state.caseAnswers]
  );
  const pendingFindingKeys = useMemo(
    () =>
      lens === "reconstruct"
        ? attachedEvidenceIds.map((id) => pairKey(activeClaimId, id))
        : [],
    [activeClaimId, attachedEvidenceIds, lens]
  );
  const allConfirmedConnections = useMemo(
    () => Array.from(new Set([...confirmedConnections, ...solvedFindingKeys])),
    [confirmedConnections, solvedFindingKeys]
  );
  const explainedIds = useMemo(() => {
    const ids = new Set<string>();
    allConfirmedConnections.forEach((key) =>
      key.split("|").forEach((id) => ids.add(id))
    );
    return ids;
  }, [allConfirmedConnections]);
  const relevantEvidence = useMemo(() => {
    const relevant = new Set<string>([
      ...(statement.evidence.allOf ?? []),
      ...(statement.evidence.anyOf ?? []),
    ]);
    return relevant;
  }, [statement]);
  const timelineEvidence = useMemo(
    () =>
      new Set(
        CASEFILE_TIMELINE_EVENTS.filter((event) =>
          discoveredEvidenceIds.includes(event.evidenceId)
        ).map((event) => event.evidenceId)
      ),
    [discoveredEvidenceIds]
  );

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
        const matchesLens =
          lens !== "timeline" ||
          card.category === "event" ||
          card.category === "finding" ||
          card.category === "correlation" ||
          timelineEvidence.has(card.id) ||
          card.category === "person";
        return (
          matchesCategory &&
          matchesQuery &&
          matchesExplanation &&
          matchesLens
        );
      }),
    [
      allPositioned,
      explainedIds,
      filter,
      lens,
      normalizedQuery,
      showUnexplainedOnly,
      timelineEvidence,
    ]
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
      ) as Record<string, CasefileCard>,
    [allPositioned]
  );
  const visibleIds = useMemo(
    () => new Set(positioned.map(({ card }) => card.id)),
    [positioned]
  );
  const selectedCard = selectedId ? cardsById[selectedId] : undefined;
  const confirmedSet = useMemo(
    () => new Set(allConfirmedConnections),
    [allConfirmedConnections]
  );
  const confirmedCardIds = useMemo(() => {
    const ids = new Set<string>();
    allConfirmedConnections.forEach((key) =>
      key.split("|").forEach((id) => ids.add(id))
    );
    return ids;
  }, [allConfirmedConnections]);
  const activeEvidenceSet = useMemo(
    () => new Set(attachedEvidenceIds),
    [attachedEvidenceIds]
  );

  const allThreadKeys = useMemo(
    () =>
      Array.from(
        new Set([...allConfirmedConnections, ...pendingFindingKeys])
      ),
    [allConfirmedConnections, pendingFindingKeys]
  );
  const canvasHeight = Math.max(
    boardCanvasHeight(evidenceCards.length),
    1110,
    60 + visibleStatements.length * 156
  );

  const categoryCounts = useMemo(
    () =>
      allPositioned.reduce((counts, { card }) => {
        counts[card.category] = (counts[card.category] ?? 0) + 1;
        return counts;
      }, {} as Record<CasefileCategory, number>),
    [allPositioned]
  );

  const selectStatement = (id: CaseQuestionId) => {
    const saved = state.caseAnswers[id];
    setStatementId(id);
    setSlotSelections(saved?.slots ?? {});
    setEvidenceIds(saved?.evidenceIds ?? []);
    setActiveSlot(null);
    setCaseFeedback("");
    setCaseFeedbackTone("neutral");
    setEvidenceFilter("");
    setLens("reconstruct");
    setSelectedId(claimIdForFinding(id));
  };

  const addToCaseNotes = (key: string, text: string) => {
    const separator = caseNotes.trim() ? "\n" : "";
    setCaseNotes(`${caseNotes}${separator}- ${text}`);
    setJustAddedKey(key);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAddedKey(null), 1600);
  };

  const chooseToken = (tokenId: string, slotKey = selectedSlot?.key) => {
    const slot = statement.slots.find((candidate) => candidate.key === slotKey);
    const token = TOKENS_BY_ID[tokenId];
    if (!slot || !token || lockedSlots.includes(slot.key) || solved) return;
    if (token.type !== slot.type) {
      setCaseFeedback(
        locale === "pt-BR"
          ? "Esse fato pertence a outro tipo de lacuna."
          : "That fact belongs to a different kind of blank."
      );
      setCaseFeedbackTone("cold");
      play("error");
      return;
    }
    setSlotSelections((current) => ({
      ...current,
      [slot.key]: tokenId,
    }));
    const next = statement.slots.find(
      (candidate) =>
        candidate.key !== slot.key &&
        !lockedSlots.includes(candidate.key) &&
        !effectiveSlots[candidate.key]
    );
    setActiveSlot(next?.key ?? slot.key);
    setCaseFeedback("");
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
    setCaseFeedback("");
  };

  const openRecord = (card: CasefileCard) => {
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

  const submitFinding = () => {
    const missing = statement.slots.some(
      (slot) => !effectiveSlots[slot.key] && !lockedSlots.includes(slot.key)
    );
    if (missing) {
      setCaseFeedback(
        locale === "pt-BR"
          ? "A frase ainda tem lacunas. Extraia fatos dos registros e preencha cada uma."
          : "The finding still has blanks. Extract facts from records and fill each one."
      );
      setCaseFeedbackTone("cold");
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
      setCaseFeedback(
        locale === "pt-BR"
          ? "A frase permanece inteira. O arquivo respondeu atrás desta janela."
          : "The sentence holds. The archive answered behind this window."
      );
      setCaseFeedbackTone("warm");
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
    setCaseFeedback(locale === "pt-BR" ? copy.pt : copy.en);
    setCaseFeedbackTone(outcome?.reason === "partial_lock" ? "warm" : "cold");
    play(outcome?.reason === "partial_lock" ? "click" : "error");
  };

  const submitTheory = () => {
    if (theoryIds.length === 0) {
      setTheoryFeedback(t("theoryEmpty"));
      return;
    }
    const result = testTheory(theoryIds);
    const insightId = result.theoryResult?.insightId as InsightId | null;
    setTheoryFeedback(
      insightId ? localized(INSIGHT_LABELS[insightId], locale) : t("theoryFailed")
    );
    if (insightId && !result.theoryResult?.alreadyKnown) {
      play("chime");
    } else if (!insightId) {
      play("error");
    }
  };

  const refuteHypothesis = (hypothesisId: HypothesisId) => {
    const ids = HYPOTHESIS_EVIDENCE_REQUIREMENTS[hypothesisId];
    if (!ids.every((id) => discoveredEvidenceIds.includes(id))) {
      setTheoryFeedback(
        locale === "pt-BR"
          ? "Ainda faltam dois registros independentes para carimbar essa contradição."
          : "Two independent records are still required to stamp that contradiction."
      );
      play("error");
      return;
    }
    dispatchGameEvent({
      type: "SET_HYPOTHESIS",
      hypothesisId,
      status: "refuted",
      evidenceIds: ids,
    });
    setTheoryFeedback(localized(HYPOTHESES[hypothesisId].truth, locale));
    play("chime");
  };

  const handleCardClick = (cardId: string) => {
    const card = cardsById[cardId];
    const findingId = findingIdFromClaim(card?.claimId ?? ("" as CasefileClaimId));
    if (findingId) {
      selectStatement(findingId);
      return;
    }
    if (lens === "reconstruct" && card && card.category !== "correlation") {
      setSelectedId(cardId);
      toggleEvidence(cardId);
      return;
    }
    if (lens === "organize" && isCorrelationCandidate(card)) {
      setTheoryFeedback("");
      setTheoryIds((current) =>
        current.includes(cardId)
          ? current.filter((id) => id !== cardId)
          : current.length < 4
            ? [...current, cardId]
            : [...current.slice(1), cardId]
      );
      setSelectedId(cardId);
      return;
    }
    setSelectedId((previous) => (previous === cardId ? null : cardId));
  };

  const startDrag = (
    event: React.MouseEvent<HTMLElement>,
    cardId: string
  ) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest(".casefile-fact-chip")) return;
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
          CASEFILE_BOARD_WIDTH - CARD_WIDTH,
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
            CASEFILE_BOARD_WIDTH - CARD_WIDTH,
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
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const tokenId = event.dataTransfer.getData(
              "application/x-case-token"
            );
            if (tokenId) chooseToken(tokenId, key);
          }}
        >
          {token
            ? localized(token.label, locale)
            : `[${statement.slots.find((slot) => slot.key === key)?.type}]`}
        </button>
      );
    });
  };

  const renderFactChip = (tokenId: string, source = "bank") => {
    const token = TOKENS_BY_ID[tokenId];
    if (!token) return null;
    const compatible = selectedSlot?.type === token.type;
    return (
      <span
        key={`${source}-${token.id}`}
        className={`casefile-fact-chip ${
          compatible ? "casefile-fact-chip--ready" : ""
        }`}
        draggable={!solved}
        onClick={(event) => {
          event.stopPropagation();
          chooseToken(token.id);
        }}
        onDragStart={(event) => {
          event.dataTransfer.setData("application/x-case-token", token.id);
          event.dataTransfer.effectAllowed = "copy";
        }}
        title={
          locale === "pt-BR"
            ? `Fato extraído: ${token.type}`
            : `Extracted fact: ${token.type}`
        }
      >
        {localized(token.label, locale)}
      </span>
    );
  };

  const cardStatus = (card: CasefileCard): { label: string; tone: string } => {
    if (confirmedCardIds.has(card.id) || card.category === "correlation") {
      return {
        label: locale === "pt-BR" ? "retido" : "retained",
        tone: "retained",
      };
    }
    if (
      Object.values(state.caseAnswers).some((answer) =>
        answer?.evidenceIds?.includes(card.id)
      )
    ) {
      return { label: locale === "pt-BR" ? "usado" : "used", tone: "used" };
    }
    if (collectedTokensForEvidence(card.id, state.collectedTokens).length > 0) {
      return {
        label: locale === "pt-BR" ? "extraído" : "extracted",
        tone: "extracted",
      };
    }
    return { label: locale === "pt-BR" ? "registrado" : "filed", tone: "filed" };
  };

  const allCardsForLists = useMemo(
    () =>
      [
        ...PERSON_CARDS.map((card) => localizeCard(card) as CasefileCard),
        ...(evidenceCards as CasefileCard[]),
      ],
    [evidenceCards, localizeCard]
  );
  const normalizedEvidenceFilter = evidenceFilter.trim().toLowerCase();
  const filteredListCards = allCardsForLists.filter(
    (card) =>
      !normalizedEvidenceFilter ||
      card.title.toLowerCase().includes(normalizedEvidenceFilter) ||
      card.summary.toLowerCase().includes(normalizedEvidenceFilter)
  );

  const knownTimelineEvents = CASEFILE_TIMELINE_EVENTS.filter((event) =>
    discoveredEvidenceIds.includes(event.evidenceId)
  );
  const visibleTimelineOrder = [
    ...timelineOrder.filter((id) =>
      knownTimelineEvents.some((event) => event.id === id)
    ),
    ...knownTimelineEvents
      .filter((event) => !timelineOrder.includes(event.id))
      .map((event) => event.id),
  ];

  const moveTimelineEvent = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= visibleTimelineOrder.length) return;
    const next = [...visibleTimelineOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setTimelineOrder(next);
    setTheoryFeedback("");
  };

  const testTimeline = () => {
    const sorted = visibleTimelineOrder
      .map((id) => knownTimelineEvents.find((event) => event.id === id)!)
      .every(
        (event, index, values) =>
          index === 0 || values[index - 1].sort < event.sort
      );
    if (sorted && knownTimelineEvents.length >= 5) {
      dispatchGameEvent({
        type: "SEE_ASSET_VARIANT",
        variantId: "timeline-reconstructed",
      });
      setTheoryFeedback(
        locale === "pt-BR"
          ? "A cronologia permanece estável — exceto pelo último registro."
          : "The chronology holds — except for the final record."
      );
      play("chime");
    } else {
      setTheoryFeedback(
        locale === "pt-BR"
          ? "Uma ou mais evidências aparecem antes da causa que deveriam registrar."
          : "One or more records appear before the cause they should document."
      );
      play("error");
    }
  };

  const renderInspector = () => {
    if (lens === "reconstruct") {
      return (
        <div className="casefile-inspector__stack">
          <div className="casefile-claim-list">
            <strong>{locale === "pt-BR" ? "Achados" : "Findings"}</strong>
            {visibleStatements.map((candidate) => {
              const saved = state.caseAnswers[candidate.id];
              const locked = saved?.lockedSlots.length ?? 0;
              return (
                <button
                  key={candidate.id}
                  type="button"
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
          </div>

          <section className="casefile-reconstruction">
            <small>
              {locale === "pt-BR"
                ? `ATO ${statement.act} / ACHADO EM MONTAGEM`
                : `ACT ${statement.act} / FINDING IN PROGRESS`}
            </small>
            <h3 className="case-reconstruction__statement">{renderStatement()}</h3>
            <div className="casefile-fact-bank">
              <strong>{locale === "pt-BR" ? "Banco de fatos" : "Fact bank"}</strong>
              <div>
                {candidates.length > 0 ? (
                  candidates.map((token) => renderFactChip(token.id, "bank"))
                ) : (
                  <p>
                    {locale === "pt-BR"
                      ? "Nenhum fato desse tipo foi extraído ainda."
                      : "No fact of this type has been extracted yet."}
                  </p>
                )}
              </div>
            </div>
            <div className="casefile-attached">
              <header>
                <strong>
                  {locale === "pt-BR" ? "Registros anexados" : "Attached records"}
                </strong>
                <span>{attachedEvidenceIds.length}/5</span>
              </header>
              {attachedEvidenceIds.length === 0 ? (
                <p>
                  {locale === "pt-BR"
                    ? "Clique cartas no quadro para anexá-las ao achado."
                    : "Click board cards to attach them to the finding."}
                </p>
              ) : (
                attachedEvidenceIds.map((id) => (
                  <button
                    type="button"
                    className="casefile-attached__item"
                    key={id}
                    onClick={() => toggleEvidence(id)}
                    disabled={solved}
                  >
                    {cardsById[id]?.title ?? id}
                    <span>{solved ? "LOCK" : "×"}</span>
                  </button>
                ))
              )}
            </div>
            <button
              className="button casefile-submit"
              type="button"
              disabled={solved}
              onClick={submitFinding}
            >
              {solved
                ? locale === "pt-BR"
                  ? "ACHADO RETIDO"
                  : "FINDING RETAINED"
                : locale === "pt-BR"
                  ? "Testar achado"
                  : "Test finding"}
            </button>
            {caseFeedback && (
              <p className={`case-reconstruction__feedback ${caseFeedbackTone}`}>
                {caseFeedback}
              </p>
            )}
          </section>

          <section className="casefile-evidence-list">
            <input
              type="search"
              value={evidenceFilter}
              onChange={(event) => setEvidenceFilter(event.target.value)}
              placeholder={
                locale === "pt-BR"
                  ? "Filtrar registros descobertos..."
                  : "Filter discovered records..."
              }
            />
            {filteredListCards.map((card) => {
              const selected = activeEvidenceSet.has(card.id);
              const relevant = relevantEvidence.has(card.id);
              return (
                <div
                  className={`casefile-evidence-row ${
                    selected ? "selected" : ""
                  } ${relevant ? "relevant" : ""}`}
                  key={card.id}
                >
                  <button
                    type="button"
                    onClick={() => toggleEvidence(card.id)}
                    disabled={solved}
                  >
                    <strong>{card.title}</strong>
                    <small>{card.summary}</small>
                  </button>
                  <button
                    type="button"
                    title={locale === "pt-BR" ? "Abrir registro" : "Open record"}
                    onClick={() => openRecord(card)}
                  >
                    ◉
                  </button>
                </div>
              );
            })}
          </section>
        </div>
      );
    }

    if (lens === "timeline") {
      return (
        <div className="casefile-inspector__stack">
          <section className="casefile-timeline">
            <strong>SB-0316 / CHRONOLOGY</strong>
            <div className="casefile-timeline__ruler" aria-hidden="true">
              <span>1998</span>
              <i />
              <span>2014</span>
              <i />
              <span>2026</span>
              <i />
              <span>{locale === "pt-BR" ? "AMANHÃ" : "TOMORROW"}</span>
            </div>
            <ol>
              {visibleTimelineOrder.map((id, index) => {
                const event = knownTimelineEvents.find(
                  (candidate) => candidate.id === id
                )!;
                return (
                  <li key={id} className={event.date === "{TOMORROW}" ? "impossible" : ""}>
                    <div>
                      <button
                        className="button"
                        onClick={() => moveTimelineEvent(index, -1)}
                        disabled={index === 0}
                      >
                        ▲
                      </button>
                      <button
                        className="button"
                        onClick={() => moveTimelineEvent(index, 1)}
                        disabled={index === visibleTimelineOrder.length - 1}
                      >
                        ▼
                      </button>
                    </div>
                    <time>{event.date}</time>
                    <span>{localized(event.title, locale)}</span>
                    <small>{event.evidenceId}</small>
                  </li>
                );
              })}
            </ol>
            <button
              className="button casefile-submit"
              disabled={knownTimelineEvents.length < 5}
              onClick={testTimeline}
            >
              {locale === "pt-BR" ? "Testar cronologia" : "Test chronology"}
            </button>
            {theoryFeedback && <p>{theoryFeedback}</p>}
          </section>
        </div>
      );
    }

    if (lens === "contradictions") {
      return (
        <div className="casefile-inspector__stack">
          <section className="casefile-contradictions">
            <strong>
              {locale === "pt-BR"
                ? "Hipóteses concorrentes"
                : "Competing hypotheses"}
            </strong>
            {(Object.keys(HYPOTHESES) as HypothesisId[]).map((hypothesisId) => {
              const record = state.hypotheses[hypothesisId];
              const requiredIds = HYPOTHESIS_EVIDENCE_REQUIREMENTS[hypothesisId];
              const readyCount = requiredIds.filter((id) =>
                discoveredEvidenceIds.includes(id)
              ).length;
              const refuted = record?.status === "refuted";
              return (
                <article
                  key={hypothesisId}
                  className={refuted ? "refuted" : "locked"}
                >
                  <h4>{localized(HYPOTHESES[hypothesisId].title, locale)}</h4>
                  {refuted ? (
                    <p className="casefile-contradictions__explanation">
                      {localized(HYPOTHESES[hypothesisId].truth, locale)}
                    </p>
                  ) : (
                    <p>
                      {locale === "pt-BR"
                        ? "Encontre dois registros independentes para derrubar esta hipótese."
                        : "Find two independent records to collapse this hypothesis."}
                    </p>
                  )}
                  <div className="casefile-contradictions__progress">
                    <strong>
                      {readyCount}/{requiredIds.length}
                    </strong>
                    <span>
                      {locale === "pt-BR"
                        ? "registros encontrados"
                        : "records found"}
                    </span>
                  </div>
                  <div className="casefile-contradictions__slots">
                    {requiredIds.map((id) => (
                      <span
                        key={id}
                        className={
                          discoveredEvidenceIds.includes(id) ? "ready" : ""
                        }
                      >
                        {cardsById[id]?.title ?? id}
                      </span>
                    ))}
                  </div>
                  <button
                    className="button"
                    disabled={refuted || readyCount < requiredIds.length}
                    onClick={() => refuteHypothesis(hypothesisId)}
                  >
                    {refuted
                      ? locale === "pt-BR"
                        ? "REFUTADA"
                        : "REFUTED"
                      : locale === "pt-BR"
                        ? "Refutar"
                        : "Refute"}
                  </button>
                </article>
              );
            })}
            {theoryFeedback && (
              <p className="evidence-board__theory-feedback">{theoryFeedback}</p>
            )}
          </section>
        </div>
      );
    }

    return (
      <div className="casefile-inspector__stack">
        <section className="evidence-board__theory">
          <span>
            {locale === "pt-BR" ? "Bandeja de correlação" : "Correlation tray"}
          </span>
          <strong>{t("theoryPrompt")}</strong>
          <p className="casefile-correlation-hint">
            {locale === "pt-BR"
              ? "Clique em pessoas e registros no quadro. Quando a relação fizer sentido, teste a correlação."
              : "Click people and records on the board. When the relation feels right, test the correlation."}
          </p>
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
          {selectedCard && (
            <div className="evidence-board__selection">
              <span>
                {locale === "pt-BR" ? "Carta selecionada" : "Selected card"}
              </span>
              <strong>{selectedCard.title}</strong>
              <p>{selectedCard.summary}</p>
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
            </div>
          )}
          {theoryFeedback && (
            <p className="evidence-board__theory-feedback">{theoryFeedback}</p>
          )}
        </section>

        {insightsUnlocked.length > 0 && (
          <section className="evidence-board__insights">
            <strong>RETAINED CORRELATIONS</strong>
            {insightsUnlocked.map((insightId) => (
              <div className="evidence-board__insight-row" key={insightId}>
                <p>{localized(INSIGHT_LABELS[insightId], locale)}</p>
                <button
                  type="button"
                  className="button evidence-board__add-note"
                  onClick={() =>
                    addToCaseNotes(
                      insightId,
                      localized(INSIGHT_LABELS[insightId], locale)
                    )
                  }
                >
                  {justAddedKey === insightId
                    ? t("addedConfirmation")
                    : t("addToCaseNotes")}
                </button>
              </div>
            ))}
          </section>
        )}

        <div className="evidence-board__connection-list">
          <header>
            <strong>
              {locale === "pt-BR" ? "Relações no quadro" : "Board relations"}
            </strong>
            <span>{allThreadKeys.length}</span>
          </header>
          {allThreadKeys.length === 0 ? (
            <p>
              {locale === "pt-BR"
                ? "Teste correlações ou aceite achados para gerar fios úteis."
                : "Test correlations or accept findings to create useful threads."}
            </p>
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
                  className={confirmed ? "evidence-board__thread--confirmed" : ""}
                >
                  <span>{from.title}</span>
                  <i>{confirmed ? "✦" : "↔"}</i>
                  <span>{to.title}</span>
                  <span className="evidence-board__thread-confirmed-tag">
                    {confirmed
                      ? t("confirmedTag")
                      : locale === "pt-BR"
                        ? "anexo"
                        : "attached"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="arg-tool casefile evidence-board">
      <div className="arg-tool__menubar">
        <span>Casefile.exe</span>
        <span>{t("menuView")}</span>
        <span>{t("menuConnections")}</span>
        <span>{t("help")}</span>
      </div>

      <header className="casefile__header">
        <div>
          <p>MISKATONIC INCIDENT REVIEW / SB-0316</p>
          <h2>{locale === "pt-BR" ? "Dossiê do Caso" : "Casefile.exe"}</h2>
        </div>
        <div className="casefile__lenses" role="tablist">
          {(Object.keys(LENS_LABELS) as CasefileLens[]).map((candidate) => (
            <button
              type="button"
              key={candidate}
              className={lens === candidate ? "active" : ""}
              aria-pressed={lens === candidate}
              onClick={() => {
                setLens(candidate);
                setSelectedId(null);
                setTheoryFeedback("");
              }}
            >
              {locale === "pt-BR"
                ? LENS_LABELS[candidate].pt
                : LENS_LABELS[candidate].en}
            </button>
          ))}
        </div>
      </header>

      <div className="evidence-board__toolbar casefile__toolbar">
        <label>
          {t("find")}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("findPlaceholder")}
          />
        </label>
        <details className="casefile__tools">
          <summary>{locale === "pt-BR" ? "Opções" : "Options"}</summary>
          <label>
            {locale === "pt-BR" ? "Mostrar" : "Show"}
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "all" | CasefileCategory)
              }
            >
              <option value="all">
                {t("all")} ({allPositioned.length})
              </option>
              {(Object.keys(CATEGORY_META) as CasefileCategory[]).map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                    disabled={!categoryCounts[category]}
                  >
                    {categoryLabel(category)} ({categoryCounts[category] ?? 0})
                  </option>
                )
              )}
            </select>
          </label>
          <label className="casefile__checkbox">
            <input
              type="checkbox"
              checked={showUnexplainedOnly}
              onChange={(event) => setShowUnexplainedOnly(event.target.checked)}
            />
            {locale === "pt-BR" ? "Só sem explicação" : "Only unexplained"}
          </label>
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
        </details>
      </div>

      <div className="evidence-board__workspace casefile__workspace">
        <div className="evidence-board__scroll">
          <div
            ref={canvasRef}
            className="evidence-board__canvas casefile__canvas"
            style={{ width: CASEFILE_BOARD_WIDTH, height: canvasHeight }}
          >
            <div className="evidence-board__zone evidence-board__zone--people">
              {t("peopleAnchors")}
            </div>
            <div className="evidence-board__zone evidence-board__zone--evidence">
              {t("discoveredEvidenceZone")}
            </div>
            <div className="evidence-board__zone casefile__zone--claims">
              {locale === "pt-BR" ? "ACHADOS / RITUAL" : "FINDINGS / RITUAL"}
            </div>

            <svg
              className="evidence-board__strings"
              width={CASEFILE_BOARD_WIDTH}
              height={canvasHeight}
              aria-hidden="true"
            >
              {pendingFindingKeys
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

              {allConfirmedConnections.map((key) => {
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
                  <g key={key} className="evidence-board__confirmed-group">
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
              const status = cardStatus(card);
              const facts = collectedTokensForEvidence(
                card.id,
                state.collectedTokens
              );
              const relevant = relevantEvidence.has(card.id);
              const attached = activeEvidenceSet.has(card.id);
              return (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  className={`evidence-card evidence-card--${card.category} ${
                    selectedId === card.id ? "evidence-card--selected" : ""
                  } ${theoryIds.includes(card.id) ? "evidence-card--theory" : ""} ${
                    confirmedCardIds.has(card.id) ? "evidence-card--confirmed" : ""
                  } ${relevant ? "casefile-card--relevant" : ""} ${
                    attached ? "casefile-card--attached" : ""
                  } casefile-card--${status.tone}`}
                  style={{ left: position.x, top: position.y }}
                  onMouseDown={(event) => startDrag(event, card.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleCardClick(card.id);
                    }
                  }}
                  aria-label={`${card.title}. ${card.summary}`}
                  title={
                    lens === "reconstruct"
                      ? locale === "pt-BR"
                        ? "Clique para anexar ao achado ativo"
                        : "Click to attach to the active finding"
                      : lens === "organize"
                        ? locale === "pt-BR"
                          ? "Clique para adicionar ou remover da correlação"
                          : "Click to add or remove from the correlation"
                        : locale === "pt-BR"
                          ? "Clique para selecionar"
                          : "Click to select"
                  }
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
                        <Image src={card.preview} alt="" fill sizes="52px" />
                      </span>
                    ) : (
                      <span className="evidence-card__type" aria-hidden="true">
                        {card.category === "person" ? initials(card.title) : meta.short}
                      </span>
                    )}
                    <span>
                      <small>{categoryLabel(card.category)}</small>
                      <strong>{card.title}</strong>
                    </span>
                  </span>
                  <p>{card.summary}</p>
                  <div className="casefile-card__footer">
                    <span className={`casefile-status casefile-status--${status.tone}`}>
                      {status.label}
                    </span>
                    {card.category === "finding" && (
                      <span>
                        {state.caseAnswers[card.sourceId as CaseQuestionId]?.solvedAt
                          ? locale === "pt-BR"
                            ? "selado"
                            : "sealed"
                          : locale === "pt-BR"
                            ? "aberto"
                            : "open"}
                      </span>
                    )}
                  </div>
                  {facts.length > 0 && (
                    <div className="casefile-card__facts">
                      {facts.map((token) => renderFactChip(token.id, card.id))}
                    </div>
                  )}
                </div>
              );
            })}

            {positioned.length === 0 && (
              <div className="evidence-board__empty">{t("noEvidenceMatch")}</div>
            )}
          </div>
        </div>

        <aside className="evidence-board__inspector casefile__inspector">
          <p className="arg-tool__kicker">
            {lens === "organize"
              ? locale === "pt-BR"
                ? "CORRELAÇÕES"
                : "CORRELATIONS"
              : locale === "pt-BR"
                ? LENS_LABELS[lens].pt.toUpperCase()
                : LENS_LABELS[lens].en.toUpperCase()}
          </p>
          {renderInspector()}
        </aside>
      </div>

      <div className="arg-tool__status">
        <span>
          {locale === "pt-BR" ? "Lente" : "Lens"}:{" "}
          {locale === "pt-BR" ? LENS_LABELS[lens].pt : LENS_LABELS[lens].en}
        </span>
        <span>
          {Object.values(state.caseAnswers).filter((answer) => answer?.solvedAt).length} /{" "}
          {CASE_STATEMENTS.length}{" "}
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
                ×
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

export default Casefile;
