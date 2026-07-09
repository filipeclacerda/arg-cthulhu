export type BoardCategory =
  | "person"
  | "photo"
  | "document"
  | "audio"
  | "email"
  | "conversation"
  | "record";

export interface BoardCard {
  id: string;
  title: string;
  category: BoardCategory;
  summary: string;
  preview?: string;
}

/** Anchors always pinned, from the very start — the cast of the case. */
export const PERSON_CARDS: BoardCard[] = [
  {
    id: "person-sarah",
    title: "Sarah Bishop",
    category: "person",
    summary: "Cataloguer, Special Collections. Missing since 03/16.",
  },
  {
    id: "person-miriam",
    title: "Miriam Bishop",
    category: "person",
    summary: "Sarah's mother. Cataloguer. Missing since 1998.",
  },
  {
    id: "person-tom",
    title: "Tom Alvarez",
    category: "person",
    summary: "Sarah's colleague. Source signature on the Relay 07 upload.",
  },
  {
    id: "person-em",
    title: "Em Bishop",
    category: "person",
    summary: "Sarah's sister.",
  },
  {
    id: "person-david",
    title: "David Bishop",
    category: "person",
    summary: "Sarah's father.",
  },
];

/** Cards keyed by evidenceId — pinned automatically as each is discovered. */
export const EVIDENCE_CARDS: Record<string, BoardCard> = {
  photo_sarah_office: {
    id: "photo_sarah_office",
    title: "late_again.png",
    category: "photo",
    summary: "Sarah at the archive. Miriam's old machine behind her.",
    preview: "/photos/sarah_archive_office_2026.png",
  },
  photo_miriam_sarah_1998: {
    id: "photo_miriam_sarah_1998",
    title: "mom_and_me_1998.png",
    category: "photo",
    summary: "Miriam and Sarah, seven weeks before the Whateley deposit.",
    preview: "/photos/miriam_sarah_1998.png",
  },
  photo_sarah_em_coast: {
    id: "photo_sarah_em_coast",
    title: "innsmouth_trip.png",
    category: "photo",
    summary: "Sarah and Em on the coast. Something in the water Em doesn't remember.",
    preview: "/photos/sarah_em_coast_2025.png",
  },
  photo_sarah_tom_2024: {
    id: "photo_sarah_tom_2024",
    title: "tom_after_symposium.png",
    category: "photo",
    summary: "Sarah and Tom, before any of this.",
    preview: "/photos/sarah_tom_campus_2024.png",
  },
  photo_bishop_birthday_2025: {
    id: "photo_bishop_birthday_2025",
    title: "dads_65th.png",
    category: "photo",
    summary: "The last family birthday with Sarah present.",
    preview: "/photos/bishop_birthday_2025.png",
  },
  photo_sarah_em_kitchen_2025: {
    id: "photo_sarah_em_kitchen_2025",
    title: "after_dads_65th.png",
    category: "photo",
    summary: "A late kitchen snapshot. The fridge keeps an older shoreline.",
    preview: "/photos/sarah_em_kitchen_2025.png",
  },
  fridge_postcard_note: {
    id: "fridge_postcard_note",
    title: "fridge_postcard_note.txt",
    category: "document",
    summary: "Em compares a fridge postcard with the Innsmouth photograph.",
  },
  diary: {
    id: "diary",
    title: "Research journal",
    category: "document",
    summary: "Sarah's own account, in her own words, up to March 16.",
  },
  todo: {
    id: "todo",
    title: "to_do.txt",
    category: "document",
    summary: "A damp rug. A carpet that smells like the beach.",
  },
  miriam_1998: {
    id: "miriam_1998",
    title: "mom_1998.txt",
    category: "document",
    summary: "Miriam's 1998 accession notes. Unfinished.",
  },
  miriam_letter_1998: {
    id: "miriam_letter_1998",
    title: "to_robert_1998.txt",
    category: "document",
    summary: "Miriam's letter to Armitage. She wanted a second opinion.",
  },
  incident_report: {
    id: "incident_report",
    title: "Campus security report",
    category: "document",
    summary: "Locked room. Seawater. A date one day wrong.",
  },
  maintenance_record: {
    id: "maintenance_record",
    title: "Facilities ticket F-2026-0311-88",
    category: "document",
    summary: "No pipes enter the room. The moisture circle was centered under the workstation.",
  },
  office_frames_11_13: {
    id: "office_frames_11_13",
    title: "office_frames_11_13.png",
    category: "photo",
    summary: "The photographs immediately before and after frame 12 show no reflection.",
    preview: "/photos/office_frames_11_13.png",
  },
  paint_doodles: {
    id: "paint_doodles",
    title: "meeting_notes.bmp",
    category: "photo",
    summary: "Sarah's meeting doodles. Three monsters and a very bad drawing of Armitage.",
    preview: "/photos/sarah_meeting_doodles.png",
  },
  photo_sarah_bus_2025: {
    id: "photo_sarah_bus_2025",
    title: "groceries_on_the_7.png",
    category: "photo",
    summary: "Sarah going home with groceries. An ordinary evening before the case.",
    preview: "/photos/sarah_bus_2025.png",
  },
  whateley_accession_card: {
    id: "whateley_accession_card",
    title: "Whateley accession card, 1998",
    category: "photo",
    summary: "Miriam left the Volume II catalog field blank.",
    preview: "/artifacts/whateley_accession_card_1998.png",
  },
  miriam_notebook: {
    id: "miriam_notebook",
    title: "Miriam's working notebook",
    category: "photo",
    summary: "Crossed-out shelfmarks end in an explicit instruction: LEAVE BLANK.",
    preview: "/artifacts/miriam_working_notebook_1998.png",
  },
  dad_recipe: {
    id: "dad_recipe",
    title: "dads_chowder.txt",
    category: "document",
    summary: "A recipe that is mostly an excuse to make Sarah call home.",
  },
  lecture_draft: {
    id: "lecture_draft",
    title: "lecture_draft.txt",
    category: "document",
    summary: "Sarah planned to leave the archive at 6:30 and call Em.",
  },
  solitaire_save: {
    id: "solitaire_save",
    title: "SOLITAIRE.SAV",
    category: "document",
    summary: "A hopeless saved game and an old joke between Sarah and Tom.",
  },
  midi_collection: {
    id: "midi_collection",
    title: "playlist.m3u",
    category: "document",
    summary: "Four tracks. One is missing and lasts exactly twenty-four hours.",
  },
  borrower_index: {
    id: "borrower_index",
    title: "Restricted reader index",
    category: "document",
    summary: "Nine surnames. The order matters more than the dates.",
  },
  margin_ciphertext: {
    id: "margin_ciphertext",
    title: "margin_ch7.enc",
    category: "document",
    summary: "A cipher in Sarah's own hand — one she doesn't remember writing.",
  },
  lot_114_scan: {
    id: "lot_114_scan",
    title: "114_verso.tif",
    category: "photo",
    summary: "The verso scan. Wrong orientation, wrong tone.",
    preview: "/artifacts/114-verso.png",
  },
  counting_audio: {
    id: "counting_audio",
    title: "counting.wav",
    category: "audio",
    summary: "Sarah recording proof. Something answers her.",
  },
  hydrographic_chart: {
    id: "hydrographic_chart",
    title: "Annotated hydrographic chart",
    category: "photo",
    summary: "Seven dates converge on a location scraped from the chart.",
    preview: "/artifacts/innsmouth_hydrographic_chart.png",
  },
  do_not_open: {
    id: "do_not_open",
    title: "DO_NOT_OPEN.txt",
    category: "document",
    summary: "Dated tomorrow. It knows you're reading it.",
  },
  counting_transcript: {
    id: "counting_transcript",
    title: "counting.wav — transcript",
    category: "document",
    summary: "A second voice the microphone couldn't render.",
  },
  office_after: {
    id: "office_after",
    title: "office_after.jpg — caption",
    category: "document",
    summary: "A reflection in a monitor that was off.",
  },
  office_after_photo: {
    id: "office_after_photo",
    title: "office_after.jpg",
    category: "photo",
    summary: "The empty office, three days later.",
    preview: "/photos/office_after_2026.png",
  },
  future_access_log: {
    id: "future_access_log",
    title: "access_log.txt",
    category: "document",
    summary: "A record of what you're about to do.",
  },
  absence_note: {
    id: "absence_note",
    title: "while_you_were_out.txt",
    category: "document",
    summary: "The files kept their appointments without you.",
  },
  lineage_pattern: {
    id: "lineage_pattern",
    title: "the_pattern.txt",
    category: "document",
    summary: "A series of years. The gap keeps shrinking.",
  },
  second_ledger: {
    id: "second_ledger",
    title: "second_ledger.txt",
    category: "document",
    summary: "A decode Sarah convinced herself wasn't real.",
  },
  tom_last_message: {
    id: "tom_last_message",
    title: "toms_last_message.txt",
    category: "document",
    summary: "Tom's warning, left inside the file it's warning about.",
  },
  tom_relay_disk_photo: {
    id: "tom_relay_disk_photo",
    title: "relay07_upload_setup.jpg",
    category: "photo",
    summary: "Tom's upload setup, photographed before he stopped answering.",
    preview: "/artifacts/tom_relay_disk_2026.png",
  },
  tom_upload_notes: {
    id: "tom_upload_notes",
    title: "upload_notes.txt",
    category: "document",
    summary: "Tom's checklist notices the manifest already includes itself.",
  },
  the_name: {
    id: "the_name",
    title: "the_name.txt",
    category: "document",
    summary: "The true name. It won't be written down.",
  },
  index_help: {
    id: "index_help",
    title: "INDEX.HLP",
    category: "document",
    summary: "The syntax for joining what's left of someone.",
  },
  miriam_draft: {
    id: "miriam_draft",
    title: "MIRIAM_DRAFT.PRN",
    category: "document",
    summary: "Miriam says the blank shelfmark was deliberate.",
  },
  lineage_1863: {
    id: "lineage_1863",
    title: "Arkham Gazette, 1863",
    category: "document",
    summary: "Eliza Marsh vanished from a locked catalogue room flooded with seawater.",
  },
  lineage_1912: {
    id: "lineage_1912",
    title: "Whateley letter, 1912",
    category: "document",
    summary: "The empty line waits for its cataloguer, not its missing book.",
  },
  lineage_1949: {
    id: "lineage_1949",
    title: "Orne night log, 1949",
    category: "document",
    summary: "A reader card arrived before it was written and named a Bishop.",
  },
  lineage_1977: {
    id: "lineage_1977",
    title: "Bishop transfer, 1977",
    category: "document",
    summary: "Miriam inherited an intentionally incomplete ledger from the Akeley desk.",
  },
  bishop_transfer_box_photo: {
    id: "bishop_transfer_box_photo",
    title: "akeley_box_1977.png",
    category: "photo",
    summary: "The salt-bloomed box Miriam accepted from the closed Akeley desk.",
    preview: "/artifacts/bishop_transfer_box_1977.png",
  },
  bishop_transfer_inventory: {
    id: "bishop_transfer_inventory",
    title: "box_inventory_1977.txt",
    category: "document",
    summary: "The inventory finds a tomorrow-dated label among the 1977 contents.",
  },
  miriam_margin_match: {
    id: "miriam_margin_match",
    title: "Miriam margin comparison",
    category: "document",
    summary: "Annotations dated 1998 and tomorrow resolve to the same hand.",
  },
  victim_2014: {
    id: "victim_2014",
    title: "Off-site personnel match, 2014",
    category: "record",
    summary: "Eleanor Vale's badge authenticated one day after her disappearance.",
  },
  em_investigation: {
    id: "em_investigation",
    title: "Em's private trace",
    category: "document",
    summary: "Em tests the explanations that hurt less and finds that none survive.",
  },
  em_box_email: {
    id: "em_box_email",
    title: "Mom's box (I opened it)",
    category: "email",
    summary: "Em finds Miriam's 1977 map and a warning addressed to the next custodian.",
  },
  em_seawall_email: {
    id: "em_seawall_email",
    title: "The piling was there in 1977",
    category: "email",
    summary: "The shape in the sisters' photograph predates the harbor supports.",
  },
  record_2014: {
    id: "record_2014",
    title: "2014_RECORD.DAT",
    category: "record",
    summary: "The unresolved witness field contains the record's own checksum.",
  },
  containment_utility: {
    id: "containment_utility",
    title: "LOOPBACK.EXE",
    category: "document",
    summary: "An obsolete utility that registers an archive as its own witness.",
  },
  whitfield_memo: {
    id: "whitfield_memo",
    title: "Whitfield administrative memo",
    category: "record",
    summary: "Anomalous moisture and absences were recategorized as facilities incidents.",
  },
  tom_homepage: {
    id: "tom_homepage",
    title: "Tom's personal homepage",
    category: "record",
    summary: "Bad HTML, good coffee opinions and an edit timestamp after Tom vanished.",
  },
  deleted_expedition_fragment: {
    id: "deleted_expedition_fragment",
    title: "EXPEDITION.TMP",
    category: "document",
    summary: "A deleted note from an Antarctic camp, decades early.",
  },
  em_warning: {
    id: "em_warning",
    title: "Re: Re: Re: are you even alive",
    category: "email",
    summary: "Em, watching the same pattern happen twice.",
  },
  dad_email: {
    id: "dad_email",
    title: "Sunday, or whenever",
    category: "email",
    summary: "Dad, keeping a plate warm every year.",
  },
  lot_114_order: {
    id: "lot_114_order",
    title: "Your order has shipped — Lot 114",
    category: "email",
    summary: "Final sale. No returns. No signature required.",
  },
  sarah_live_email: {
    id: "sarah_live_email",
    title: "you opened it",
    category: "email",
    summary: "Sarah, writing from the other side of tomorrow.",
  },
  sarah_live_chat: {
    id: "sarah_live_chat",
    title: "Conversation with Sarah (tomorrow)",
    category: "conversation",
    summary: "Sarah can answer one question before the relay closes the channel.",
  },
  tom_loop_email: {
    id: "tom_loop_email",
    title: "RE: read receipts",
    category: "email",
    summary: "Tom, answering a question he never got to ask.",
  },
  chat_tom_archive: {
    id: "chat_tom_archive",
    title: "Conversation with Tom",
    category: "conversation",
    summary: "Coffee jokes, then a read receipt that shouldn't exist.",
  },
  chat_em_archive: {
    id: "chat_em_archive",
    title: "Conversation with Em",
    category: "conversation",
    summary: "A photo, a piling in the water, a childhood question repeated.",
  },
  chat_library_archive: {
    id: "chat_library_archive",
    title: "Special Collections chat log",
    category: "conversation",
    summary: "A dead account logs in at 03:14.",
  },
  catalogue_lot_114: {
    id: "catalogue_lot_114",
    title: "Catalogue record MS-WHA-1998-114/II",
    category: "record",
    summary: "The lot, the year, the missing volume — confirmed.",
  },
  coastline_archive: {
    id: "coastline_archive",
    title: "Hydrographic cache: Y'ha-nthlei",
    category: "record",
    summary: "A name the ocean doesn't put on maps.",
  },
  sarah_future_record: {
    id: "sarah_future_record",
    title: "Catalogue record — 2026",
    category: "record",
    summary: "Sarah's own name, filed under a date that hasn't happened.",
  },
  danforth_cache: {
    id: "danforth_cache",
    title: "Danforth's Antarctic Truth Page",
    category: "record",
    summary: "A discredited man who saw the range again in a scan.",
  },
  pabodie_archive: {
    id: "pabodie_archive",
    title: "Pabodie Expedition archive",
    category: "record",
    summary: "Fourteen specimens. Access withdrawn.",
  },
};

