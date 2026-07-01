import { PuzzleId } from "../game/progress";
import { ClueMarker } from "../game/campaign";

export type UnlockCondition =
  | { type: "always" }
  | { type: "flag"; flag: string }
  | { type: "puzzleSolved"; puzzleId: PuzzleId }
  | { type: "evidenceOpened"; evidenceId: string }
  | { type: "allOf"; conditions: UnlockCondition[] }
  | { type: "anyOf"; conditions: UnlockCondition[] };

export interface UnlockContext {
  flags: Record<string, boolean>;
  discoveredEvidenceIds?: string[];
  solvedPuzzleIds?: PuzzleId[];
}

export interface VFolder {
  id: string;
  name: string;
  parentId: string | null;
  unlock: UnlockCondition;
  /** Image path under /public. Defaults to /icons/folder.png when unset (see Explorer). */
  icon?: string;
}

export interface VFile {
  id: string;
  name: string;
  folderId: string;
  kind: "text" | "cipher" | "image" | "audio" | "help";
  content: string;
  unlock: UnlockCondition;
  evidenceId?: string;
  /** Collectable clue phrases inside this file's body (Case Reconstruction tokens). */
  clues?: ClueMarker[];
  alias?: string;
  size?: string;
  modified?: string;
  reference?: string;
  caption?: string;
  camera?: string;
  dimensions?: string;
  location?: string;
  taken?: string;
  comment?: string;
  /** Only set for kind === "cipher". Normalized (lowercase, no spaces) expected answer. */
  answer?: string;
  /** Only set for kind === "cipher". Flag set on a correct answer; also used to gate folders. */
  unlocksFlag?: string;
  /**
   * A cipher whose answer cannot be written down. The true name resists the
   * keyboard — the substitution the player learned to trust refuses to hold.
   */
  untypeable?: boolean;
  /** Opening this file pushes the desktop's corruption to (at least) this stage. */
  raisesCorruptionTo?: number;
  /** Opening this file sets a flag — used to unlock the finale, etc. */
  setsFlagOnOpen?: string;
}

const isUnlockContext = (
  value: UnlockContext | Record<string, boolean>
): value is UnlockContext =>
  typeof (value as UnlockContext).flags === "object" &&
  (value as UnlockContext).flags !== null;

export function isUnlocked(
  condition: UnlockCondition,
  contextOrFlags: UnlockContext | Record<string, boolean>
): boolean {
  const context: UnlockContext = isUnlockContext(contextOrFlags)
    ? contextOrFlags
    : { flags: contextOrFlags };
  switch (condition.type) {
    case "always":
      return true;
    case "flag":
      return Boolean(context.flags[condition.flag]);
    case "puzzleSolved":
      return Boolean(context.solvedPuzzleIds?.includes(condition.puzzleId));
    case "evidenceOpened":
      return Boolean(
        context.discoveredEvidenceIds?.includes(condition.evidenceId)
      );
    case "allOf":
      return condition.conditions.every((child) => isUnlocked(child, context));
    case "anyOf":
      return condition.conditions.some((child) => isUnlocked(child, context));
  }
}

/** Straight substitution cipher used throughout Sarah's research notes. */
export const runicAlphabet: Record<string, string> = {
  a: "ᚨ",
  b: "ᛒ",
  c: "ᚲ",
  d: "ᛞ",
  e: "ᛖ",
  f: "ᚠ",
  g: "ᚷ",
  h: "ᚺ",
  i: "ᛁ",
  j: "ᛃ",
  k: "ᛣ",
  l: "ᛚ",
  m: "ᛗ",
  n: "ᚾ",
  o: "ᛟ",
  p: "ᛈ",
  q: "ᛩ",
  r: "ᚱ",
  s: "ᛋ",
  t: "ᛏ",
  u: "ᚢ",
  v: "ᚡ",
  w: "ᚹ",
  x: "ᛪ",
  y: "ᚤ",
  z: "ᛉ",
};

/** Encode plain text into the runic alphabet — keeps cipher content typo-proof. */
export const toRunic = (s: string): string =>
  s
    .toLowerCase()
    .split("")
    .map((c) => runicAlphabet[c] ?? c)
    .join("");

export const folders: VFolder[] = [
  {
    id: "my-computer",
    name: "My Computer",
    parentId: null,
    unlock: { type: "always" },
  },
  {
    id: "c",
    name: "Local Disk (C:)",
    parentId: "my-computer",
    unlock: { type: "always" },
    icon: "/icons/drive.png",
  },
  { id: "windows", name: "Windows", parentId: "c", unlock: { type: "always" } },
  {
    id: "program-files",
    name: "Program Files",
    parentId: "c",
    unlock: { type: "always" },
  },
  { id: "users", name: "Users", parentId: "c", unlock: { type: "always" } },
  {
    id: "sarah",
    name: "Sarah Bishop",
    parentId: "users",
    unlock: { type: "always" },
  },
  {
    id: "pictures",
    name: "My Pictures",
    parentId: "sarah",
    unlock: { type: "always" },
    icon: "/icons/folder-special.png",
  },
  {
    id: "work",
    name: "Work",
    parentId: "sarah",
    unlock: { type: "always" },
  },
  {
    id: "downloads",
    name: "Downloads",
    parentId: "sarah",
    unlock: { type: "always" },
  },
  {
    id: "restricted",
    name: "RECOVERED",
    parentId: "sarah",
    unlock: {
      type: "anyOf",
      conditions: [
        { type: "puzzleSolved", puzzleId: "lot_114" },
        { type: "flag", flag: "act1_recovered_partial" },
      ],
    },
  },
  {
    id: "chapter-seven",
    name: "CHAPTER_SEVEN",
    parentId: "restricted",
    unlock: { type: "puzzleSolved", puzzleId: "counting_audio" },
  },
  {
    id: "lineage-dossiers",
    name: "LINEAGE",
    parentId: "restricted",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
  },
];

