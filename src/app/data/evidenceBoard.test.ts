import { describe, expect, it } from "vitest";
import { CASE_STATEMENTS, HYPOTHESES } from "../game/campaign";
import { THEORY_DEFINITIONS } from "../game/theories";
import {
  BoardCard,
  CARD_HEIGHT,
  CARD_WIDTH,
  CASEFILE_BOARD_WIDTH,
  CASEFILE_EVIDENCE_CATEGORY_ORDER,
  EVIDENCE_CARDS,
  PERSON_CARDS,
  PERSON_POSITIONS,
  casefileClaimPosition,
  casefileEvidenceLayout,
} from "./evidenceBoard";

type Rect = { x: number; y: number };

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + CARD_WIDTH &&
  a.x + CARD_WIDTH > b.x &&
  a.y < b.y + CARD_HEIGHT &&
  a.y + CARD_HEIGHT > b.y;

const assertNoOverlaps = (rects: Rect[]) => {
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      expect(overlaps(rects[i], rects[j])).toBe(false);
    }
  }
};

const allEvidenceCards = Object.values(EVIDENCE_CARDS);
const findingCount = CASE_STATEMENTS.length;
const correlationCount = THEORY_DEFINITIONS.length;
const hypothesisCount = Object.keys(HYPOTHESES).length;
const rowStep = CARD_HEIGHT + 24;

const claimRects = (): Rect[] => [
  ...Array.from({ length: findingCount }, (_, i) =>
    casefileClaimPosition(i, "finding")
  ),
  ...Array.from({ length: correlationCount }, (_, i) =>
    casefileClaimPosition(i, "correlation")
  ),
  ...Array.from({ length: hypothesisCount }, (_, i) =>
    casefileClaimPosition(i, "hypothesis")
  ),
];

describe("casefileEvidenceLayout", () => {
  it("never overlaps evidence, people or claim defaults in the worst case", () => {
    const layout = casefileEvidenceLayout(allEvidenceCards);
    const rects = [
      ...Object.values(layout.positions),
      ...Object.values(PERSON_POSITIONS),
      ...claimRects(),
    ];
    assertNoOverlaps(rects);
  });

  it("never overlaps regardless of discovery order", () => {
    const reversed = [...allEvidenceCards].reverse();
    const interleaved = allEvidenceCards.filter((_, i) => i % 2 === 0).concat(
      allEvidenceCards.filter((_, i) => i % 2 === 1)
    );
    for (const order of [reversed, interleaved]) {
      const layout = casefileEvidenceLayout(order);
      assertNoOverlaps(Object.values(layout.positions));
    }
  });

  it("keeps every evidence card left of the claim columns", () => {
    const layout = casefileEvidenceLayout(allEvidenceCards);
    for (const position of Object.values(layout.positions)) {
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x + CARD_WIDTH).toBeLessThanOrEqual(828);
      expect(position.y).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps every claim default inside the board width", () => {
    for (const rect of claimRects()) {
      expect(rect.x + CARD_WIDTH).toBeLessThanOrEqual(CASEFILE_BOARD_WIDTH);
    }
  });

  it("groups cards into contiguous clusters in canonical category order", () => {
    const layout = casefileEvidenceLayout(allEvidenceCards);
    const clusterCategories = layout.clusters.map((cluster) => cluster.category);
    const expectedOrder = CASEFILE_EVIDENCE_CATEGORY_ORDER.filter((category) =>
      allEvidenceCards.some((card) => card.category === category)
    );
    expect(clusterCategories).toEqual(expectedOrder);

    for (const cluster of layout.clusters) {
      const cardsInCategory = allEvidenceCards.filter(
        (card) => card.category === cluster.category
      );
      expect(cluster.count).toBe(cardsInCategory.length);
      cardsInCategory.forEach((card, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        expect(layout.positions[card.id]).toEqual({
          x: 36 + col * (CARD_WIDTH + 24),
          y: cluster.labelY + 26 + row * (CARD_HEIGHT + 24),
        });
      });
    }
  });

  it("keeps earlier clusters and same-category positions stable as evidence is discovered", () => {
    for (let i = 1; i < allEvidenceCards.length; i++) {
      const before = casefileEvidenceLayout(allEvidenceCards.slice(0, i));
      const after = casefileEvidenceLayout(allEvidenceCards.slice(0, i + 1));
      const addedCategory = allEvidenceCards[i].category;
      const addedIndex = CASEFILE_EVIDENCE_CATEGORY_ORDER.indexOf(addedCategory);

      for (const cluster of before.clusters) {
        const clusterIndex = CASEFILE_EVIDENCE_CATEGORY_ORDER.indexOf(cluster.category);
        if (clusterIndex < addedIndex) {
          expect(after.clusters.find((c) => c.category === cluster.category)).toEqual(
            cluster
          );
        }
      }

      for (const [id, position] of Object.entries(before.positions)) {
        const category = allEvidenceCards.find((card) => card.id === id)!.category;
        const orderIndex = CASEFILE_EVIDENCE_CATEGORY_ORDER.indexOf(category);
        if (orderIndex <= addedIndex) {
          expect(after.positions[id]).toEqual(position);
        }
      }
    }
  });

  it("moves later clusters only by a uniform vertical offset", () => {
    for (let i = 1; i < allEvidenceCards.length; i++) {
      const beforeCards = allEvidenceCards.slice(0, i);
      const after = casefileEvidenceLayout(allEvidenceCards.slice(0, i + 1));
      const before = casefileEvidenceLayout(beforeCards);
      const addedCategory = allEvidenceCards[i].category;
      const addedIndex = CASEFILE_EVIDENCE_CATEGORY_ORDER.indexOf(addedCategory);
      let downstreamDelta: number | null = null;

      for (const card of beforeCards) {
        const categoryIndex = CASEFILE_EVIDENCE_CATEGORY_ORDER.indexOf(card.category);
        if (categoryIndex <= addedIndex) continue;

        const beforePosition = before.positions[card.id];
        const afterPosition = after.positions[card.id];
        expect(afterPosition.x).toBe(beforePosition.x);
        const delta = afterPosition.y - beforePosition.y;
        downstreamDelta ??= delta;
        expect(delta).toBe(downstreamDelta);
      }
    }
  });

  it("reports the bottom edge after the last occupied cluster row", () => {
    const layout = casefileEvidenceLayout(allEvidenceCards);
    const expectedBottom = Math.max(
      ...Object.values(layout.positions).map((position) => position.y + rowStep)
    );
    expect(layout.bottom).toBe(expectedBottom);
  });

  it("covers every evidence category present in the game", () => {
    const categories = new Set(allEvidenceCards.map((card: BoardCard) => card.category));
    categories.forEach((category) => {
      expect(CASEFILE_EVIDENCE_CATEGORY_ORDER).toContain(category);
    });
  });

  it("produces no clusters and the grid top as bottom for an empty board", () => {
    const layout = casefileEvidenceLayout([]);
    expect(layout.clusters).toEqual([]);
    expect(layout.positions).toEqual({});
    expect(layout.bottom).toBe(390);
  });

  it("keeps the five pinned people non-overlapping with each other", () => {
    assertNoOverlaps(Object.values(PERSON_POSITIONS));
    expect(Object.keys(PERSON_POSITIONS)).toHaveLength(PERSON_CARDS.length);
  });
});