export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 138;
const GAP_X = 24;
const GAP_Y = 24;

export const PERSON_POSITIONS: Record<string, { x: number; y: number }> = {
  "person-miriam": { x: 60, y: 48 },
  "person-sarah": { x: 264, y: 48 },
  "person-tom": { x: 468, y: 48 },
  "person-david": { x: 162, y: 210 },
  "person-em": { x: 366, y: 210 },
};

/** Evidence clusters by category, in reading order — new categories fall back to the end. */
export const CASEFILE_EVIDENCE_CATEGORY_ORDER: readonly BoardCategory[] = [
  "photo",
  "document",
  "audio",
  "email",
  "conversation",
  "record",
];

const EVIDENCE_GRID_COLS = 4;
export const CASEFILE_EVIDENCE_GRID_LEFT = 36;
const CASEFILE_EVIDENCE_GRID_TOP = 390;
const CASEFILE_EVIDENCE_CLUSTER_LABEL_HEIGHT = 26;
const EVIDENCE_COL_STEP = CARD_WIDTH + GAP_X;
const EVIDENCE_ROW_STEP = CARD_HEIGHT + GAP_Y;

export interface CasefileEvidenceCluster {
  category: BoardCategory;
  labelY: number;
  count: number;
}

export interface CasefileEvidenceLayout {
  positions: Record<string, { x: number; y: number }>;
  clusters: CasefileEvidenceCluster[];
  /** Bottom edge (y) of the last cluster, or the grid top if there's nothing to show yet. */
  bottom: number;
}