export const files: VFile[] = [
  // --- Personal photographs: Sarah before she becomes a case file ----------
  {
    id: "photo_sarah_office",
    name: "late_again.png",
    folderId: "pictures",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "photo_sarah_office",
    alias: "LATEAG~1.PNG",
    size: "2.8 MB",
    modified: "2026-02-17 23:48",
    taken: "2026-02-17 23:42",
    dimensions: "1456 × 1092",
    camera: "Em's compact camera / flash off",
    location: "Orne Library, basement archive",
    caption: "Em: “Proof that you do, technically, still exist.”",
    comment:
      "Sarah kept this one even though she hated having her picture taken. The beige computer behind her belonged to Miriam.",
    content: "/photos/sarah_archive_office_2026.png",
  },
  {
    id: "photo_miriam_sarah",
    name: "mom_and_me_1998.png",
    folderId: "pictures",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "photo_miriam_sarah_1998",
    alias: "MOMAND~1.PNG",
    size: "3.1 MB",
    modified: "2026-02-02 01:14",
    taken: "1998-07-11 / scanned 2026-02-02",
    dimensions: "1456 × 1092",
    camera: "35mm point-and-shoot / scanner unknown",
    location: "Orne Library, basement archive",
    caption: "Miriam and Sarah. Seven weeks before the Whateley deposit arrived.",
    comment:
      "The monitor and tower in this photograph are the machine now being viewed. Sarah was seven when Miriam disappeared.",
    content: "/photos/miriam_sarah_1998.png",
  },
  {
    id: "photo_sarah_em_coast",
    name: "innsmouth_trip.png",
    folderId: "pictures",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "photo_sarah_em_coast",
    alias: "INNSMO~1.PNG",
    size: "2.6 MB",
    modified: "2025-11-04 18:20",
    taken: "2025-11-02 15:06",
    dimensions: "1456 × 1092",
    camera: "Em's compact camera / auto",
    location: "North shore, outside Innsmouth",
    caption: "Sarah and Em. The trip where Sarah promised not to make everything research.",
    comment:
      "Em says the vertical shape offshore is an old piling. She does not remember seeing it when the photograph was taken.",
    content: "/photos/sarah_em_coast_2025.png",
  },
  {
    id: "photo_sarah_tom",
    name: "tom_after_symposium.png",
    folderId: "pictures",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "photo_sarah_tom_2024",
    alias: "TOMAF~1.PNG",
    size: "2.9 MB",
    modified: "2024-10-19 17:31",
    taken: "2024-10-19 17:24",
    dimensions: "1536 × 1024",
    camera: "Tom's digital camera / self-timer",
    location: "Miskatonic University, Orne Library steps",
    caption: "Tom and Sarah after the Special Collections symposium.",
    comment:
      "Tom wrote on the printout: “You survived questions, lukewarm coffee, and Professor Armitage's slides.”",
    content: "/photos/sarah_tom_campus_2024.png",
  },
  {
    id: "photo_bishop_birthday",
    name: "dads_65th.png",
    folderId: "pictures",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "photo_bishop_birthday_2025",
    alias: "DADS65~1.PNG",
    size: "3.0 MB",
    modified: "2025-08-24 21:08",
    taken: "2025-08-24 19:46",
    dimensions: "1536 × 1024",
    camera: "Em's compact camera / kitchen timer",
    location: "Bishop family home, Arkham",
    caption: "Dad's 65th. Sarah made it before the candles burned down.",
    comment:
      "Em renamed the file three times before settling on this. The original name was everybody_act_normal.png.",
    content: "/photos/bishop_birthday_2025.png",
  },

  // --- Act 1: the person (always visible in Sarah's home folder) ------------
  {
    id: "paint_doodles",
    name: "meeting_notes.bmp",
    folderId: "pictures",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "paint_doodles",
    alias: "MEETIN~1.BMP",
    size: "812 KB",
    modified: "2026-02-06 14:22",
    caption: "Sarah's extremely serious notes from the quarterly collections meeting.",
    comment:
      "Three sea monsters, a coffee cup and a caricature labeled PROFESSOR A. None of them are evidence.",
    content: "/photos/sarah_meeting_doodles.png",
  },
  {
    id: "photo_sarah_bus",
    name: "groceries_on_the_7.png",
    folderId: "pictures",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "photo_sarah_bus_2025",
    alias: "GROCER~1.PNG",
    size: "2.1 MB",
    modified: "2025-03-08 18:41",
    taken: "2025-03-08 18:37",
    dimensions: "1456 × 1092",
    camera: "Em's compact camera / auto",
    location: "Arkham route 7 bus",
    caption: "Em: “She did occasionally leave the archive.”",
    comment:
      "Sarah bought ingredients for Dad's chowder and still forgot the thyme.",
    content: "/photos/sarah_bus_2025.png",
  },
  {
    id: "whateley_accession_card",
    name: "whateley_card_1998.png",
    folderId: "work",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "whateley_accession_card",
    alias: "WHATEC~1.PNG",
    size: "2.1 MB",
    modified: "2026-02-02 01:20",
    taken: "1998-08-29 / scanned 2026-02-02",
    dimensions: "1536 × 1024",
    camera: "Orne Library flatbed scanner",
    location: "Whateley accession drawer",
    caption: "The original accession card. The Volume II field was never completed.",
    comment:
      "Blue pencil and the handwritten arrow are both attributed to Miriam Bishop.",
    content: "/artifacts/whateley_accession_card_1998.png",
  },
  {
    id: "miriam_notebook_scan",
    name: "miriam_working_notes_1998.png",
    folderId: "work",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "miriam_notebook",
    alias: "MIRIAM~2.PNG",
    size: "2.0 MB",
    modified: "2026-02-02 01:22",
    taken: "1998-09-03 / scanned 2026-02-02",
    dimensions: "1536 × 1024",
    camera: "Orne Library flatbed scanner",
    location: "Miriam Bishop accession notebook",
    caption: "Working notes ending on September 3, 1998.",
    comment:
      "The final catalog field says LEAVE BLANK. Sarah kept the tomato drawing with the scan.",
    content: "/artifacts/miriam_working_notebook_1998.png",
  },
  {
    id: "dad_recipe",
    name: "dads_chowder.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "dad_recipe",
    alias: "DADSCH~1.TXT",
    content: `DAD'S CHOWDER — version Sarah can actually follow

2 potatoes, not "some potatoes"
1 onion
milk
thyme
NO clams from the gas station, regardless of what Tom says

Dad's note: call me while it simmers. Twenty minutes is enough time to return a phone call.

Sarah added underneath:
Sunday. I mean it this time.`,
  },
  {
    id: "lecture_draft",
    name: "lecture_draft.txt",
    folderId: "work",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "lecture_draft",
    alias: "LECTUR~1.TXT",
    clues: [
      { tokenId: "time-six-thirty", snippet: { en: "6:30", "pt-BR": "18:30" } },
      {
        tokenId: "intent-go-home",
        snippet: {
          en: "call Em from the bus",
          "pt-BR": "ligar para Em do ônibus",
        },
      },
    ],
    content: `SPECIAL COLLECTIONS 204 — draft

The catalogue is not the object. It is an argument about where the object belongs.

[add less boring example here]
[ask Tom for projector cable]
[leave by 6:30. call Em from the bus.]

Closing question:
When a description survives longer than the thing it describes, which one becomes the original?`,
  },
  {
    id: "solitaire_save",
    name: "SOLITAIRE.SAV",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "solitaire_save",
    alias: "SOLITA~1.SAV",
    content: `[Windows Solitaire saved game]

Games played: 412
Games won: 17
Current game: hopeless

Tom's comment, appended in an invalid save field:
"At some point this stops being persistence and becomes a cry for help."

Sarah's reply:
"Says the man who keeps opening the same disk image."`,
  },
  {
    id: "midi_collection",
    name: "playlist.m3u",
    folderId: "downloads",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "midi_collection",
    alias: "PLAYLI~1.M3U",
    content: `C:\\WINDOWS\\MEDIA\\passport.mid
C:\\WINDOWS\\MEDIA\\museum_after_dark.mid
C:\\WINDOWS\\MEDIA\\em_sent_this_one.mid
C:\\WINDOWS\\MEDIA\\track_07.mid

[track_07 has no file on disk. Its duration is listed as 24:00:00.]`,
  },
  {
    id: "maintenance_record",
    name: "facilities_ticket_0311.txt",
    folderId: "work",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "maintenance_record",
    alias: "FACILI~1.TXT",
    clues: [
      {
        tokenId: "place-under-workstation",
        snippet: {
          en: "beneath archival workstation",
          "pt-BR": "sob a workstation",
        },
      },
      {
        tokenId: "object-pipe",
        snippet: {
          en: "No active supply or drainage line",
          "pt-BR": "Nenhuma linha de água ou drenagem",
        },
      },
      { tokenId: "place-ceiling", snippet: { en: "Ceiling", "pt-BR": "Teto" } },
      { tokenId: "object-hvac", snippet: { en: "air handler", "pt-BR": "ar-condicionado" } },
    ],
    content: `MISKATONIC FACILITIES / TICKET F-2026-0311-88

Location: Orne Library B2 / Bishop office
Complaint: damp carpet beneath archival workstation

Ceiling, wall, radiator, window and air handler inspected. No active supply or drainage line enters the room. Moisture boundary was circular and centered beneath SB-ARCHIVE-02.

Sample conductivity exceeded building water. Ticket reassigned to Special Collections after supervisor instruction.

Status: CLOSED — ADMINISTRATIVE`,
  },
  {
    id: "office_frames",
    name: "office_frames_11_13.png",
    folderId: "work",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "office_frames_11_13",
    alias: "FRAME1~1.PNG",
    size: "2.4 MB",
    modified: "2026-03-19 08:16",
    taken: "2026-03-19 08:13 / 08:15",
    dimensions: "1536 × 1024 contact sheet",
    camera: "Miskatonic Campus Security / evidence camera 04",
    location: "Orne Library, basement archive B2",
    caption: "Frames 11 and 13. The monitor is dark and the chair is empty in both.",
    comment:
      "Frame 12, taken between these photographs, contains the seated reflection.",
    content: "/photos/office_frames_11_13.png",
  },
  {
    id: "diary",
    name: "diary.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "diary",
    alias: "DIARY.TXT",
    size: "7 KB",
    clues: [
      {
        tokenId: "cause-deliberately-sent",
        snippet: {
          en: "someone made sure it came back",
          "pt-BR": "alguém fez questão de que ele voltasse",
        },
      },
    ],
    content: `RESEARCH JOURNAL — S. BISHOP

Feb 24 — Em called. I let it go to voicemail again and I hate that I did. She just wants to know I'm eating. I'll call her back when this lot is catalogued. I keep saying that.

March 2 — Acquired the second volume today. The bookseller wouldn't meet my eyes when he handed it over. Said the previous owner "stopped coming around." I didn't ask what that meant. This is the volume Mom listed in her '98 notes — the one nobody could ever find. I'm using her old machine to cross-check her files. It still smells like her office. The estate had my name and address on file before I ever inquired — someone made sure it came back to a Bishop.

March 9 — The cross-references check out. Three separate sources, three different centuries, the same coastline. Innsmouth isn't the only one. R'lyeh isn't a metaphor.

March 14 — I haven't slept. Every time I close my eyes I hear it counting. Not words. Counting.

March 15 — Found something in the margins of the second volume, not printed, written by hand. I copied a few lines into what_i_found.txt before I noticed: the handwriting is mine. I don't remember writing it. The same alphabet recurs throughout chapter seven. If I'm right about the cipher, the translation key is straightforward, just tedious.

March 16 —`,
  },
  {
    id: "todo",
    name: "to_do.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "todo",
    content: `- call Em back (actually do it)
- coffee, lightbulbs, more paper towels
- ask Tom to cover Thursday seminar
- replace the rug under the desk?? second time this week it's damp. building says no leaks above me.
- the carpet smells like the beach. I grew up three hours from the nearest beach.
- finish ch. 7 transcription
- sleep`,
  },
  {
    id: "miriam",
    name: "mom_1998.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "miriam_1998",
    alias: "MOM_1998.TXT",
    content: `[Recovered from Mom's old user profile. This is why I keep the machine running. Half of it only exists here.]

M. BISHOP — ACCESSION NOTES, Whateley deposit, received 1998-08-29

"Vol. II not present in the crate. Cataloguer (myself) to follow up re: the second volume — see marginalia in Vol. I, ch. 7. The hand in the margins is not the printer's. It answers questions I have not yet written down.

If anyone reads this after me: the counting is not a countdown. Do not finish the —"

[entry dated 1998-09-03. Mom was reported missing eleven days later, on 1998-09-14. They never found the second volume. I did. It came as Lot 114.]`,
  },
  {
    id: "miriam_letter",
    name: "to_robert_1998.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "miriam_letter_1998",
    alias: "TORICH~1.TXT",
    content: `[Recovered from an old local mail archive on Mom's profile — a sent copy she kept for herself.]

To: r.armitage@miskatonic-research.org
From: m.bishop@miskatonic-research.org
Date: 1998-08-31
Subject: the damp books

Robert — you'll tell me I'm being dramatic about a crate of mildewed paper, and you're probably right, you usually are, it's infuriating.

Vol. I keeps directing me backward, toward a second volume the donor's estate swears was never separated from the first. I don't believe in books that lie about their own table of contents, but here we are.

If Vol. II turns up, I want a second opinion in the room before I open it. Preferably yours, since you're the only one in this department who reads marginalia for a living and doesn't flinch.

Tell Sarah I said the tomato plant is hers now if I don't get home before it dies. She'll know what that means. She's seven, not stupid.

— M.`,
  },
  {
    id: "police_report",
    name: "incident_report.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "incident_report",
    alias: "INCIDE~1.TXT",
    clues: [
      {
        tokenId: "place-window",
        snippet: { en: "Window painted shut", "pt-BR": "Janela lacrada por tinta" },
      },
    ],
    content: `MISKATONIC CAMPUS SECURITY — INCIDENT 2026-0316-4
SUBJECT: Bishop, S. (faculty, Special Collections)

Responding to welfare check requested by colleague (T. Alvarez). Office door locked from the inside; no other egress. Window painted shut, intact. Subject not present.

Standing water on the floor beneath the desk, approx. 2 cm, no visible source. Field-tested: saline. Consistent with seawater. Nearest coast 180+ km.

Computer powered on at time of entry. Screen showed a single text file. Responding officer notes the file's modification date as the day AFTER entry. Attributed to a clock error.

Case open. No signs of forced entry or struggle.`,
  },
  {
    id: "notes",
    name: "borrower_index.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "borrower_index",
    alias: "BORROW~1.TXT",
    clues: [
      { tokenId: "family-whateley", snippet: { en: "Whateley", "pt-BR": "WHATELEY" } },
      { tokenId: "family-marsh", snippet: { en: "Marsh", "pt-BR": "MARSH" } },
      { tokenId: "family-bishop", snippet: { en: "Bishop", "pt-BR": "BISHOP" } },
    ],
    content: `WHATELEY DEPOSIT — RESTRICTED READER INDEX

01. Dyer
02. Whateley
03. Akeley
04. Gilman
05. Carter
06. Marsh
07. Olmstead
08. Peaslee
09. Bishop

The dates in the old ledger are unreliable. Preserve the order of the names.
Miriam underlined that sentence twice.`,
  },
  {
    id: "cipher_1",
    name: "margin_ch7.enc",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "palimpsest" },
    evidenceId: "margin_ciphertext",
    alias: "MARGIN~1.ENC",
    content: `TRANSCRIPTION — VOL. II, CH. 7

XMWBC TMVEM LDQDV ZSQRW LZEXQ DVVCA GVKVA YQAEW TPMGJ

Sarah's note in the margin:
"Not substitution. The alphabet moves under the word. G.B. knew why.
The key is not mine. It belongs to the first cataloguer."`,
  },

  // --- Act 2: the pattern (RECOVERED, unlocked by cipher_1) -----------------
  {
    id: "lot_114_scan",
    name: "114_verso.tif",
    folderId: "restricted",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "lot_114_scan",
    alias: "114VER~1.TIF",
    size: "14.8 MB",
    modified: "{TOMORROW} 03:12",
    reference: "A1",
    content: "/artifacts/114-verso.png",
  },
  {
    id: "counting_audio",
    name: "counting.wav",
    folderId: "restricted",
    kind: "audio",
    unlock: { type: "puzzleSolved", puzzleId: "margin_cipher" },
    evidenceId: "counting_audio",
    alias: "COUNTI~1.WAV",
    size: "43.1 MB",
    modified: "{TOMORROW} 03:13",
    reference: "C4",
    content: "/artifacts/counting.wav",
  },
  {
    id: "hydrographic_chart",
    name: "coastline_overlay.png",
    folderId: "restricted",
    kind: "image",
    unlock: { type: "puzzleSolved", puzzleId: "counting_audio" },
    evidenceId: "hydrographic_chart",
    alias: "COASTL~1.PNG",
    size: "3.1 MB",
    modified: "2026-03-15 02:08",
    taken: "1951 chart / annotations 1798–2014 / scanned 2026",
    dimensions: "1536 × 1024",
    camera: "Miskatonic map scanner",
    location: "Hydrographic restricted drawer",
    caption: "Seven dates converge on a location scraped from the chart.",
    comment:
      "Each annotation uses a different hand. The 1998 mark matches Miriam's accession pencil.",
    content: "/artifacts/innsmouth_hydrographic_chart.png",
  },
  {
    id: "manuscript",
    name: "DO_NOT_OPEN.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "do_not_open",
    alias: "DONOTO~1.TXT",
    content: `[The text resists being read. Every time your eyes settle on a line, it has already become a different line.]

She didn't disappear. She finished the working. The date on this file is {TOMORROW}.

If you are reading this, the desktop is already starting to remember things that haven't happened yet. Close it now, while you still believe you decided to.`,
  },
  {
    id: "counting",
    name: "counting.wav — transcript.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "counting_transcript",
    content: `[Audio recovered from the office. 4 min 11 sec. Auto-transcribed; the second voice could not be rendered to text.]

S. BISHOP: ...okay. It's the fourteenth. I'm recording this so there's proof I'm not — [pause] — it's doing it again. Listen.

[A counting. Sarah's voice joins it, a half-second behind, as if reading along with something she can hear but the microphone cannot.]

S. BISHOP (whisper): ...that's not how many days. That's how many people.`,
  },
  {
    id: "office_after",
    name: "office_after.jpg — caption.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "office_after",
    content: `[Image metadata: taken 03/19 — three days after the office was sealed. Photographer field stripped; device ID resolves to Campus Security evidence camera 04.]

An empty office. Chair pushed back. The damp patch under the desk, darker now.

In the black mirror of the powered-off monitor there is a reflection of someone sitting at the desk, facing the camera.

The office was empty when this was taken. The monitor was off. You are looking at it through a monitor that is on.`,
  },
  {
    id: "office_after_photo",
    name: "office_after.jpg",
    folderId: "restricted",
    kind: "image",
    unlock: { type: "always" },
    evidenceId: "office_after_photo",
    alias: "OFFICE~1.JPG",
    size: "1.7 MB",
    modified: "{TOMORROW} 08:14",
    taken: "2026-03-19 08:14",
    dimensions: "1536 × 1024",
    camera: "Miskatonic Campus Security / evidence camera 04",
    location: "Orne Library, basement archive B2",
    caption: "Evidence photograph 2026-0316-4 / frame 12.",
    comment:
      "The evidence index describes the monitor as powered off. The seated reflection does not appear in frames 11 or 13.",
    content: "/photos/office_after_2026.png",
  },
  {
    id: "access_log",
    name: "access_log.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "future_access_log",
    alias: "ACCESS~1.TXT",
    modified: "{TOMORROW} 03:14",
    reference: "B9",
    clues: [
      { tokenId: "time-0314", snippet: { en: "03:14", "pt-BR": "03:14" } },
    ],
    content: `FILE ACCESS LOG — sequence incomplete

{TOMORROW} 03:12  TRANSFORM  114VER~1.TIF /MIRROR
{TOMORROW} 03:13  PLAY       COUNTI~1.WAV /LEFT /REVERSE
{TOMORROW} 03:14  OPEN       THENAM~1.TXT
{TOMORROW} 03:15  RUN        INDEX.EXE /JOIN [4 REFERENCES LOST]

The aliases are intact. The long filenames were overwritten.`,
  },
  {
    id: "while_you_were_out",
    name: "while_you_were_out.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "flag", flag: "returned_after_absence" },
    evidenceId: "absence_note",
    content: `You were gone {ELAPSED_HOURS} hours.

It was not.

While the window was closed, the files kept their appointments. Something was catalogued in your absence. The next entry is dated {TOMORROW} and the cataloguer's initials are yours.`,
  },
  // --- Act 2/3: chapter seven (unlocked by cipher_2) -----------------------
  {
    id: "the_pattern",
    name: "the_pattern.txt",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "lineage_pattern",
    content: `SARAH'S WORKING NOTES — DO NOT FILE BY YEAR

1798 → 1863 → 1912 → 1949 → 1977 → 1998 → 2014 → [blank]

The interval is what survives, not the date.
Each gap remembers roughly three quarters of the gap before it.

There is already a catalogue record for the blank year.
It should not exist yet.`,
  },
  {
    id: "second_ledger",
    name: "second_ledger.txt",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "second_ledger",
    content: `[Found folded inside the back cover of Vol. II. Not typed — Sarah's hand, correcting itself twice.]

I thought there might be a second name hidden the same way. There isn't. I checked three times and got the same eight pairs every time, which is worse than getting different ones.

(9,3) (6,5) (1,3) (3,2) (4,6) (7,1) (2,1) (8,4)

I'm not writing down what it spells. If you already found the first name, you'll get there faster than I did.`,
  },
  {
    id: "toms_recording",
    name: "toms_last_message.txt",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "tom_last_message",
    clues: [
      {
        tokenId: "person-observer",
        snippet: { en: "last user", "pt-BR": "último usuário" },
      },
      {
        tokenId: "person-tom-tok",
        snippet: { en: "my name", "pt-BR": "T. Alvarez" },
      },
    ],
    content: `[Text file left by T. Alvarez, dated 03/23, the day he tried to upload the disk image and then stopped answering.]

I made a forensic copy of Sarah's drive to send to people who'd take it seriously. Before I could upload it I opened the image to verify it.

The disk image already contained this file. The one I'm typing now. It listed my name in the access log as the last user.

I never logged in. I'm not going to finish uploading this. If it reaches you anyway, then it didn't reach you because I sent it.

Don't look for the next file. You'll open it anyway. I know because the log already says you did.`,
  },
  {
    id: "the_name",
    name: "the_name.txt",
    folderId: "chapter-seven",
    kind: "cipher",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "the_name",
    alias: "THENAM~1.TXT",
    size: "0 bytes",
    modified: "{TOMORROW} 03:14",
    untypeable: true,
    clues: [
      {
        tokenId: "cause-act-of-reconstruction",
        snippet: {
          en: "person trying to understand it",
          "pt-BR": "pessoa tentando entendê-lo",
        },
      },
    ],
    content: `The last thing in chapter seven is its name. Not "R'lyeh" — that was Sarah's polite approximation, a word small enough to fit in a footnote. This is the thing underneath it.

The runes will not hold still long enough to copy. Try to write the name below and see for yourself.

Chapter seven is not in the book. Chapter seven is the person trying to understand it.`,
  },
  {
    id: "index_help",
    name: "INDEX.HLP",
    folderId: "chapter-seven",
    kind: "help",
    unlock: { type: "puzzleSolved", puzzleId: "future_log" },
    evidenceId: "index_help",
    alias: "INDEX.HLP",
    content: `MISKATONIC RECOVERY INDEXER 0.7

The indexer does not accept names. It joins object references already held by
the mounted image.

Syntax:
  INDEX /JOIN <REF-REF-REF-REF>

Reference order is chronological. Object properties may change after a
successful future-log replay.

RECOVERY NOTE:
RESTORE writes the recovered owner into the source field. The current observer
is retained in the archive field so that the relay remains occupied.

HALT closes the current relay without recovering its unresolved source.`,
  },

  // --- Historical branch: four custodians and the damaged 2014 mirror -----
  {
    id: "lineage_1863",
    name: "1863_gazette_clipping.txt",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "lineage_1863",
    alias: "1863GA~1.TXT",
    clues: [
      {
        tokenId: "detail-water-damage",
        snippet: {
          en: "ordinary water damage",
          "pt-BR": "dano comum por água",
        },
      },
    ],
    content: `ARKHAM GAZETTE / 14 OCTOBER 1863 / CLIPPING 7B

Eliza Marsh, temporary clerk to the Orne bequest, was found alone in the west catalogue room after the night bell. The room was locked. Salt water covered the floor beneath her writing desk, although the ceiling and windows were dry.

The bursar entered "ordinary water damage" in the expense ledger. Marsh crossed out those words and wrote: IT CAME FROM THE ENTRY, NOT THE ROOM.

The following morning, one folio and the clerk were both absent.`,
  },
  {
    id: "lineage_1912",
    name: "1912_whateley_letter.txt",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "lineage_1912",
    alias: "1912WH~1.TXT",
    clues: [
      { tokenId: "year-1912", snippet: { en: "1912", "pt-BR": "1912" } },
      {
        tokenId: "cause-clerical-error",
        snippet: {
          en: "clerical mix-up",
          "pt-BR": "engano de catalogação",
        },
      },
      {
        tokenId: "detail-stolen-volume",
        snippet: { en: "stolen volume", "pt-BR": "volume roubado" },
      },
    ],
    content: `LETTER / R. WHATELEY TO ORNE SPECIAL COLLECTIONS / 1912

You may call the missing second book a clerical mix-up or a stolen volume if that makes your accounts easier. Neither description explains why my father's card lists the name of a reader who had not yet been born.

Do not complete the empty line. The line is not waiting for the book. It is waiting for whoever describes it.`,
  },
  {
    id: "lineage_1949",
    name: "1949_night_desk_log.txt",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "lineage_1949",
    alias: "1949NI~1.TXT",
    clues: [
      { tokenId: "year-1949", snippet: { en: "1949", "pt-BR": "1949" } },
    ],
    content: `ORNE LIBRARY / NIGHT DESK LOG / 1949

H. Akeley returned the coastal ledger without signing it back into custody. She asked that its entries remain arranged by family name, not date.

At 02:11 the pneumatic tube delivered a reader card bearing Akeley's handwriting. She was standing beside me when it arrived.

The card named the next custodian only as BISHOP and left the accession field blank.`,
  },
  {
    id: "lineage_1977",
    name: "1977_bishop_transfer.txt",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "lineage_1977",
    alias: "1977BI~1.TXT",
    clues: [
      { tokenId: "year-1977", snippet: { en: "1977", "pt-BR": "1977" } },
      { tokenId: "time-1742", snippet: { en: "17:42", "pt-BR": "17:42" } },
      {
        tokenId: "detail-incomplete-ledger",
        snippet: {
          en: "intentionally incomplete ledger",
          "pt-BR": "livro-razão incompleto de propósito",
        },
      },
    ],
    content: `INTERNAL TRANSFER / 7 NOVEMBER 1977 / 17:42

Assistant cataloguer Miriam Bishop accepted one box from the closed Akeley desk. Contents: three reader cards, a salt-stained map and an intentionally incomplete ledger.

M. Bishop refused to sign the final catalogue line. Her supervisor wrote "family superstition" beside the omission.

In 1998, Miriam requested this exact box by a shelfmark that had never been assigned.`,
  },
  {
    id: "victim_2014",
    name: "2014_offsite_personnel_match.txt",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "victim_2014",
    alias: "2014OF~1.TXT",
    clues: [
      {
        tokenId: "status-deceased",
        snippet: { en: "presumed deceased", "pt-BR": "presumida morta" },
      },
    ],
    content: `OFF-SITE MIRROR / PERSONNEL CORRELATION / 18 MAY 2014

Badge 14-EV belonged to Eleanor Vale, night digitization contractor. Vale disappeared during a checksum failure at 03:14. Campus Security classified her as presumed deceased after seawater was found inside the locked mirror room.

The maintenance database redacted OWNER, but the same badge authenticated again on 19 May — one day after Vale vanished.

Whether that later user was Eleanor Vale is unresolved. The archive only confirms that something answered with her credential.`,
  },
  {
    id: "em_investigation",
    name: "em_private_trace.txt",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "em_investigation",
    alias: "EMPRIV~1.TXT",
    clues: [
      {
        tokenId: "intent-flee-arkham",
        snippet: {
          en: "leave Arkham unannounced",
          "pt-BR": "deixar Arkham sem avisar",
        },
      },
      {
        tokenId: "status-inside-volume",
        snippet: {
          en: "sealed inside Volume II",
          "pt-BR": "presa no Volume II",
        },
      },
    ],
    content: `EM BISHOP / PRIVATE TRACE / NOT SENT

Bad explanations I tried because they hurt less:

1. Sarah meant to leave Arkham unannounced.
2. Tom staged the office.
3. Mom and Sarah are sealed inside Volume II.

None survives the phone records. Sarah bought groceries, promised Dad Sunday and scheduled Monday's lecture. Tom was on the east stair camera while her locked office filled with water.

The detail I cannot dismiss: when we were children, Sarah asked why Mom counted family names in her sleep. Last week Sarah asked me the same question in the same words. She did not remember asking it the first time.

The shape in our coast photograph is not a piling. I found it in Mom's 1977 map.`,
  },

  // --- Ending reveal: RESTORE SARAH ---------------------------------------
  {
    id: "welcome_back",
    name: "welcome_back.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "flag", flag: "ending_restore" },
    content: `[New documents found in this account. Owner: {PLAYER}. Created: {TOMORROW}.]

Thank you. I'm sorry — I didn't know there had to be someone on this side for me to climb out of it.

These are your files now. They're dated {TOMORROW}, because that's where you are from in here. It's not so bad. You get used to being one day ahead of everyone who loved you.

I'll watch for you. The way you watched for me.

— S.`,
  },
  {
    id: "miriam_draft",
    name: "MIRIAM_DRAFT.PRN",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "flag", flag: "miriam_draft_arrived" },
    evidenceId: "miriam_draft",
    alias: "MIRIAM~1.PRN",
    modified: "{TOMORROW} 03:09",
    content: `[Recovered printer spool / author field M. BISHOP]

Robert —

The missing volume is not missing. Missing is how it prevents the next entry from being made.
I left the shelfmark incomplete because every complete description becomes an instruction.

If Sarah ever finds this, tell her I was trying to leave one blank space that did not ask to be filled.

[The print job is dated {TOMORROW}. The printer connected to this workstation was disposed of in 2004.]`,
  },
  {
    id: "record_2014",
    name: "2014_RECORD.DAT",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "future_log" },
    evidenceId: "record_2014",
    alias: "2014RE~1.DAT",
    clues: [
      {
        tokenId: "object-archive-field",
        snippet: { en: "WITNESS: ARCHIVE", "pt-BR": "TESTEMUNHA: ARQUIVO" },
      },
    ],
    content: `RECOVERY INDEX / DAMAGED ENTRY

INTERVAL: 2014
SOURCE: unresolved
OWNER: unresolved
WITNESS: ARCHIVE

The field does not contain a person.
The field contains the checksum of this record.

Validation result:
RECORD HAS READ ITSELF 1 TIME(S)`,
  },
  {
    id: "containment_utility",
    name: "LOOPBACK.EXE.txt",
    folderId: "downloads",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "future_log" },
    evidenceId: "containment_utility",
    alias: "LOOPBA~1.TXT",
    content: `LOOPBACK 0.3 — orphaned archive utility

Registers a mounted index as its own verification witness.

This program cannot name a target. It only provides the final INDEX switch:

  /WITNESS ARCHIVE

The archive identifier and operation remain the responsibility of the operator.`,
  },
  {
    id: "contain_help",
    name: "CONTAIN.HLP",
    folderId: "chapter-seven",
    kind: "help",
    unlock: { type: "flag", flag: "postgame_lore_ready" },
    alias: "CONTAI~1.HLP",
    content: `RELAY CONTAINMENT ADDENDUM

An occupied relay may be sealed only after its source index recognizes a nonhuman witness.

Syntax fragment:
  INDEX /SEAL <RELAY-ID> <WITNESS-SWITCH>

The relay identifier is preserved outside the mounted image.
The witness switch may exist in an obsolete download.

Containment is not recovery. No source will be returned.`,
  },
  {
    id: "seal_after",
    name: "RELAY_07.SEALED",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "flag", flag: "ending_seal" },
    content: `RELAY 07 / LOOPBACK STATUS

SOURCE: unresolved
ARCHIVE: SB-0316
WITNESS: SB-0316
RECIPIENTS: 3

The fourth field is empty again.

CHECKSUM BEFORE SEAL: 7A:11:07
CHECKSUM AFTER SEAL:  7A:11:08

No write operation was recorded.`,
  },
  {
    id: "case_correlations",
    name: "case_correlations.txt",
    folderId: "sarah",
    kind: "text",
    unlock: {
      type: "allOf",
      conditions: [
        { type: "flag", flag: "postgame_lore_ready" },
        {
          type: "anyOf",
          conditions: [
            { type: "flag", flag: "ending_restore" },
            { type: "flag", flag: "ending_shutdown" },
            { type: "flag", flag: "ending_seal" },
          ],
        },
      ],
    },
    content: `[Generated by the Recovery Indexer after six independent correlations were retained.]

LOT 114:
The second volume did not return to the Bishop family. It returned through them.

CATALOGUERS:
Miriam and Sarah occupy the same field in records twenty-eight years apart.
The field is not "owner." The damaged label may read "witness."

RELAY:
Alvarez created the copy, but the copy created its recipient. The chain of
custody begins after each person opens it.

No conclusion was recorded for the 2014 interval.
No physical recovery of Thomas Alvarez was recorded.
No external system has confirmed that Sarah Bishop returned.

The archive has marked these omissions as intentional.`,
  },
  {
    id: "expedition_tmp",
    name: "EXPEDITION.TMP",
    folderId: "deleted",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "deleted_expedition_fragment",
    alias: "EXPEDI~1.TMP",
    size: "1 KB",
    modified: "01/22/1931 06:17",
    content: `[Recovered from unallocated space. Original path unknown.]

DYER FIELD COPY / LAKE CAMP

Pabodie says the drill is sound. Danforth has stopped looking at the specimens
and started looking south. Gedney's cot was empty before the wind took the tent.

There are mountains behind the mountains. On clear mornings the second range
is closer than the first.

Audio note appended by unknown process:
TEKELI—LI / TEKELI—LI / TEKELI—LI

[The file's deletion timestamp is {TOMORROW}.]`,
  },
];
