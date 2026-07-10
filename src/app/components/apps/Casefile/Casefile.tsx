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
  BoardPosition,
  CARD_HEIGHT,
  CARD_WIDTH,
  CASEFILE_BOARD_WIDTH,
  CASEFILE_DECK_CARD_HEIGHT,
  CASEFILE_EVIDENCE_CATEGORY_ORDER,
  CASEFILE_EVIDENCE_GRID_LEFT,
  EVIDENCE_CARDS,
  PERSON_CARDS,
  PERSON_POSITIONS,
  casefileClaimPosition,
  casefileDeckPosition,
  casefileExpandedEvidencePosition,
  casefileEvidenceLayout,
} from "@/app/data/evidenceBoard";
import { localizedBoardCard } from "@/app/data/localizedNarrative";
import { files } from "@/app/data/filesystem";
import { emails } from "@/app/data/emails";
import { PAGE_ADDRESS } from "@/app/components/apps/RecoveredBrowser/RecoveredBrowser";
import { TranslationKey, useI18n } from "@/app/i18n";
import {
  CASE_STATEMENTS,
  HYPOTHESES,
  INSIGHT_LABELS,
  ObserverConclusionId,
  TOKENS_BY_ID,
  collectedTokensOfType,
  hypothesisVerdict,
  isObserverConclusionAvailable,
  localized,
} from "@/app/game/campaign";
import {
  CASEFILE_TIMELINE_EVENTS,
  CasefileClaimId,
  CasefileLens,
  HYPOTHESIS_EVIDENCE_REQUIREMENTS,
  TOKEN_TYPE_LABEL_KEYS,
  claimIdForFinding,
  collectedTokensForEvidence,
  evidenceUsageById,
  exclusiveEvidenceByClaim,
  findingIdFromClaim,
  retainedFindingsFromAnswers,
  sharedEvidenceIds,
} from "@/app/game/casefile";
import { displayedEvidenceIds } from "@/app/game/casefile";
import {
  CaseQuestionId,
  CHAPTER_IDS,
  ChapterId,
  HypothesisId,
  InsightId,
  TokenType,
  chapterIndex,
  type ProgressStateV5,
} from "@/app/game/progress";
import "../ArgTools/style.scss";
import "./evidence-board.scss";
import "./case-reconstruction.scss";
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
  position: BoardPosition;
}

const CATEGORY_META: Record<CasefileCategory, { short: string }> = {
  person: { short: "ID" },
  photo: { short: "IMG" },
  document: { short: "TXT" },
  audio: { short: "WAV" },
  email: { short: "MAIL" },
  conversation: { short: "MSN" },
  record: { short: "WEB" },
  finding: { short: "FND" },
  correlation: { short: "RET" },
  hypothesis: { short: "HYP" },
  event: { short: "TIME" },
};
const LENS_LABEL_KEYS: Record<CasefileLens, TranslationKey> = {
  reconstruct: "casefileLensReconstruct",
  organize: "casefileLensOrganize",
  timeline: "casefileLensTimeline",
  contradictions: "casefileLensContradictions",
};
const CHAPTER_TITLE_KEYS: Record<ChapterId, TranslationKey> = {
  chapter_1: "chapter1Title",
  chapter_2: "chapter2Title",
  chapter_3: "chapter3Title",
  chapter_4: "chapter4Title",
  chapter_5: "chapter5Title",
  chapter_6: "chapter6Title",
};
const LENS_MIN_CHAPTERS: Record<CasefileLens, ChapterId> = {
  reconstruct: "chapter_1",
  organize: "chapter_3",
  timeline: "chapter_4",
  contradictions: "chapter_4",
};
const HYPOTHESIS_MIN_CHAPTERS: Record<HypothesisId, ChapterId> = {
  innsmouth_theft: "chapter_4",
  sarah_fled: "chapter_4",
  tom_forged_image: "chapter_5",
  sarah_chose_observer: "chapter_5",
};
const EVIDENCE_CHAPTERS: Partial<Record<string, ChapterId>> = {
  "person-sarah": "chapter_1",
  "person-miriam": "chapter_1",
  "person-tom": "chapter_1",
  "person-em": "chapter_1",
  "person-david": "chapter_1",
  photo_sarah_office: "chapter_1",
  photo_miriam_sarah_1998: "chapter_1",
  photo_sarah_em_coast: "chapter_1",
  photo_sarah_tom_2024: "chapter_1",
  photo_bishop_birthday_2025: "chapter_1",
  diary: "chapter_1",
  todo: "chapter_1",
  calendar_0316: "chapter_1",
  // Elevated to an audio artifact gated well past chapter_1 (counting_audio +
  // the post_end_transcript set piece) — filed under chapter_4 to match.
  voicemail_to_em: "chapter_4",
  reasons_to_stop: "chapter_1",
  unsent_to_dad: "chapter_1",
  lot_114_order: "chapter_2",
  catalogue_lot_114: "chapter_2",
  miriam_1998: "chapter_2",
  miriam_letter_1998: "chapter_2",
  whateley_accession_card: "chapter_2",
  desk_inventory: "chapter_2",
  miriam_notebook: "chapter_3",
  printer_alignment: "chapter_3",
  directory_comparison: "chapter_3",
  observer_directory: "chapter_3",
  em_draft_reply: "chapter_3",
  lineage_1977: "chapter_3",
  incident_report: "chapter_3",
  maintenance_record: "chapter_3",
  counting_audio: "chapter_4",
  hydrographic_chart: "chapter_4",
  lineage_pattern: "chapter_4",
  office_1998_overlay: "chapter_4",
  office_tomorrow_overlay: "chapter_4",
  three_times_alignment: "chapter_4",
  browser_history_0316: "chapter_4",
  future_access_log: "chapter_5",
  read_receipts: "chapter_5",
  tom_last_message: "chapter_5",
  hash_manifest: "chapter_5",
  split_record: "chapter_5",
  field_04: "chapter_5",
  do_not_catalogue: "chapter_5",
  silent_call: "chapter_5",
  counter_index_note: "chapter_5",
  the_name: "chapter_5",
  index_help: "chapter_6",
  blank_space: "chapter_6",
  archived_observer: "chapter_6",
};
const CATEGORY_LABEL_KEYS: Record<CasefileCategory, TranslationKey> = {
  person: "people",
  photo: "images",
  document: "documentsCategory",
  audio: "audio",
  email: "mail",
  conversation: "chats",
  record: "webRecords",
  finding: "casefileFindings",
  correlation: "casefileCorrelations",
  hypothesis: "casefileHypotheses",
  event: "casefileTimeline",
};
const LENS_HINT_KEYS: Record<CasefileLens, TranslationKey> = {
  reconstruct: "casefileAttachedRecordsHint",
  organize: "casefileCorrelationHint",
  timeline: "casefileNeedTimelineHint",
  contradictions: "casefileNeedTwoRecordsToRefute",
};
const HELP_LEGEND_CATEGORIES: BoardCategory[] = [
  "person",
  ...CASEFILE_EVIDENCE_CATEGORY_ORDER,
];
const HELP_DIALOG_TITLE_ID = "casefile-help-dialog-title";
const PERSONAL_FILE_DIALOG_TITLE_ID = "casefile-personal-file-dialog-title";
let lastVisitIds: { caseId: string; ids: Set<string> } | null = null;