/**
 * Groups evidence cards into per-category clusters that only occupy the rows
 * they need. A category with zero discovered cards contributes nothing, so
 * early-game boards stay compact; growing a cluster only ever shifts the
 * clusters that come after it, never reorders cards within a cluster.
 */
export const casefileEvidenceLayout = (
  cards: readonly Pick<BoardCard, "id" | "category">[]
): CasefileEvidenceLayout => {
  const byCategory = new Map<BoardCategory, Pick<BoardCard, "id" | "category">[]>();
  cards.forEach((card) => {
    const list = byCategory.get(card.category);
    if (list) {
      list.push(card);
    } else {
      byCategory.set(card.category, [card]);
    }
  });

  const order = [
    ...CASEFILE_EVIDENCE_CATEGORY_ORDER,
    ...Array.from(byCategory.keys()).filter(
      (category) => !CASEFILE_EVIDENCE_CATEGORY_ORDER.includes(category)
    ),
  ];

  const positions: Record<string, { x: number; y: number }> = {};
  const clusters: CasefileEvidenceCluster[] = [];
  let cursorY = CASEFILE_EVIDENCE_GRID_TOP;

  order.forEach((category) => {
    const cardsInCategory = byCategory.get(category);
    if (!cardsInCategory || cardsInCategory.length === 0) return;

    const labelY = cursorY;
    clusters.push({ category, labelY, count: cardsInCategory.length });
    const firstRowY = labelY + CASEFILE_EVIDENCE_CLUSTER_LABEL_HEIGHT;
    cardsInCategory.forEach((card, index) => {
      const col = index % EVIDENCE_GRID_COLS;
      const row = Math.floor(index / EVIDENCE_GRID_COLS);
      positions[card.id] = {
        x: CASEFILE_EVIDENCE_GRID_LEFT + col * EVIDENCE_COL_STEP,
        y: firstRowY + row * EVIDENCE_ROW_STEP,
      };
    });
    const rows = Math.ceil(cardsInCategory.length / EVIDENCE_GRID_COLS);
    cursorY = firstRowY + rows * EVIDENCE_ROW_STEP;
  });

  return {
    positions,
    clusters,
    bottom: clusters.length > 0 ? cursorY : CASEFILE_EVIDENCE_GRID_TOP,
  };
};

export const CASEFILE_BOARD_WIDTH = 1680;
const CASEFILE_FINDING_LEFT = 856;
const CASEFILE_CORRELATION_LEFT = 1088;
const CASEFILE_HYPOTHESIS_LEFT = 1320;

export type CasefileClaimKind = "finding" | "correlation" | "hypothesis";

export const casefileClaimPosition = (
  index: number,
  kind: CasefileClaimKind
): { x: number; y: number } => {
  if (kind === "correlation") {
    return { x: CASEFILE_CORRELATION_LEFT, y: 212 + index * 156 };
  }
  if (kind === "hypothesis") {
    return { x: CASEFILE_HYPOTHESIS_LEFT, y: 48 + index * 156 };
  }
  return { x: CASEFILE_FINDING_LEFT, y: 44 + index * 150 };
};
