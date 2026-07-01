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
    title: "to_richard_1998.txt",
    category: "document",
    summary: "Miriam's letter to Armitage. She wanted a second opinion.",
  },
  incident_report: {
    id: "incident_report",
    title: "Campus security report",
    category: "document",
    summary: "Locked room. Seawater. A date one day wrong.",
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

const COLS = 5;
export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 138;
const GAP_X = 24;
const GAP_Y = 24;
const GRID_LEFT = 36;
const GRID_TOP = 390;

export const PERSON_POSITIONS: Record<string, { x: number; y: number }> = {
  "person-miriam": { x: 60, y: 48 },
  "person-sarah": { x: 264, y: 48 },
  "person-tom": { x: 468, y: 48 },
  "person-david": { x: 162, y: 210 },
  "person-em": { x: 366, y: 210 },
};

export const defaultEvidencePosition = (
  index: number
): { x: number; y: number } => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: GRID_LEFT + col * (CARD_WIDTH + GAP_X),
    y: GRID_TOP + row * (CARD_HEIGHT + GAP_Y),
  };
};

export const BOARD_WIDTH = 1080;

export const boardCanvasHeight = (evidenceCount: number): number => {
  const rows = Math.ceil(evidenceCount / COLS) || 1;
  return GRID_TOP + rows * (CARD_HEIGHT + GAP_Y) + 40;
};