const DRAG_THRESHOLD = 4;
const BOARD_ZOOM_MIN = 0.55;
const BOARD_ZOOM_MAX = 1.8;
const BOARD_ZOOM_STEP = 0.1;
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

const clampBoardZoom = (value: number) =>
  Math.min(
    BOARD_ZOOM_MAX,
    Math.max(BOARD_ZOOM_MIN, Math.round(value * 100) / 100)
  );

const isCorrelationCandidate = (card?: CasefileCard): boolean =>
  Boolean(
    card &&
      ["person", "photo", "document", "audio", "email", "conversation", "record"]
        .includes(card.category)
  );

const chapterAtLeast = (current: ChapterId, required: ChapterId): boolean =>
  chapterIndex(current) >= chapterIndex(required);

const visibleStatementsForChapter = (
  state: ProgressStateV5
): typeof CASE_STATEMENTS =>
  CASE_STATEMENTS.filter((statement) => {
    // Each observer conclusion surfaces at its own explicit milestone
    // (lineage, future_log, the_name) rather than a chapter-number gate.
    if (statement.act === 3) {
      return isObserverConclusionAvailable(
        state,
        statement.id as ObserverConclusionId
      );
    }
    return (
      statement.act === 1 ||
      state.leadsUnlocked.includes(statement.leadId)
    );
  });

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
    currentChapter,
  } = useProgress();
  const { locale, t } = useI18n();
  const { openWindow } = useWindowManager();
  const { play } = useSound();
  const visibleStatements = useMemo(
    () => visibleStatementsForChapter(state),
    [state]
  );
  const firstOpen =
    visibleStatements.find(
      (statement) => !state.caseAnswers[statement.id]?.solvedAt
    )?.id ?? visibleStatements[0].id;

  const [lens, setLens] = useState<CasefileLens>(initialLens);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theoryIds, setTheoryIds] = useState<string[]>([]);
  const [theoryFeedback, setTheoryFeedback] = useState("");
  const [filter, setFilter] = useState<"all" | CasefileCategory>("all");
  const [chapterFilter, setChapterFilter] = useState<"all" | ChapterId>("all");
  const [showUnexplainedOnly, setShowUnexplainedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [dragPreview, setDragPreview] = useState<
    { id: string; x: number; y: number } | null
  >(null);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [boardZoom, setBoardZoom] = useState(1);
  const [panningBoard, setPanningBoard] = useState(false);
  const [expandedDeckIds, setExpandedDeckIds] = useState<Set<CasefileClaimId>>(
    () => new Set()
  );

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
  const [helpLegendOpen, setHelpLegendOpen] = useState(false);
  const [coverMemoVisible, setCoverMemoVisible] = useState(true);
  const [showNewBadge, setShowNewBadge] = useState(true);
  const [freshBaseline] = useState<Set<string>>(
    () =>
      lastVisitIds?.caseId === state.caseId
        ? new Set(lastVisitIds.ids)
        : new Set(discoveredEvidenceIds)
  );
  const dossierDialogRef = useRef<HTMLDivElement>(null);
  const helpDialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const lensUnlocked = useCallback(
    (candidate: CasefileLens) =>
      chapterAtLeast(currentChapter, LENS_MIN_CHAPTERS[candidate]),
    [currentChapter]
  );

  useEffect(() => {
    setLens(lensUnlocked(initialLens) ? initialLens : "reconstruct");
  }, [initialLens, lensUnlocked]);

  useEffect(() => {
    if (lensUnlocked(lens)) return;
    setLens("reconstruct");
    setSelectedId(null);
    setTheoryFeedback("");
  }, [lens, lensUnlocked]);

  useEffect(() => {
    lastVisitIds = {
      caseId: state.caseId,
      ids: new Set(discoveredEvidenceIds),
    };
  }, [discoveredEvidenceIds, state.caseId]);

  useEffect(() => {
    if (visibleStatements.some((candidate) => candidate.id === statementId)) {
      return;
    }
    setStatementId(firstOpen);
  }, [firstOpen, statementId, visibleStatements]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowNewBadge(false);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimer.current) {
        clearTimeout(flashTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const handleBoardWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.deltaY === 0) return;
      event.preventDefault();
      event.stopPropagation();

      const rect = scroller.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const contentX = scroller.scrollLeft + pointerX;
      const contentY = scroller.scrollTop + pointerY;
      const direction = event.deltaY < 0 ? 1 : -1;

      setBoardZoom((current) => {
        const next = clampBoardZoom(current + direction * BOARD_ZOOM_STEP);
        if (next === current) return current;
        const ratio = next / current;
        requestAnimationFrame(() => {
          scroller.scrollLeft = Math.max(0, contentX * ratio - pointerX);
          scroller.scrollTop = Math.max(0, contentY * ratio - pointerY);
        });
        return next;
      });
    };

    scroller.addEventListener("wheel", handleBoardWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", handleBoardWheel);
  }, []);

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
    return t(CATEGORY_LABEL_KEYS[category]);
  };
  const lensTabId = (candidate: CasefileLens): string =>
    `casefile-lens-tab-${candidate}`;
  const lensPanelId = (candidate: CasefileLens): string =>
    `casefile-lens-panel-${candidate}`;
  const lensHintText = t(LENS_HINT_KEYS[lens]);

  const evidenceCards = useMemo(
    () =>
      discoveredEvidenceIds
        .map((id) => EVIDENCE_CARDS[id])
        .filter((card): card is BoardCard => Boolean(card))
        .map(localizeCard),
    [discoveredEvidenceIds, localizeCard]
  );

  const retainedFindings = useMemo(
    () => retainedFindingsFromAnswers(state.caseAnswers),
    [state.caseAnswers]
  );
  const retainedEvidenceUsage = useMemo(
    () => evidenceUsageById(retainedFindings),
    [retainedFindings]
  );
  const exclusiveEvidenceByFinding = useMemo(
    () => exclusiveEvidenceByClaim(retainedFindings, retainedEvidenceUsage),
    [retainedFindings, retainedEvidenceUsage]
  );
  const sharedRetainedEvidenceIds = useMemo(
    () => new Set(sharedEvidenceIds(retainedEvidenceUsage)),
    [retainedEvidenceUsage]
  );
  const exclusiveEvidenceOwnerById = useMemo(() => {
    const owners: Record<string, CasefileClaimId> = {};
    Object.entries(exclusiveEvidenceByFinding).forEach(([claimId, ids]) => {
      ids.forEach((id) => {
        owners[id] = claimId as CasefileClaimId;
      });
    });
    return owners;
  }, [exclusiveEvidenceByFinding]);
  const exclusiveEvidenceSet = useMemo(
    () => new Set(Object.keys(exclusiveEvidenceOwnerById)),
    [exclusiveEvidenceOwnerById]
  );
  const normalEvidenceCards = useMemo(
    () => evidenceCards.filter((card) => !exclusiveEvidenceSet.has(card.id)),
    [evidenceCards, exclusiveEvidenceSet]
  );

  const evidenceLayout = useMemo(
    () => casefileEvidenceLayout(normalEvidenceCards),
    [normalEvidenceCards]
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
    () => {
      if (!lensUnlocked("organize")) return [];
      return insightsUnlocked.map((insightId) => ({
        id: `correlation:${insightId}`,
        title: localized(INSIGHT_LABELS[insightId], locale),
        summary: t("casefileCorrelationSummary"),
        category: "correlation",
        claimId: `correlation:${insightId}`,
        sourceId: insightId,
      }));
    },
    [insightsUnlocked, lensUnlocked, locale, t]
  );

  const visibleHypothesisIds = useMemo(
    () =>
      (Object.keys(HYPOTHESES) as HypothesisId[]).filter(
        (hypothesisId) =>
          chapterAtLeast(
            currentChapter,
            HYPOTHESIS_MIN_CHAPTERS[hypothesisId]
          ) || state.hypotheses[hypothesisId]?.status === "refuted"
      ),
    [currentChapter, state.hypotheses]
  );

  const hypothesisCards = useMemo<CasefileCard[]>(
    () =>
      visibleHypothesisIds.map((hypothesisId) => {
        const refuted = state.hypotheses[hypothesisId]?.status === "refuted";
        return {
          id: `hypothesis:${hypothesisId}`,
          title: localized(HYPOTHESES[hypothesisId].title, locale),
          summary: refuted
            ? localized(HYPOTHESES[hypothesisId].truth, locale)
            : t("casefileNeedTwoRecordsToRefute"),
          category: "hypothesis",
          claimId: `hypothesis:${hypothesisId}`,
          sourceId: hypothesisId,
        };
      }),
    [locale, state.hypotheses, t, visibleHypothesisIds]
  );

  const allPositioned: PositionedCard[] = useMemo(() => {
    const people = PERSON_CARDS.map((card) => ({
      card: localizeCard(card) as CasefileCard,
      position: boardPositions[card.id] ?? PERSON_POSITIONS[card.id],
    }));
    const evidence = evidenceCards.map((card) => ({
      card: card as CasefileCard,
      position:
        boardPositions[card.id] ??
        evidenceLayout.positions[card.id] ?? { x: 0, y: evidenceLayout.bottom },
    }));
    const findings = findingCards.map((card, index) => ({
      card,
      position:
        boardPositions[card.id] ?? casefileClaimPosition(index, "finding"),
    }));
    const correlations = correlationCards.map((card, index) => ({
      card,
      position:
        boardPositions[card.id] ??
        casefileClaimPosition(index, "correlation"),
    }));
    const hypotheses =
      lens === "contradictions"
        ? hypothesisCards.map((card, index) => ({
            card,
            position:
              boardPositions[card.id] ??
              casefileClaimPosition(index, "hypothesis"),
          }))
        : [];
    return [...people, ...evidence, ...findings, ...correlations, ...hypotheses];
  }, [
    boardPositions,
    correlationCards,
    evidenceCards,
    evidenceLayout,
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

  const cardsById = useMemo(
    () =>
      Object.fromEntries(
        allPositioned.map(({ card }) => [card.id, card])
      ) as Record<string, CasefileCard>,
    [allPositioned]
  );

  const cardMatchesView = useCallback(
    (card: CasefileCard) => {
      const matchesCategory = filter === "all" || card.category === filter;
      const matchesChapter =
        chapterFilter === "all" || EVIDENCE_CHAPTERS[card.id] === chapterFilter;
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
        matchesChapter &&
        matchesQuery &&
        matchesExplanation &&
        matchesLens
      );
    },
    [
      explainedIds,
      chapterFilter,
      filter,
      lens,
      normalizedQuery,
      showUnexplainedOnly,
      timelineEvidence,
    ]
  );

  const retainedDecks = useMemo(
    () =>
      retainedFindings
        .map((finding) => {
          const findingCard = cardsById[finding.claimId];
          const evidence = (exclusiveEvidenceByFinding[finding.claimId] ?? [])
            .map((id) => cardsById[id])
            .filter((card): card is CasefileCard => Boolean(card));
          return findingCard && evidence.length > 0
            ? { id: finding.claimId, findingCard, evidence }
            : null;
        })
        .filter(
          (
            deck
          ): deck is {
            id: CasefileClaimId;
            findingCard: CasefileCard;
            evidence: CasefileCard[];
          } => Boolean(deck)
        ),
    [
      cardsById,
      exclusiveEvidenceByFinding,
      retainedFindings,
    ]
  );

  const deckEvidenceIds = useMemo(
    () => new Set(retainedDecks.flatMap((deck) => deck.evidence.map((card) => card.id))),
    [retainedDecks]
  );

  const filteringDecks = Boolean(normalizedQuery) || filter !== "all";
  const autoExpandedDeckIds = useMemo(
    () =>
      new Set(
        filteringDecks
          ? retainedDecks
              .filter((deck) => deck.evidence.some((card) => cardMatchesView(card)))
              .map((deck) => deck.id)
          : []
      ),
    [cardMatchesView, filteringDecks, retainedDecks]
  );

  const deckIsExpanded = useCallback(
    (deckId: CasefileClaimId) =>
      expandedDeckIds.has(deckId) || autoExpandedDeckIds.has(deckId),
    [autoExpandedDeckIds, expandedDeckIds]
  );

  const deckMatchesView = useCallback(
    (deck: { findingCard: CasefileCard; evidence: CasefileCard[] }) =>
      cardMatchesView(deck.findingCard) ||
      deck.evidence.some((card) => cardMatchesView(card)),
    [cardMatchesView]
  );

  const positioned = useMemo(
    () =>
      allPositioned.filter(({ card }) => {
        if (deckEvidenceIds.has(card.id)) return false;
        if (
          card.category === "finding" &&
          retainedDecks.some(
            (deck) => deck.id === card.id && deckMatchesView(deck)
          )
        ) {
          return true;
        }
        return cardMatchesView(card);
      }),
    [
      allPositioned,
      cardMatchesView,
      deckEvidenceIds,
      deckMatchesView,
      retainedDecks,
    ]
  );

  const basePositionsById = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    allPositioned.forEach(({ card, position }) => {
      map[card.id] =
        dragPreview?.id === card.id
          ? { x: dragPreview.x, y: dragPreview.y }
          : position;
    });
    return map;
  }, [allPositioned, dragPreview]);

  const visibleDecks = useMemo(
    () => retainedDecks.filter((deck) => deckMatchesView(deck)),
    [deckMatchesView, retainedDecks]
  );

  const deckPosition = useCallback(
    (deckId: CasefileClaimId) => {
      const finding = basePositionsById[deckId] ?? { x: 0, y: 0 };
      return casefileDeckPosition(finding);
    },
    [basePositionsById]
  );

  const deckCardPositionsById = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    visibleDecks.forEach((deck) => {
      if (!deckIsExpanded(deck.id)) return;
      const position = deckPosition(deck.id);
      deck.evidence.forEach((card, index) => {
        map[card.id] = casefileExpandedEvidencePosition(position, index);
      });
    });
    return map;
  }, [deckIsExpanded, deckPosition, visibleDecks]);

  const positionsById = useMemo(
    () => ({ ...basePositionsById, ...deckCardPositionsById }),
    [basePositionsById, deckCardPositionsById]
  );

  const cardLabelById = (id: string): string =>
    cardsById[id]?.title ?? t("casefileUnknownRecord");
  const freshIds = useMemo(() => {
    return new Set(discoveredEvidenceIds.filter((id) => !freshBaseline.has(id)));
  }, [discoveredEvidenceIds, freshBaseline]);
  const visibleIds = useMemo(
    () =>
      new Set([
        ...positioned.map(({ card }) => card.id),
        ...Object.keys(deckCardPositionsById),
      ]),
    [deckCardPositionsById, positioned]
  );
  const focusId = dragPreview?.id ?? hoverId ?? selectedId;
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
  const deckCanvasBottom = useMemo(
    () =>
      visibleDecks.reduce((max, deck) => {
        const position = deckPosition(deck.id);
        const deckBottom = position.y + CARD_HEIGHT;
        const evidenceBottom = deck.evidence.reduce((evidenceMax, card) => {
          const cardPosition = deckCardPositionsById[card.id];
          return cardPosition
            ? Math.max(
                evidenceMax,
                cardPosition.y + CASEFILE_DECK_CARD_HEIGHT + 40
              )
            : evidenceMax;
        }, 0);
        return Math.max(max, deckBottom, evidenceBottom);
      }, 0),
    [deckCardPositionsById, deckPosition, visibleDecks]
  );
  const canvasHeight = Math.max(
    1110,
    deckCanvasBottom,
    allPositioned.reduce(
      (max, { position }) => Math.max(max, position.y + CARD_HEIGHT + 40),
      0
    )
  );
  const scaledCanvasWidth = Math.ceil(CASEFILE_BOARD_WIDTH * boardZoom);
  const scaledCanvasHeight = Math.ceil(canvasHeight * boardZoom);

  const categoryCounts = useMemo(
    () =>
      allPositioned.reduce((counts, { card }) => {
        counts[card.category] = (counts[card.category] ?? 0) + 1;
        return counts;
      }, {} as Record<CasefileCategory, number>),
    [allPositioned]
  );
  const chapterOptions = useMemo(
    () => CHAPTER_IDS.slice(0, CHAPTER_IDS.indexOf(currentChapter) + 1),
    [currentChapter]
  );
  const solvedFindingsVisible = useMemo(
    () =>
      visibleStatements.filter((statement) => state.caseAnswers[statement.id]?.solvedAt)
        .length,
    [state.caseAnswers, visibleStatements]
  );
  const showCoverMemo =
    coverMemoVisible &&
    state.collectedTokens.length === 0 &&
    Object.keys(state.caseAnswers).length === 0;

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

  const closeDialogs = () => {
    setDossierCard(null);
    setHelpLegendOpen(false);
    if (returnFocusRef.current) {
      returnFocusRef.current.focus();
    }
  };

  const openDossierDialog = (card: CasefileCard) => {
    setDossierCard(card);
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      dossierDialogRef.current?.focus();
    });
  };

  const openHelpLegend = () => {
    setHelpLegendOpen(true);
    setShowNewBadge(false);
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      helpDialogRef.current?.focus();
    });
  };

  const chooseToken = (tokenId: string, slotKey = selectedSlot?.key) => {
    const slot = statement.slots.find((candidate) => candidate.key === slotKey);
    const token = TOKENS_BY_ID[tokenId];
    if (!slot || !token || lockedSlots.includes(slot.key) || solved) return;
    if (token.type !== slot.type) {
      setCaseFeedback(t("casefileTokenMismatch"));
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
      openDossierDialog(card);
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

  const locateOnBoard = (cardId: string) => {
    const deck = retainedDecks.find((candidate) =>
      candidate.evidence.some((card) => card.id === cardId)
    );
    if (deck) {
      setExpandedDeckIds((current) => new Set(current).add(deck.id));
    }
    if (!visibleIds.has(cardId)) {
      setQuery("");
      setFilter("all");
      setShowUnexplainedOnly(false);
    }
    setSelectedId(cardId);
    const deckEvidenceIndex =
      deck?.evidence.findIndex((card) => card.id === cardId) ?? -1;
    const target =
      deck && deckEvidenceIndex >= 0
        ? casefileExpandedEvidencePosition(deckPosition(deck.id), deckEvidenceIndex)
        : positionsById[cardId];
    const scroller = scrollRef.current;
    if (target && scroller) {
      scroller.scrollTo({
        left: Math.max(
          0,
          (target.x + CARD_WIDTH / 2) * boardZoom - scroller.clientWidth / 2
        ),
        top: Math.max(
          0,
          (target.y + CARD_HEIGHT / 2) * boardZoom - scroller.clientHeight / 2
        ),
        behavior: "smooth",
      });
    }
    setFlashId(cardId);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1400);
  };

  const submitFinding = () => {
    const missing = statement.slots.some(
      (slot) => !effectiveSlots[slot.key] && !lockedSlots.includes(slot.key)
    );
    if (missing) {
      setCaseFeedback(t("casefileFactHasBlanks"));
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
      setCaseFeedback(t("casefileFindingHeld"));
      setCaseFeedbackTone("warm");
      play("chime");
      return;
    }
    const messages: Record<string, TranslationKey> = {
      partial_lock: "casefilePartialLock",
      slots_rejected: "casefileSlotsRejected",
      not_enough_evidence: "casefileNotEnoughEvidence",
      missing_required_evidence: "casefileMissingPrimaryRecord",
    };
    setCaseFeedback(t(messages[outcome?.reason ?? "slots_rejected"]));
    setCaseFeedbackTone(outcome?.reason === "partial_lock" ? "warm" : "cold");
    play(outcome?.reason === "partial_lock" ? "click" : "error");
  };

  const submitTheory = () => {
    if (!lensUnlocked("organize")) {
      setTheoryFeedback(t("casefileLensLocked"));
      play("error");
      return;
    }
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
    if (
      !lensUnlocked("contradictions") ||
      !visibleHypothesisIds.includes(hypothesisId)
    ) {
      setTheoryFeedback(t("casefileLensLocked"));
      play("error");
      return;
    }
    const ids = HYPOTHESIS_EVIDENCE_REQUIREMENTS[hypothesisId];
    if (!ids.every((id) => discoveredEvidenceIds.includes(id))) {
      setTheoryFeedback(t("casefileHypothesisEvidenceNeeded"));
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

  const toggleDeck = (deckId: CasefileClaimId) => {
    setExpandedDeckIds((current) => {
      const next = new Set(current);
      if (next.has(deckId)) {
        next.delete(deckId);
      } else {
        next.add(deckId);
      }
      return next;
    });
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
    const startPoint = {
      x: (event.clientX - startRect.left) / boardZoom,
      y: (event.clientY - startRect.top) / boardZoom,
    };
    const offsetX = startPoint.x - current.x;
    const offsetY = startPoint.y - current.y;
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
      const point = {
        x: (moveEvent.clientX - rect.left) / boardZoom,
        y: (moveEvent.clientY - rect.top) / boardZoom,
      };
      const x = Math.max(
        0,
        Math.min(
          CASEFILE_BOARD_WIDTH - CARD_WIDTH,
          point.x - offsetX
        )
      );
      const y = Math.max(0, point.y - offsetY);
      setDragPreview({ id: cardId, x, y });
    };

    const handleUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      if (moved) {
        const rect = canvas.getBoundingClientRect();
        const point = {
          x: (upEvent.clientX - rect.left) / boardZoom,
          y: (upEvent.clientY - rect.top) / boardZoom,
        };
        const x = Math.max(
          0,
          Math.min(
            CASEFILE_BOARD_WIDTH - CARD_WIDTH,
            point.x - offsetX
          )
        );
        const y = Math.max(0, point.y - offsetY);
        moveBoardCard(cardId, x, y);
        setDragPreview(null);
      } else {
        handleCardClick(cardId);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const startBoardPan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(".evidence-card") ||
      target.closest(".casefile-retained-deck") ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("a")
    ) {
      return;
    }

    const scroller = scrollRef.current;
    if (!scroller) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = scroller.scrollLeft;
    const startTop = scroller.scrollTop;
    setPanningBoard(true);

    const handleMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      scroller.scrollLeft = startLeft - (moveEvent.clientX - startX);
      scroller.scrollTop = startTop - (moveEvent.clientY - startY);
    };

    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      setPanningBoard(false);
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
      const slotType =
        statement.slots.find((slot) => slot.key === key)?.type ??
        ("detail" as TokenType);
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
            : `[${t(TOKEN_TYPE_LABEL_KEYS[slotType])}]`}
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
        title={`${t("casefileExtractedFactOfType")} ${t(
          TOKEN_TYPE_LABEL_KEYS[token.type]
        )}`}
      >
        {localized(token.label, locale)}
      </span>
    );
  };

  const cardStatus = (card: CasefileCard): { label: string; tone: string } => {
    if (confirmedCardIds.has(card.id) || card.category === "correlation") {
      return {
        label: t("casefileStatusRetained"),
        tone: "retained",
      };
    }
    if (
      Object.values(state.caseAnswers).some((answer) =>
        answer?.evidenceIds?.includes(card.id)
      )
    ) {
      return { label: t("casefileStatusUsed"), tone: "used" };
    }
    if (collectedTokensForEvidence(card.id, state.collectedTokens).length > 0) {
      return {
        label: t("casefileStatusExtracted"),
        tone: "extracted",
      };
    }
    return { label: t("casefileStatusFiled"), tone: "filed" };
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
      setTheoryFeedback(t("casefileTimelineSuccess"));
      play("chime");
    } else {
      setTheoryFeedback(t("casefileChronologyMismatch"));
      play("error");
    }
  };

  useEffect(() => {
    if (!dossierCard && !helpLegendOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialogs();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dossierCard, helpLegendOpen]);

  useEffect(() => {
    if (!dossierCard) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      dossierDialogRef.current?.focus();
    });
  }, [dossierCard]);

  useEffect(() => {
    if (!helpLegendOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      helpDialogRef.current?.focus();
    });
  }, [helpLegendOpen]);

  const renderInspector = () => {
    if (lens === "reconstruct") {
      return (
        <section
          id={lensPanelId("reconstruct")}
          className="casefile-inspector__stack"
          role="tabpanel"
          aria-labelledby={lensTabId("reconstruct")}
        >
          <div className="casefile-claim-list">
            <strong>{t("casefileFindings")}</strong>
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
              {`${t("casefileAct")} ${statement.act} / ${t(
                "casefileFindingInProgress"
              )}`}
            </small>
            <h3 className="case-reconstruction__statement">{renderStatement()}</h3>
            <div className="casefile-fact-bank">
              <strong>{t("casefileFactBank")}</strong>
              <div>
                {candidates.length > 0 ? (
                  candidates.map((token) => renderFactChip(token.id, "bank"))
                ) : (
                  <p>
                    {t("casefileNoFactOfType")}
                  </p>
                )}
              </div>
            </div>
            <div className="casefile-attached">
              <header>
                <strong>
                  {t("casefileAttachedRecords")}
                </strong>
                <span>{attachedEvidenceIds.length}/5</span>
              </header>
              {attachedEvidenceIds.length === 0 ? (
                <p>
                  {t("casefileAttachedRecordsHint")}
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
                    {cardLabelById(id)}
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
                ? t("casefileFindingRetained")
                : t("casefileTestFinding")}
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
              placeholder={t("casefileFilterFoundations")}
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
                    aria-label={`${t("casefileOpenRecord")} ${card.title}`}
                    onClick={() => openRecord(card)}
                  >
                    ◉
                  </button>
                  <button
                    type="button"
                    aria-label={`${t("casefileLocateOnBoard")} ${card.title}`}
                    onClick={() => locateOnBoard(card.id)}
                  >
                    ⌖
                  </button>
                </div>
              );
            })}
          </section>
        </section>
      );
    }

    if (lens === "timeline") {
      return (
        <section
          id={lensPanelId("timeline")}
          className="casefile-inspector__stack"
          role="tabpanel"
          aria-labelledby={lensTabId("timeline")}
        >
          <section className="casefile-timeline">
            <strong>{t("casefileTimelineTitle")}</strong>
            <p>{t("casefileTimelineHint")}</p>
            <div className="casefile-timeline__ruler" aria-hidden="true">
              <span>1998</span>
              <i />
              <span>2014</span>
              <i />
              <span>2026</span>
              <i />
              <span>{t("casefileTomorrow")}</span>
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
                      aria-label="Move event up"
                    >
                      ▲
                    </button>
                    <button
                      className="button"
                      onClick={() => moveTimelineEvent(index, 1)}
                      disabled={index === visibleTimelineOrder.length - 1}
                      aria-label="Move event down"
                    >
                      ▼
                    </button>
                    </div>
                    <time>{event.date}</time>
                    <span>{localized(event.title, locale)}</span>
                    <small>{cardLabelById(event.evidenceId)}</small>
                  </li>
                );
              })}
            </ol>
            <button
              className="button casefile-submit"
              disabled={knownTimelineEvents.length < 5}
              onClick={testTimeline}
            >
              {t("casefileTestChronology")}
            </button>
            {theoryFeedback && <p>{theoryFeedback}</p>}
          </section>
        </section>
      );
    }

    if (lens === "contradictions") {
      return (
        <section
          id={lensPanelId("contradictions")}
          className="casefile-inspector__stack"
          role="tabpanel"
          aria-labelledby={lensTabId("contradictions")}
        >
          <section className="casefile-contradictions">
            <strong>{t("casefileCompetingHypotheses")}</strong>
            <p>{t("casefileNeedTwoRecordsToRefute")}</p>
            {visibleHypothesisIds.map((hypothesisId) => {
              const record = state.hypotheses[hypothesisId];
              const requiredIds = HYPOTHESIS_EVIDENCE_REQUIREMENTS[hypothesisId];
              const readyCount = requiredIds.filter((id) =>
                discoveredEvidenceIds.includes(id)
              ).length;
              const refuted = record?.status === "refuted";
              const verdict = hypothesisVerdict(hypothesisId);
              const isInconclusive = refuted && verdict === "inconclusive";
              return (
                <article
                  key={hypothesisId}
                  className={
                    refuted
                      ? isInconclusive
                        ? "refuted inconclusive"
                        : "refuted"
                      : "locked"
                  }
                >
                  <h4>{localized(HYPOTHESES[hypothesisId].title, locale)}</h4>
                  {refuted ? (
                    <p className="casefile-contradictions__explanation">
                      {localized(HYPOTHESES[hypothesisId].truth, locale)}
                    </p>
                  ) : (
                    <p>{t("casefileNeedTwoRecordsToRefute")}</p>
                  )}
                  <div className="casefile-contradictions__progress">
                    <strong>
                      {readyCount}/{requiredIds.length}
                    </strong>
                    <span>
                      {t("casefileRecordsFound")}
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
                        <span
                          aria-hidden="true"
                          className={`casefile-contradictions__slot-state ${
                            discoveredEvidenceIds.includes(id)
                              ? "casefile-contradictions__slot-state--found"
                              : "casefile-contradictions__slot-state--missing"
                          }`}
                        >
                          {discoveredEvidenceIds.includes(id) ? "•" : "◯"}
                        </span>
                        {cardLabelById(id)}
                      </span>
                    ))}
                  </div>
                  <button
                    className="button"
                    disabled={refuted || readyCount < requiredIds.length}
                    onClick={() => refuteHypothesis(hypothesisId)}
                  >
                    {refuted
                      ? isInconclusive
                        ? t("casefileInconclusive")
                        : t("casefileRefuted")
                      : t("casefileRefute")}
                  </button>
                </article>
              );
            })}
            {theoryFeedback && (
              <p className="evidence-board__theory-feedback">{theoryFeedback}</p>
            )}
          </section>
        </section>
      );
    }

    return (
      <section
        id={lensPanelId("organize")}
        className="casefile-inspector__stack"
        role="tabpanel"
        aria-labelledby={lensTabId("organize")}
      >
        <section className="evidence-board__theory">
          <span>{t("casefileCorrelationTray")}</span>
          <strong>{t("theoryPrompt")}</strong>
          <p className="casefile-correlation-hint">{t("casefileCorrelationHint")}</p>
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
                      {cardLabelById(id)} ×
                      <span className="casefile-card__selected-tag">
                        {t("casefileSelectedTag")}
                      </span>
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
                {t("casefileSelectedCard")}
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
            <strong>{t("casefileRetainedCorrelations")}</strong>
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
              {t("casefileBoardRelations")}
            </strong>
            <span>{allThreadKeys.length}</span>
          </header>
          {allThreadKeys.length === 0 ? (
            <p>
              {t("casefileNoCorrelationsPrompt")}
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
                      : t("casefileAttachedTag")}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    );
  };

  const renderBoardCard = (
    card: CasefileCard,
    options: { decked?: boolean } = {}
  ) => {
    const position = positionsById[card.id];
    if (!position) return null;
    const meta = CATEGORY_META[card.category];
    const status = cardStatus(card);
    const facts = collectedTokensForEvidence(card.id, state.collectedTokens);
    const relevant = relevantEvidence.has(card.id);
    const attached = activeEvidenceSet.has(card.id);
    const fresh = freshIds.has(card.id);
    const dragging = !options.decked && dragPreview?.id === card.id;
    const located = flashId === card.id;
    const shared = sharedRetainedEvidenceIds.has(card.id);
    const className = `evidence-card evidence-card--${card.category} ${
      selectedId === card.id ? "evidence-card--selected" : ""
    } ${theoryIds.includes(card.id) ? "evidence-card--theory" : ""} ${
      confirmedCardIds.has(card.id) ? "evidence-card--confirmed" : ""
    } ${relevant ? "casefile-card--relevant" : ""} ${
      attached ? "casefile-card--attached" : ""
    } ${shared ? "evidence-card--shared" : ""
    } ${fresh ? "casefile-card--fresh" : ""} ${
      dragging ? "evidence-card--dragging" : ""
    } ${located ? "casefile-card--locate" : ""} ${
      options.decked ? "evidence-card--decked" : ""
    } casefile-card--${status.tone}`;

    return (
      <div
        key={card.id}
        role="button"
        tabIndex={0}
        className={className}
        style={{ left: position.x, top: position.y }}
        onMouseDown={(event) => {
          if (options.decked) {
            event.stopPropagation();
            return;
          }
          startDrag(event, card.id);
        }}
        onClick={
          options.decked
            ? (event) => {
                event.stopPropagation();
                handleCardClick(card.id);
              }
            : undefined
        }
        onMouseEnter={() => setHoverId(card.id)}
        onMouseLeave={() =>
          setHoverId((current) => (current === card.id ? null : current))
        }
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick(card.id);
          }
        }}
        aria-label={`${card.title}. ${card.summary}`}
        title={
          lens === "reconstruct"
            ? t("casefileAttachToFinding")
            : lens === "organize"
              ? t("casefileAddOrRemoveCorrelation")
              : t("casefileSelect")
        }
      >
        {fresh && (
          <span className="casefile-card__fresh">
            {t("casefileNewTag")}
          </span>
        )}
        <span className="evidence-card__pin" aria-hidden="true" />
        {confirmedCardIds.has(card.id) && (
          <span
            className="evidence-card__seal"
            aria-hidden="true"
            title={t("confirmedCorrelation")}
          />
        )}
        {shared && (
          <span className="evidence-card__shared" title={t("casefileSharedEvidence")}>
            {retainedEvidenceUsage[card.id]?.length ?? 2}x
          </span>
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
                ? t("casefileFindingSealed")
                : t("casefileFindingOpen")}
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
  };

  return (
    <div className="arg-tool casefile evidence-board">
      <div className="arg-tool__menubar">
        <span>Casefile.exe</span>
        <span>{t("menuView")}</span>
        <span>{t("menuConnections")}</span>
        <button
          type="button"
          className="casefile__menubar-help"
          aria-label={`${t("help")} ${t("casefileHelpLegendTitle")}`}
          onClick={openHelpLegend}
          aria-haspopup="dialog"
        >
          {t("help")}
          {showNewBadge && <span className="casefile__new-badge">{t("casefileNewTag")}</span>}
        </button>
      </div>

      <header className="casefile__header">
        <div>
          <p>
            MISKATONIC INCIDENT REVIEW / SB-0316 / {t("chapterLabel")}{" "}
            {currentChapter.replace("chapter_", "")}
          </p>
          <h2>{t("casefileLabel")}</h2>
        </div>
        <div className="casefile__lenses" role="tablist">
          {(Object.keys(LENS_LABEL_KEYS) as CasefileLens[]).map((candidate) => {
            const unlocked = lensUnlocked(candidate);
            const requiredChapter = LENS_MIN_CHAPTERS[candidate];
            return (
              <button
                type="button"
                key={candidate}
                id={lensTabId(candidate)}
                role="tab"
                aria-controls={lensPanelId(candidate)}
                aria-selected={lens === candidate}
                tabIndex={lens === candidate ? 0 : -1}
                className={[
                  lens === candidate ? "active" : "",
                  unlocked ? "" : "locked",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={!unlocked}
                title={
                  unlocked
                    ? undefined
                    : `${t("casefileLensLocked")} ${t("chapterLabel")} ${requiredChapter.replace(
                        "chapter_",
                        ""
                      )}: ${t(CHAPTER_TITLE_KEYS[requiredChapter])}`
                }
                onClick={() => {
                  if (!unlocked) return;
                  setLens(candidate);
                  setSelectedId(null);
                  setTheoryFeedback("");
                }}
              >
                {t(LENS_LABEL_KEYS[candidate])}
              </button>
            );
          })}
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
        <div className="casefile__tools" aria-label={t("casefileOptions")}>
          <span className="casefile__tools-title">{t("casefileOptions")}</span>
          <label>
            {t("casefileShow")}
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
          <label>
            {t("casefileChapterFilter")}
            <select
              value={chapterFilter}
              onChange={(event) =>
                setChapterFilter(event.target.value as "all" | ChapterId)
              }
            >
              <option value="all">{t("all")}</option>
              {chapterOptions.map((chapterId) => (
                <option key={chapterId} value={chapterId}>
                  {chapterId.replace("chapter_", "")}. {t(CHAPTER_TITLE_KEYS[chapterId])}
                </option>
              ))}
            </select>
          </label>
          <label className="casefile__checkbox">
            <input
              type="checkbox"
              checked={showUnexplainedOnly}
              onChange={(event) => setShowUnexplainedOnly(event.target.checked)}
            />
            {t("casefileOnlyUnexplained")}
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
        </div>
      </div>

      <div className="evidence-board__workspace casefile__workspace">
        <div
          ref={scrollRef}
          className={`evidence-board__scroll ${
            panningBoard ? "evidence-board__scroll--panning" : ""
          }`}
          onMouseDown={startBoardPan}
        >
          <div
            className="evidence-board__zoom-layer"
            style={{ width: scaledCanvasWidth, height: scaledCanvasHeight }}
          >
            <div
              ref={canvasRef}
              className="evidence-board__canvas casefile__canvas"
              style={{
                width: CASEFILE_BOARD_WIDTH,
                height: canvasHeight,
                transform: `scale(${boardZoom})`,
              }}
            >
            <div className="evidence-board__zone evidence-board__zone--people">
              {t("peopleAnchors")}
            </div>
            <div className="evidence-board__zone evidence-board__zone--evidence">
              {t("discoveredEvidenceZone")}
            </div>
            {filter === "all" &&
              !normalizedQuery &&
              evidenceLayout.clusters.map((cluster) => (
                <div
                  key={cluster.category}
                  className="evidence-board__cluster-label"
                  style={{
                    top: cluster.labelY,
                    left: CASEFILE_EVIDENCE_GRID_LEFT,
                  }}
                >
                  {categoryLabel(cluster.category)} · {cluster.count}
                </div>
              ))}
            <div className="evidence-board__zone casefile__zone--claims">
              {t("casefileZoneClaims")}
            </div>
            <div className="evidence-board__zone casefile__zone--correlations">
              {t("casefileCorrelations")}
            </div>
            {lens === "contradictions" && (
              <div className="evidence-board__zone casefile__zone--hypotheses">
                {t("casefileHypotheses")}
              </div>
            )}

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
                  const touchesFocus =
                    focusId != null &&
                    (fromId === focusId || toId === focusId);
                  const groupClass = focusId
                    ? `evidence-board__string-group ${
                        touchesFocus
                          ? "evidence-board__string-group--focused"
                          : "evidence-board__string-group--dimmed"
                      }`
                    : "evidence-board__string-group";
                  return (
                    <g key={key} className={groupClass}>
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
                const touchesFocus =
                  focusId != null && (fromId === focusId || toId === focusId);
                const groupClass = [
                  "evidence-board__string-group",
                  "evidence-board__confirmed-group",
                  focusId
                    ? touchesFocus
                      ? "evidence-board__string-group--focused"
                      : "evidence-board__string-group--dimmed"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <g key={key} className={groupClass}>
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

            {visibleDecks.map((deck) => {
              const expanded = deckIsExpanded(deck.id);
              const position = deckPosition(deck.id);
              const deckPanelId = `casefile-retained-deck-${deck.id}`;
              return (
                <section
                  key={`deck:${deck.id}`}
                  id={deckPanelId}
                  className={`casefile-retained-deck ${
                    expanded ? "casefile-retained-deck--expanded" : ""
                  } ${
                    autoExpandedDeckIds.has(deck.id)
                      ? "casefile-retained-deck--filtered"
                      : ""
                  }`}
                  style={{ left: position.x, top: position.y }}
                  aria-label={`${t("casefileDeckLabel")} ${deck.findingCard.title}`}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() => toggleDeck(deck.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleDeck(deck.id);
                    }
                    if (event.key === "Escape" && expandedDeckIds.has(deck.id)) {
                      event.stopPropagation();
                      setExpandedDeckIds((current) => {
                        const next = new Set(current);
                        next.delete(deck.id);
                        return next;
                      });
                    }
                  }}
                >
                  <button
                    type="button"
                    className="casefile-retained-deck__toggle"
                    aria-label={`${
                      expanded ? t("casefileDeckCollapse") : t("casefileDeckExpand")
                    } ${deck.findingCard.title}, ${deck.evidence.length} ${t(
                      "casefileDeckEvidenceCount"
                    )}`}
                    aria-expanded={expanded}
                    aria-controls={deckPanelId}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleDeck(deck.id);
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <span>{t("casefileDeckLabel")}</span>
                    <strong>{deck.evidence.length}</strong>
                    <i aria-hidden="true">{expanded ? "−" : "+"}</i>
                  </button>
                  <div className="casefile-retained-deck__stack" aria-hidden="true">
                    {deck.evidence.slice(0, 4).map((card, index) => (
                      <span key={card.id} style={{ top: index * 7 }} />
                    ))}
                  </div>
                  {autoExpandedDeckIds.has(deck.id) && !expandedDeckIds.has(deck.id) && (
                    <small>{t("casefileDeckFiltered")}</small>
                  )}
                </section>
              );
            })}

            {positioned.map(({ card }) => renderBoardCard(card))}

            {visibleDecks.flatMap((deck) =>
              deckIsExpanded(deck.id)
                ? deck.evidence.map((card) => renderBoardCard(card, { decked: true }))
                : []
            )}

            {positioned.length === 0 && visibleDecks.length === 0 && (
              <div className="evidence-board__empty">{t("noEvidenceMatch")}</div>
            )}
          </div>
          </div>
        </div>

        <aside className="evidence-board__inspector casefile__inspector">
          <p className="arg-tool__kicker">
            {lens === "organize"
              ? t("casefileCorrelations").toUpperCase()
              : t(LENS_LABEL_KEYS[lens]).toUpperCase()}
          </p>
          {renderInspector()}
        </aside>
      </div>

      <div className="arg-tool__status">
        <span>
          {t("casefileLensLabel")}: {t(LENS_LABEL_KEYS[lens])}
        </span>
        <span>{lensHintText}</span>
        <span>
          {solvedFindingsVisible} / {visibleStatements.length}{" "}
          {t("casefileFindingsRetained")}
        </span>
        <span>
          {state.collectedTokens.length}{" "}
          {t("casefileFactsExtracted")}
        </span>
      </div>

      {showCoverMemo && (
        <section className="casefile__cover-memo" role="note">
          <p className="casefile__cover-memo-kicker">{t("casefileMemoKicker")}</p>
          <button
            type="button"
            className="casefile__cover-memo-close"
            aria-label={t("casefileMemoDismiss")}
            onClick={() => setCoverMemoVisible(false)}
          >
            ×
          </button>
          <strong>{t("casefileMemoTitle")}</strong>
          <ol>
            <li>{t("casefileMemoStep1")}</li>
            <li>{t("casefileMemoStep2")}</li>
            <li>{t("casefileMemoStep3")}</li>
            <li>{t("casefileMemoStep4")}</li>
          </ol>
          <p>{t("casefileMemoSignoff")}</p>
        </section>
      )}

      {dossierCard && (
        <div
          className="case-reconstruction__dossier-overlay"
          onClick={closeDialogs}
          role="presentation"
        >
          <div
            className="case-reconstruction__dossier"
            role="dialog"
            aria-modal="true"
            aria-labelledby={PERSONAL_FILE_DIALOG_TITLE_ID}
            tabIndex={-1}
            ref={dossierDialogRef}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <strong id={PERSONAL_FILE_DIALOG_TITLE_ID}>
                {t("casefilePersonalFile")}
              </strong>
              <button
                type="button"
                className="case-reconstruction__dossier-close"
                aria-label={t("casefileDialogClose")}
                onClick={closeDialogs}
              >
                ×
              </button>
            </header>
            <h3>{dossierCard.title}</h3>
            <p>{dossierCard.summary}</p>
          </div>
        </div>
      )}

      {helpLegendOpen && (
        <div className="casefile__dialog-overlay" onClick={closeDialogs}>
          <section
            className="casefile__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={HELP_DIALOG_TITLE_ID}
            ref={helpDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="casefile__dialog-header">
              <strong id={HELP_DIALOG_TITLE_ID}>{t("casefileHelpLegendTitle")}</strong>
              <button
                type="button"
                className="casefile__dialog-close"
                aria-label={t("casefileDialogClose")}
                onClick={closeDialogs}
              >
                ×
              </button>
            </header>
            <div className="casefile__help-legend" role="list">
              {[
                "casefileLegendOpen",
                "casefileLegendRemove",
                "casefileLegendThread",
                "casefileLegendRetained",
                "casefileLegendMove",
                "casefileLegendStatus",
                "casefileLegendLens",
              ].map((key) => (
                <span role="listitem" key={key}>
                  {t(key as TranslationKey)}
                </span>
              ))}
              {HELP_LEGEND_CATEGORIES.map((category) => (
                <span role="listitem" key={category}>
                  <span
                    className="casefile__help-legend-dot"
                    data-category={category}
                    aria-hidden="true"
                  />
                  <span>{categoryLabel(category)}</span>
                </span>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Casefile;
