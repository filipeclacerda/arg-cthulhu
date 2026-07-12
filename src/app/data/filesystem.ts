import { ClueMarker } from "../game/campaign";
import { OptionalDiscoveryId } from "../game/progress";
import {
  isUnlocked,
  UnlockCondition,
  UnlockContext,
} from "../game/unlock";

// Re-exported so existing importers keep working; new code should import the
// shared gating module (`src/app/game/unlock.ts`) directly.
export { isUnlocked };
export type { UnlockCondition, UnlockContext };

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
  /** Opening the final artifact completes one registered optional mission. */
  completesOptionalMission?: OptionalDiscoveryId;
  /** Recoverable data stored in an image thumbnail rather than its main pixels. */
  embeddedVariant?: {
    id: string;
    label: string;
    detail: string;
    setsFlag: string;
    evidenceId?: string;
  };
  /**
   * Diegetic transcript shown under the Media Player once an audio file has
   * been played. Distinct from `content` (the audio src path). English text
   * lives here; the pt-BR variant lives in `localizedNarrative.ts` under
   * `<fileId>_transcript`.
   */
  transcript?: string;
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
  {
    id: "floppy-a",
    name: "3½ Floppy (A:)",
    parentId: "my-computer",
    unlock: { type: "flag", flag: "tom_floppy_recovered" },
    icon: "/icons/drive.png",
  },
  { id: "windows", name: "Windows", parentId: "c", unlock: { type: "always" } },
  {
    id: "program-files",
    name: "Program Files",
    parentId: "c",
    unlock: { type: "always" },
  },
  // Preserve the historic `users` ID for saves, but render the tree as a
  // Windows 98 profile directory rather than a modern C:\\Users layout.
  { id: "users", name: "Profiles", parentId: "windows", unlock: { type: "always" } },
  {
    id: "observer-cache",
    name: "[CURRENT OBSERVER]",
    parentId: "users",
    unlock: { type: "flag", flag: "directory_gap_solved" },
  },
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
    // The first real investigative act — and only that act — opens the
    // recovered directory. Casefile findings never substitute for it.
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
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
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
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
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
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
  {
    id: "photo_sarah_em_kitchen",
    name: "after_dads_65th.png",
    folderId: "pictures",
    kind: "image",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
    evidenceId: "photo_sarah_em_kitchen_2025",
    alias: "AFTERD~1.PNG",
    size: "2.2 MB",
    modified: "2025-08-24 22:36",
    taken: "2025-08-24 22:31",
    dimensions: "1456 × 1092",
    camera: "Em's compact camera / kitchen flash",
    location: "Bishop family home, Arkham",
    caption: "After the birthday dishes. Em kept taking pictures until Sarah laughed.",
    comment:
      "A coast postcard on the fridge matches the shape Em later noticed in the Innsmouth photograph.",
    content: "/photos/sarah_em_kitchen_2025.png",
  },
  {
    id: "fridge_postcard_note",
    name: "fridge_postcard_note.txt",
    folderId: "pictures",
    kind: "text",
    unlock: {
      type: "evidenceOpened",
      evidenceId: "photo_sarah_em_kitchen_2025",
    },
    evidenceId: "fridge_postcard_note",
    alias: "FRIDGE~1.TXT",
    content: `EM'S PHOTO NOTE — added after Dad's birthday

The postcard on the fridge is from Mom's drawer, not from the Innsmouth trip.
Sarah said she kept it because the shoreline looked "misfiled."

Em's note, added later:
Same vertical shape. Same angle. Different year.

Sarah's reply in the file comment:
Then it was waiting before we were there.`,
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
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
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
    unlock: {
      // Optional human-context reward: two retained act-one findings surface
      // it early; the stage-3 milestone keeps it reachable without Casefile.
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "act1_recovered_partial" },
        { type: "puzzleSolved", puzzleId: "palimpsest" },
      ],
    },
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
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
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
    unlock: {
      // Optional human-context reward: two retained act-one findings surface
      // it early; the stage-3 milestone keeps it reachable without Casefile.
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "act1_recovered_partial" },
        { type: "puzzleSolved", puzzleId: "palimpsest" },
      ],
    },
    evidenceId: "midi_collection",
    alias: "PLAYLI~1.M3U",
    content: `C:\\WINDOWS\\MEDIA\\passport.mid
C:\\WINDOWS\\MEDIA\\museum_after_dark.mid
C:\\WINDOWS\\MEDIA\\em_sent_this_one.mid
C:\\WINDOWS\\MEDIA\\track_07.mid

[track_07 has no file on disk. Its duration is listed as 24:00:00.]`,
  },

  // --- Inert files: an archive is mostly junk. None of these are clues. ----
  {
    id: "junk_hp_readme",
    name: "README.TXT",
    folderId: "windows",
    kind: "text",
    unlock: { type: "always" },
    alias: "README.TXT",
    size: "4 KB",
    modified: "1998-05-11 09:00",
    content: `HP LASERJET 4L PRINTING SYSTEM FOR WINDOWS
Version 3.1 — Release Notes

1. INSTALLATION
Run SETUP.EXE from Disk 1. Do not remove the disk until prompted.

2. KNOWN ISSUES
- Envelope feed may require the straight-through paper path.
- TrueType fonts above 72pt may print with jagged edges at 300 dpi.
- If the printer produces a blank page after the test page, this is
  normal. Discard the blank page.

3. SUPPORT
See HPLJ4L.HLP for troubleshooting. Have your serial number ready.`,
  },
  {
    id: "junk_uninstall_log",
    name: "UNINST.LOG",
    folderId: "program-files",
    kind: "text",
    unlock: { type: "always" },
    alias: "UNINST.LOG",
    size: "2 KB",
    modified: "1999-01-04 14:12",
    content: `WinZip 6.3 SR-1 Uninstall Log

Removed: C:\\PROGRA~1\\WINZIP\\WINZIP32.EXE
Removed: C:\\PROGRA~1\\WINZIP\\WZ32.DLL
Removed: C:\\PROGRA~1\\WINZIP\\LICENSE.TXT
Skipped: C:\\PROGRA~1\\WINZIP\\ORDER.TXT (file in use)
Removed: shortcut "WinZip (Evaluation Version)"

Uninstall completed with 1 warning.`,
  },
  {
    id: "junk_partial_download",
    name: "MIDIMAKR.ZIP.partial",
    folderId: "downloads",
    kind: "text",
    unlock: { type: "always" },
    alias: "MIDIMA~1.PAR",
    size: "897 KB",
    modified: "2026-02-19 22:37",
    content: `[Incomplete download — 61% of 1.44 MB]

MIDIMAKER PRO 2.0 (SHAREWARE)
The remainder of this archive was never retrieved.

[The data cannot be opened. There is nothing wrong with it. It is simply unfinished.]`,
  },
  {
    id: "junk_receipts",
    name: "receipts_2025.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    alias: "RECEIP~1.TXT",
    content: `EXPENSES 2025 — for the reimbursement form I will absolutely fill in this time

02/11  archival sleeves (acid-free, 100ct) .... 34.90
02/11  cotton gloves ......................... 12.50
03/02  mileage, Boston conservation wkshp .... 41.20
04/17  replacement desk lamp bulb ............ 6.99
06/30  book cradle, foam ..................... 28.00
09/12  dehumidifier filter ................... 19.75
11/02  lunch, Innsmouth (personal — do not claim)

Total claimable: 143.34
Status: never submitted`,
  },
  {
    id: "junk_newsletter",
    name: "dept_newsletter_feb.txt",
    folderId: "work",
    kind: "text",
    unlock: { type: "always" },
    alias: "DEPTNE~1.TXT",
    content: `MISKATONIC SPECIAL COLLECTIONS — STAFF BULLETIN, FEBRUARY 2026

- The B-lot resurfacing is complete. Permit holders may resume parking.
- Reminder: the staff refrigerator is cleared on the last Friday of the month.
  Labeled containers are not exempt.
- Congratulations to Doris Pratt (Circulation) on thirty years of service.
  Cake in the staff room, Thursday, 3 PM.
- The spring colloquium schedule is posted outside Room 204.
- Facilities asks that space heaters be registered with the front office.

Submissions for the March bulletin are due by the 25th.`,
  },
  {
    id: "junk_config_bak",
    name: "CONFIG.BAK",
    folderId: "c",
    kind: "text",
    unlock: { type: "always" },
    alias: "CONFIG.BAK",
    size: "1 KB",
    modified: "1998-05-11 09:02",
    content: `DEVICE=C:\\WINDOWS\\HIMEM.SYS
DEVICE=C:\\WINDOWS\\EMM386.EXE NOEMS
DOS=HIGH,UMB
FILES=60
BUFFERS=40
DEVICEHIGH=C:\\CDROM\\OAKCDROM.SYS /D:MSCD001
LASTDRIVE=Z`,
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

March 9 — The cross-references check out. Three separate sources, three different centuries, the same coastline. The old names are only labels people used when the real one would not fit. The shape beneath them is older than the map.

March 10 — Em drove up unannounced with takeout and refused to discuss the archive. We watched Dad's westerns. I slept nine hours. This morning the volume looked like what it is: a damp old book that some part of my grief dressed up in teeth. I boxed it for return. Graymoor has a restocking address.

March 12 — Graymoor called about an unpaid balance on Lot 114. There is no unpaid balance — I have the receipt. But I drove in to sort it out, and the return box was already open on my desk. Whitfield swears nobody entered the office. I want this on the record: for two days, I had left it.

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
- ask Em: did Mom count UP or DOWN? can't remember. it matters.
- finish ch. 7 transcription
- sleep`,
  },
  {
    id: "calendar_0316",
    name: "calendar_0316.ics",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
    evidenceId: "calendar_0316",
    alias: "CALEND~1.ICS",
    content: `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Miskatonic Local Calendar//Recovered//EN

BEGIN:VEVENT
DTSTART:20260316T183000
SUMMARY:leave archive / call Em from bus
LOCATION:Route 7 stop, Orne Library
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20260317T090000
SUMMARY:Special Collections 204 lecture
DESCRIPTION:Bring cable. Do not use Lot 114 as example. Do not say "the catalogue is hungry" out loud.
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:{TOMORROW}T031500
SUMMARY:complete blank field
LOCATION:SB-ARCHIVE-02
STATUS:TENTATIVE
END:VEVENT

END:VCALENDAR`,
  },
  {
    // Elevated from a text draft to a played artifact: the everyday reward
    // that follows the counting.wav set piece. Gated on the set piece having
    // been seen (post_end_transcript), not just the puzzle — see
    // isUnlocked's "allOf" below and MediaPlayer.tsx / desktop/page.tsx for
    // the arrival notice. Keeps the id `voicemail_to_em` so existing save
    // fields (evidenceId, Finale.personalCoda's readFileIds check) still work.
    id: "voicemail_to_em",
    name: "voicemail_to_em.wav",
    folderId: "sarah",
    kind: "audio",
    unlock: {
      type: "allOf",
      conditions: [
        { type: "puzzleSolved", puzzleId: "counting_audio" },
        { type: "flag", flag: "post_end_transcript_seen" },
      ],
    },
    evidenceId: "voicemail_to_em",
    alias: "VOICEM~1.WAV",
    content: "/artifacts/voicemail-to-em.wav",
    transcript: `[VOICEMAIL. Answering machine pickup, 2026-02-13 17:44. Duration 00:41.]

*beep* *beep*

Hey, it's me. The coffee in the faculty lounge is a war crime — I'm fairly sure Whitfield's been refilling the same pot since Tuesday.

I'll be home for dinner. An actual dinner, at an actual table, I promise.

[laughing] I still can't believe you said that to Dad's face. I've been laughing about it for two exits on the highway.

My bus is here — okay, bye, I'm still lau—

[4 SECONDS OF LINE NOISE]`,
  },
  {
    id: "reasons_to_stop",
    name: "reasons_to_stop.txt",
    folderId: "work",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
    evidenceId: "reasons_to_stop",
    alias: "REASON~1.TXT",
    content: `REASONS TO STOP

1. Em is right.
2. Dad knows the empty-chair voice and I am using it on him.
3. Tom will help if I ask, which means I should not ask.
4. Mom left blanks on purpose.
5. The book answers the part of me that wants answers more than safety.

REASONS I HAVEN'T

1. If Mom was trying to warn me, stopping now turns the warning into a locked door.
2. If Mom was trapped, then I have been calling grief "closure" for twenty-eight years.
3. The catalogue keeps putting my name where hers used to be.

Decision:
Leave by 6:30. Bring the scans home? No. Do not bring it home.`,
  },
  {
    id: "fellowship_draft",
    name: "fellowship_draft.txt",
    folderId: "work",
    kind: "text",
    unlock: {
      // Optional human-context reward: two retained act-one findings surface
      // it early; the stage-3 milestone keeps it reachable without Casefile.
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "act1_recovered_partial" },
        { type: "puzzleSolved", puzzleId: "palimpsest" },
      ],
    },
    evidenceId: "fellowship_draft",
    alias: "FELLOW~1.TXT",
    modified: "2026-03-07 22:19",
    content: `ATLANTIC CONSERVATION INSTITUTE, LISBON — FELLOWSHIP STATEMENT (draft 3)

Eighteen months. Salt-damaged paper, which is apparently my specialty in every sense now.

What I want the committee to know: I have spent my whole career describing other people's collections. I would like, once, to work on something no one in my family has ever touched.

What I am not writing in the statement: if I get this, I am taking the green mug, the tomato plant, and nothing else.

Em has read drafts 1 and 2. Her only note, both times: "Send it."

Deadline: April 1.`,
  },
  {
    id: "graymoor_ledger_copy",
    name: "graymoor_ledger_copy.txt",
    folderId: "work",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
    evidenceId: "graymoor_ledger_copy",
    alias: "GRAYMO~1.TXT",
    content: `GRAYMOOR ANTIQUARIAN BOOKSELLERS — HOLD LEDGER, PHOTOCOPY
[Sarah's note: the clerk let me copy the page after I asked twice. He did not charge me. He wanted me out of the shop.]

LOT 114 / BOUND MS., PROVENANCE UNKNOWN, EX-LIBRARY WHATELEY

CONSIGNED .......... 1998-09-02
HOLD FOR ........... BISHOP, S. — ORNE LIBRARY B2
DEPOSIT ............ waived
RELEASE CONDITION .. inquiry by named party

Clerk's initials on the release line, 2026.
The hold entry itself is in blue accession pencil.

[Sarah's note, under the photocopy: In September 1998 I was seven years old.]`,
  },
  {
    id: "unsent_to_dad",
    name: "unsent_to_dad.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
    evidenceId: "unsent_to_dad",
    alias: "UNSENT~1.TXT",
    content: `DRAFT / not sent
To: Dad

I found the green mug.

I know this is a stupid thing to write instead of calling. I keep thinking if I say it out loud you will hear Mom in it before you hear me.

I am angry at her. I miss her. I am scared that both feelings are the same door from different sides.

If I bring the mug Sunday, please pretend it is normal that I kept it unwashed.

If I do not bring it, make Em take it anyway.`,
  },
  {
    id: "desk_inventory",
    name: "desk_inventory.tmp",
    folderId: "work",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
    evidenceId: "desk_inventory",
    alias: "DESKIN~1.TMP",
    modified: "2026-03-16 18:02",
    content: `SB-ARCHIVE-02 / TEMPORARY DESK INVENTORY

coffee mug, green / inherited / unwashed
banana, labelled SARAH / inedible by 2026-03-16
legal pad / water damage lower edge
Lot 114 receipt / folded twice
reader card blanks / 4
reader card blanks / 5

Inventory warning:
One blank card was counted before it was placed on the desk.

Operator note:
Do not catalogue loose blanks by hand.`,
  },
  {
    id: "em_draft_reply",
    name: "em_draft_reply.txt",
    folderId: "sarah",
    kind: "text",
    unlock: {
      // Optional human-context reward: two retained act-one findings surface
      // it early; the stage-3 milestone keeps it reachable without Casefile.
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "act1_recovered_partial" },
        { type: "puzzleSolved", puzzleId: "palimpsest" },
      ],
    },
    evidenceId: "em_draft_reply",
    alias: "EMDRAF~1.TXT",
    content: `Recovered browser form draft / Em Bishop
Not posted.

Sarah,

I told myself I wanted you to find out what happened to Mom because not knowing was eating you alive.

That is only half true.

The uglier half is that I wanted you to prove there was something to find, because if there was not, then Mom chose the work and left us with nothing but a chair.

I am sorry I kept handing you better questions when what I meant was please stop.`,
  },
  {
    id: "printer_alignment",
    name: "printer_alignment.log",
    folderId: "restricted",
    kind: "text",
    unlock: {
      // Optional human-context reward: two retained act-one findings surface
      // it early; the stage-3 milestone keeps it reachable without Casefile.
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "act1_recovered_partial" },
        { type: "puzzleSolved", puzzleId: "palimpsest" },
      ],
    },
    evidenceId: "printer_alignment",
    alias: "PRNALI~1.LOG",
    modified: "{TOMORROW} 03:08",
    content: `HP LASERJET 4L / ALIGNMENT CAPTURE
DEVICE: not attached
DRIVER: retained from M.BISHOP profile

TEST LINE A: THE QUICK BROWN FOX
TEST LINE B: THE QUICK BROWN FOX
TEST LINE C: THE QUICK BROWN [blank]

LEGACY TRACE:
RECIPIENT FIELD ...... R. ARMITAGE
SHELFMARK FIELD ...... [blank]
FINAL STROKE ANGLE ... MATCHES 1998 SAMPLE

No complete sentence recovered.
The printer did not print the warning. It printed the places where a warning would fit.`,
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
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
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
    content: `MISKATONIC CAMPUS SECURITY — INCIDENT 2026-0318-2
SUBJECT: Bishop, S. (faculty, Special Collections)
SUBJECT LAST CONFIRMED ON PREMISES: 2026-03-16

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
  {
    // A dry system artifact, not the Casefile printer_wake/MIRIAM_DRAFT flow:
    // the spooler answers a query nobody sent about a name it treats as a
    // record, not a person. See the taskbar alert triggered from the
    // status_sheet world reaction for the live PRESENT -> DUPLICATED swap;
    // this static body only ever shows the resolved state on reread.
    id: "status_query_sheet",
    name: "STATUS_QUERY.PRN",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
    alias: "STATUS~1.PRN",
    content: `SARAH BISHOP — STATUS: PRESENT`,
  },
  {
    // Only exists once the 1998 desktop flash (see desktop/page.tsx) has been
    // opened once — the flag also gates its reappearance in this folder so a
    // missed or already-seen flash doesn't leave a dangling reference.
    id: "miriam_accession_notes_wk3",
    name: "accession_notes_wk3.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "flag", flag: "miriam_1998_file_recovered" },
    alias: "ACCESS~2.TXT",
    modified: "1998-09-03",
    content: `ACCESSION WORKING NOTES — WEEK 3
CATALOGUER: M. BISHOP

SHELF ............ B2-114
VOLUME ........... I of II
CONDITION ........
FOLIO COUNT ...... 212
MARGIN HAND ......

CROSS-REFERENCE:
1977 BOX ......... CONFIRMED
1949 CARD ........
NEXT ENTRY .......

LINE 04 ... LEAVE BLANK UNTIL VOL. II ARRIVES

No further fields recovered from this session.`,
  },

  {
    id: "legacy_dialup_log",
    name: "DIALUP.LOG",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "flag", flag: "legacy_msn_files_recovered" },
    alias: "DIALUP.LOG",
    modified: "1998-09-03 03:14",
    content: `MSN TEXT SERVICE / CONNECTION LOG

03:14:02 CARRIER DETECTED
03:14:03 REMOTE USER: NEXT_USER
03:14:03 LOCAL USER: M.BISHOP
03:14:04 ROUTE: RELAY-07 / LOOPBACK
03:14:11 CLOCK SKEW: +28 YEARS
03:14:12 WARNING: LOCAL AND REMOTE OWNER CHECKSUMS MATCH
03:14:13 CONNECTION RETAINED BY REMOTE HOST`,
  },
  {
    id: "legacy_usermap",
    name: "USERMAP.DAT",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "flag", flag: "legacy_msn_files_recovered" },
    alias: "USERMAP.DAT",
    modified: "1998-09-03 03:15",
    content: `USER TABLE / PARTIAL RECOVERY

M.BISHOP ......... LOCAL / 1998
S.BISHOP ......... RESERVED / 2026
NEXT_USER ........ REMOTE / DATE INVALID

OWNER CHECKSUM: SAME
DISPLAY NAMES: DIFFERENT

The system treats these as one user at different offsets.`,
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
    // The recording only surfaces after the Vigenere text in margin_ch7.enc
    // has been decoded successfully.
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
    content: `FILE BODY UNSTABLE
HASH: UNCHANGED
RENDER VARIANTS RECOVERED: 17

Earliest modification: {TOMORROW}
Latest modification: {TOMORROW}
Write operations recorded: 0

The body cannot be reproduced consistently.`,
  },
  {
    id: "counting",
    name: "counting.wav — transcript.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "margin_cipher" },
    evidenceId: "counting_transcript",
    content: `[Audio recovered from the office. 4 min 11 sec. Auto-transcribed; the second voice could not be rendered to text.]

[VOICE 2: pattern-matched against staff dictation archive. Closest match withheld by administrative order.]

S. BISHOP: ...okay. It's the fourteenth. I'm recording this so there's proof I'm not — [pause] — it's doing it again. Listen.

[A counting. Sarah's voice joins it, a half-second behind, as if reading along with something she can hear but the microphone cannot.]

S. BISHOP (whisper): ...that's not how many days. That's how many people.`,
  },
  {
    id: "counting_retranscribed",
    name: "counting.wav — retranscribed.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "counting_retranscribed",
    modified: "{TOMORROW} 03:13",
    content: `[Auto-transcription re-run after cache rebuild. Source: counting.wav, 4 min 11 sec.]

The recording is unchanged. The waveform matches the archived copy sample for sample.

The count in this pass ends one name later than the archived transcript.

No edit to the source file was recorded.`,
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
    id: "office_1998_overlay",
    name: "office_1998.jpg",
    folderId: "restricted",
    kind: "image",
    unlock: { type: "puzzleSolved", puzzleId: "counting_audio" },
    evidenceId: "office_1998_overlay",
    alias: "OFFICE~8.JPG",
    size: "2.1 MB",
    modified: "1998-09-03 03:14",
    taken: "1998-09-03 03:14 / recovered scan",
    dimensions: "1536 × 1024",
    camera: "Unknown 35 mm negative / frame alignment inferred",
    location: "Orne Library, basement archive B2",
    caption: "The same office twenty-eight years before frame 12.",
    comment:
      "The filing cabinet label is blank. Its outline does not align with any object in this exposure.",
    content: "/photos/office_1998_overlay.png",
  },
  {
    id: "office_tomorrow_overlay",
    name: "office_tomorrow.jpg",
    folderId: "restricted",
    kind: "image",
    unlock: { type: "puzzleSolved", puzzleId: "counting_audio" },
    evidenceId: "office_tomorrow_overlay",
    alias: "OFFICE~0.JPG",
    size: "2.5 MB",
    modified: "{TOMORROW} 03:14",
    taken: "{TOMORROW} 03:14",
    dimensions: "1536 × 1024",
    camera: "Miskatonic Campus Security / device not yet issued",
    location: "Orne Library, basement archive B2",
    caption: "A third exposure indexed one day ahead of the mounted session.",
    comment:
      "The room appears older, not later. The pale vertical absence is not visible in either source alone.",
    content: "/photos/office_tomorrow_overlay.png",
  },
  {
    id: "directory_comparison",
    name: "BISHOP_TREE.CMP",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "margin_cipher" },
    evidenceId: "directory_comparison",
    alias: "BISHOP~1.CMP",
    modified: "{TOMORROW} 03:10",
    content: `RECOVERY DIRECTORY COMPARATOR 0.4

Two user snapshots were mounted read-only. Select the entry that belongs to neither source tree.

M.BISHOP / 1998                 S.BISHOP / 2026
ACCESSION                       ACCESSION
CORRESPONDENCE                  CORRESPONDENCE
TEMP                            TEMP
[unresolved entry]              [unresolved entry]`,
  },
  {
    id: "silent_call",
    name: "CALL_0314.WAV",
    folderId: "restricted",
    kind: "audio",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "silent_call",
    alias: "CALL03~1.WAV",
    size: "1.7 MB",
    modified: "{TOMORROW} 03:14",
    content: "/artifacts/call-without-voice.wav",
    transcript: `[PBX CAPTURE / NO CALLER / NO ROUTE]

The left and right channels contain the same room tone with opposite phase errors.
Automatic transcription found no voice.`,
  },
  {
    id: "observer_first_seen",
    name: "FIRST_SEEN.DIR",
    folderId: "observer-cache",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "observer_directory",
    alias: "FIRSTS~1.DIR",
    modified: "{TOMORROW} 03:10",
    content: `DIRECTORY ENTRY / OWNER UNRESOLVED

Path ............. C:\\WINDOWS\\Profiles\\{PLAYER}
Created .......... when BISHOP_TREE.CMP was compared
Source tree ...... none
Inherited ACL .... M.BISHOP / S.BISHOP

This directory was not present in either snapshot.
It was present in the comparison result.`,
  },
  {
    id: "counter_index_note",
    name: "DO_NOT_COMPLETE.NFO",
    folderId: "observer-cache",
    kind: "text",
    unlock: { type: "flag", flag: "silent_call_solved" },
    evidenceId: "counter_index_note",
    alias: "DONOTC~2.NFO",
    modified: "{TOMORROW} 03:15",
    content: `COUNTER-INDEX FRAGMENT / CHANNEL DIFFERENCE

VOICE MATCH: BISHOP / GENERATION UNRESOLVED

Do not restore the whole record.
Leave one field unanswered.
I cannot tell whether the missing field stops it following us or gives it somewhere to wait.

RECOVERED OPERATION:
INDEX /RESTORE /INCOMPLETE`,
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
    id: "browser_history_0316",
    name: "browser_history_0316.dat",
    folderId: "downloads",
    kind: "text",
    unlock: {
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "act1_reconstruction_complete" },
        { type: "puzzleSolved", puzzleId: "counting_audio" },
      ],
    },
    evidenceId: "browser_history_0316",
    alias: "BROWSER.DAT",
    modified: "{TOMORROW} 03:12",
    content: `INTERNET EXPLORER / RECOVERED HISTORY FRAGMENT

2026-03-16 02:58  http://search.miskatonic.net/search?q=Bellaso
2026-03-16 03:02  http://www.miskatonic.edu/library/cryptography/bellaso.htm
2026-03-16 03:08  cache://miskatonic/library/readers/notices.htm
{TOMORROW} 03:12  cache://miskatonic/catalog/2026-bishop-sarah
{TOMORROW} 03:13  http://www.geocities.com/tomalvarez_archive/guestbook.html

2 entries could not be matched to any local session.`,
  },
  {
    id: "read_receipts",
    name: "read_receipts.dbx",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "read_receipts",
    alias: "READRE~1.DBX",
    modified: "{TOMORROW} 03:11",
    content: `OUTLOOK EXPRESS / READ RECEIPT INDEX

2026-03-14 03:06  Tom Alvarez -> S. Bishop  RECEIPT ISSUED 00:02 BEFORE SEND
2026-03-15 03:12  unknown -> S. Bishop       RECEIPT ISSUED 00:07 BEFORE DELIVERY
2026-03-22 21:44  Tom Alvarez -> S. Bishop  RECEIPT ISSUED FROM TOMORROW FIELD
{TOMORROW} 03:11  S. Bishop -> current      RECEIPT HELD / RECIPIENT GENERATED

Local note recovered from Sarah's mailbox repair log:
I can see the envelopes before they arrive. I cannot see who the file picks next.

Repair status:
DBX rebuilt. Sender choice not found.
Message-ID format: <SENDER INITIALS>-<DATE>-<OBJECT REF>@miskatonic-research.org`,
  },
  {
    id: "pending_receipts",
    name: "pending_receipts.dbx",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "flag", flag: "endgame_available" },
    evidenceId: "pending_receipts",
    alias: "PENDIN~1.DBX",
    modified: "{TOMORROW} 09:26",
    content: `OUTLOOK EXPRESS / PENDING RECEIPT QUEUE

{TOMORROW} 03:11  S. BISHOP -> CURRENT OBSERVER   RECEIPT HELD
{TOMORROW} 09:26  E. BISHOP -> S. BISHOP          RECEIPT ISSUED / MESSAGE NOT YET COMPOSED

Queue note:
The second receipt refers to a message that has not been written.

No action is available from this terminal.`,
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
    id: "field_04",
    name: "field_04.tmp",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "field_04",
    alias: "FIELD4~1.TMP",
    modified: "{TOMORROW} 03:15",
    content: `INDEX TEMPORARY FIELD / 04

SOURCE: unresolved
ARCHIVE: SB-0316
WITNESS: current observer
RECIPIENT: [not selected by sender]

BYTES BEFORE OPEN: 0
BYTES AFTER OPEN: 404

The field is not empty anymore.
It contains the fact that someone checked whether it was empty.`,
  },
  {
    id: "do_not_catalogue",
    name: "do_not_catalogue.me",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "do_not_catalogue",
    alias: "DONOTC~1.ME",
    modified: "{TOMORROW} 03:15",
    content: `FILE HAS NO BODY.

PROPERTIES RECOVERED:
Owner ............ {PLAYER}
Created .......... {TOMORROW}
Description ...... blank field, examined

If the investigator files this record, the record will have been filed.
If the investigator leaves it out, the omission will be preserved.

No safer instruction was recovered.`,
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
    id: "split_record",
    name: "split_record.txt",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "split_record",
    alias: "SPLITR~1.TXT",
    modified: "2026-03-15 23:47",
    content: `S_split.wkg — scratch, not for the printer

Split my own name across three files today to see if the index still folds them into one entry:
S.BISHOP -> SPLITR~1.TXT
BISHOP, S -> BISHOP~1.TXT
S B I S H O P (spaced) -> S_BISH~2.TXT

Doesn't matter how I break the name up before saving it. It reassembles on read, not on write. Same accession number, every file, 03:11.

Relay packet, recipient field: left blank this time. On purpose. The blank survives the copy. After the relay opens, the field no longer tests as empty.

Tom doesn't know I did this. Whoever opens the blank field after me, I need them to —`,
  },
  {
    id: "tom_relay_disk_photo",
    name: "relay07_upload_setup.jpg",
    folderId: "downloads",
    kind: "image",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "tom_relay_disk_photo",
    alias: "RELAY0~1.JPG",
    size: "1.9 MB",
    modified: "2026-03-23 02:57",
    taken: "2026-03-23 02:56",
    dimensions: "1456 × 1092",
    camera: "Tom's phone / recovered thumbnail",
    location: "Tom Alvarez's office",
    caption: "Tom's upload setup before he stopped answering.",
    comment:
      "The external drive is powered. The floppy label was unreadable before the photograph was compressed.",
    content: "/artifacts/tom_relay_disk_2026.png",
    embeddedVariant: {
      id: "tom-relay-thumbnail",
      label: "SB-0316 / HOLD BLOCK 04",
      detail: "Embedded camera thumbnail / floppy label recovered",
      setsFlag: "tom_floppy_recovered",
      evidenceId: "tom_hold_thumbnail",
    },
  },
  {
    id: "tom_upload_notes",
    name: "upload_notes.txt",
    folderId: "downloads",
    kind: "text",
    unlock: { type: "evidenceOpened", evidenceId: "tom_relay_disk_photo" },
    evidenceId: "tom_upload_notes",
    alias: "UPLOAD~1.TXT",
    content: `T. ALVAREZ — UPLOAD CHECKLIST

1. Mount Sarah's disk image read-only.
2. Verify file tree without opening CHAPTER_SEVEN.
3. Export hash manifest.
4. Send copy to someone off campus.

Tom added in pen and then photographed the desk:
The manifest already lists this checklist.

Later annotation recovered from the thumbnail cache:
Do not trust a copy that knows why it was copied.`,
  },
  {
    id: "hash_manifest",
    name: "hash_manifest.txt",
    folderId: "downloads",
    kind: "text",
    unlock: { type: "evidenceOpened", evidenceId: "tom_upload_notes" },
    evidenceId: "hash_manifest",
    alias: "HASHMA~1.TXT",
    modified: "{TOMORROW} 03:15",
    content: `SB-0316 / HASH MANIFEST / T. ALVAREZ

Generated before Relay 07 upload.
Expected recipients: 3
Observed recipients: 4

FILE                         STATUS
DIARY.TXT                    HASHED
COUNTI~1.WAV                 HASHED
ACCESS~1.TXT                 LISTED BEFORE READ
READRE~1.DBX                 LISTED BEFORE RECOVERY
HASHMA~1.TXT                 LISTED BEFORE GENERATION

RECIPIENT 04: ADDRESS NULL / CREATED AFTER FIRST OPEN

Tom's note in the failed upload record:
I didn't choose the fourth. Sarah left no address. The copy filled the blank — or obeyed something she left inside it. I cannot prove which happened first.`,
  },
  {
    id: "tom_lunch_note",
    name: "LUNCH.TXT",
    folderId: "floppy-a",
    kind: "text",
    unlock: { type: "always" },
    alias: "LUNCH.TXT",
    modified: "2026-03-12 12:07",
    content: `Sarah —

I borrowed the label maker again. If it comes back with every key except the 4, that is unrelated to me and impossible to prove.

Lunch Thursday? I will bring the cable. You will pretend this counts as leaving the basement.

— Tom`,
  },
  {
    id: "tom_hold_fragment",
    name: "HOLD_04.CHK",
    folderId: "floppy-a",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "tom_hold_fragment",
    alias: "HOLD_04.CHK",
    size: "0 KB",
    modified: "2026-03-23 03:13",
    content: `SB-0316 / VERIFY FRAGMENT

BLOCK 04 .............. REMOVED BEFORE UPLOAD
REMOVAL SOURCE ........ T. ALVAREZ
EXPECTED HASH ......... see HASHMA~1.TXT
RECONSTRUCTION ........ PENDING FIRST OPEN

Verification syntax retained in slack space:
VERIFY SB-0316 /HOLD 04`,
  },
  {
    id: "tom_hold_log",
    name: "TOM_HOLD.LOG",
    folderId: "floppy-a",
    kind: "text",
    unlock: { type: "worldReaction", reactionId: "tom_hold_seek" },
    evidenceId: "tom_hold_log",
    alias: "TOMHOL~1.LOG",
    modified: "{TOMORROW} 03:14",
    content: `SB-0316 / HELD BLOCK VERIFICATION

BLOCK 04 .............. intentionally absent
LAST LOCAL OWNER ...... T. ALVAREZ
UPLOAD OWNER .......... unresolved
FIRST OPEN OWNER ...... current observer

RESULT:
The held block was regenerated when the image was opened.
No surviving record identifies who instructed the copy to replace it.`,
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
          en: "act of reconstruction",
          "pt-BR": "ato de reconstrução",
        },
      },
    ],
    content: `The final entry in the sequence is not a word Sarah could quote.

The marks do not remain still long enough to copy.

Chapter Seven is an act of reconstruction, not a page in the volume.`,
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
RESTORE writes a recovered owner into the source field.

HALT closes the current relay without recovering its unresolved source.

No disposition for the current observer was retained.`,
  },
  {
    id: "observer_outbox",
    name: "OUTBOX_04.EML",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "future_log" },
    evidenceId: "observer_outbox",
    alias: "OUTBOX~1.EML",
    modified: "{TOMORROW} 03:15",
    content: `OUTLOOK EXPRESS / RECOVERED OUTBOX ITEM

FROM: {PLAYER}@relay07.local
TO: [unresolved]
DATE: {TOMORROW} 03:15
BODY BYTES: 0

ATTACHMENTS RECORDED BEFORE COMPOSITION:
{RECENT_ATTACHMENTS}

No send operation was recorded.`,
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

The card named the next custodian only as BISHOP and left the accession field blank.

Tube runner Harold Gilman did not report for the next shift. His badge was recovered inside the empty carrier.

Handwritten addendum: THE DESK KEEPS ITS CLERK UNTIL THE SHELF IS DESCRIBED. THE READER IT KEEPS ONLY IF THE READER FINISHES.`,
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

The library volunteer reported missing that evening was Daniel Carter, the Carter named in the coastal registry.

In 1998, Miriam requested this exact box by a shelfmark that had never been assigned.`,
  },
  {
    id: "bishop_transfer_box_photo",
    name: "akeley_box_1977.png",
    folderId: "lineage-dossiers",
    kind: "image",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "bishop_transfer_box_photo",
    alias: "AKELEY~1.PNG",
    size: "2.8 MB",
    modified: "2026-03-20 01:02",
    taken: "2026-03-20 00:58",
    dimensions: "1456 × 1092",
    camera: "Orne Library evidence camera 04",
    location: "Hydrographic drawer / closed Akeley desk",
    caption: "The transfer box Miriam accepted in 1977, photographed after Em opened it.",
    comment:
      "The ledger inside is swollen from salt. The blank label is newer than the box.",
    content: "/artifacts/bishop_transfer_box_1977.png",
  },
  {
    id: "bishop_transfer_inventory",
    name: "box_inventory_1977.txt",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "bishop_transfer_inventory",
    alias: "BOXINV~1.TXT",
    content: `CLOSED AKELEY DESK — CONTENTS RECONCILIATION

Recovered by Em Bishop from the hydrographic drawer.
Original transfer witnessed by M. Bishop, 1977.

1 wooden transfer box, salt bloom on lower panels
3 reader cards, surnames only
1 folded coastal chart, pinholes through the same offshore mark
1 incomplete ledger, final catalogue line blank
1 loose label, adhesive still active

Inventory conflict:
The loose label is dated {TOMORROW}. Its handwriting matches no staff sample.

Administrative note:
Do not complete the ledger line to resolve this discrepancy.`,
  },
  {
    id: "miriam_margin_match",
    name: "miriam_margin_match.txt",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    evidenceId: "miriam_margin_match",
    alias: "MIRIAM~2.TXT",
    modified: "{TOMORROW} 03:10",
    content: `HANDWRITING COMPARISON / HYDROGRAPHIC DRAWER

SOURCE A: accession annotation / 1998-09-03
SOURCE B: margin annotation / {TOMORROW} 03:10
ATTRIBUTED HAND: M. BISHOP
MATCH: 98.7%

FINAL STROKE: interrupted at identical angle
ADMINISTRATIVE STATUS: REVIEW WITHHELD`,
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
    id: "eleanor_vcard",
    name: "ELEANOR.VCF",
    folderId: "lineage-dossiers",
    kind: "text",
    unlock: {
      type: "worldReaction",
      reactionId: "eleanor_owner_reconciled",
    },
    evidenceId: "eleanor_vcard",
    alias: "ELEANO~1.VCF",
    modified: "{TOMORROW} 03:14",
    content: `BEGIN:VCARD
VERSION:2.1
FN:Eleanor Vale
TITLE:Night digitization contractor
ORG:Miskatonic University;Off-site Archive Mirror
NOTE:Library preservation student. Oral-history shift. Call mother after 08:00.
X-BADGE:14-EV
X-LAST-HUMAN-UPDATE:2014-05-17 22:41
X-LOOPBACK-UPLOAD:2014-05-19 03:14
X-OWNER:[CHECKSUM]
X-HUMAN-ATTRIBUTION:UNRESOLVED
END:VCARD`,
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
    unlock: { type: "flag", flag: "ending_restore_complete" },
    content: `[New documents found in this account. Owner: {PLAYER}. Created: {TOMORROW}.]

Thank you. I'm sorry.

I'll watch for you. The way you watched for me.

— S.

P.S. A second session is still open: M.BISHOP. The only readable fields are TOMATO / SARAH / FINISH —`,
  },
  {
    id: "blank_space_after",
    name: "blank_space.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "flag", flag: "ending_leave_blank" },
    evidenceId: "blank_space",
    alias: "BLANKS~1.TXT",
    modified: "{TOMORROW} 03:16",
    content: `RECOVERY INDEX / FIELD RETAINED UNRESOLVED

SOURCE: S. BISHOP
ARCHIVE: SB-0316
WITNESS: current observer
FIELD 04: [left blank]

The relay has been closed.
The source remains unrecovered by record.
The count was retained at the moment the field stayed empty.

STATUS: CLOSED
NO RECHECK SCHEDULED`,
  },
  {
    id: "restore_incomplete_checkpoint",
    name: "RESTORE_INCOMPLETE.CHK",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "flag", flag: "ending_restore_incomplete" },
    modified: "{TOMORROW} 03:16",
    content: `RESTORE CHECKPOINT / INCOMPLETE

SOURCE ........ S. BISHOP
FIELD 04 ...... WITHHELD
OWNER ......... {PLAYER}
STATUS ........ CLOSED

The source returned with one field retained outside the record.
No further restore operation has been scheduled.`,
  },
  {
    id: "case_closure_log",
    name: "CASE_CLOSURE.LOG",
    folderId: "sarah",
    kind: "text",
    unlock: {
      type: "anyOf",
      conditions: [
        { type: "flag", flag: "ending_restore" },
        { type: "flag", flag: "ending_shutdown" },
        { type: "flag", flag: "ending_seal" },
        { type: "flag", flag: "ending_leave_blank" },
        { type: "flag", flag: "ending_archive_self" },
      ],
    },
    modified: "{TOMORROW} 03:16",
    content: `CASE SB-0316 / CLOSURE RECORD

STATUS: CLOSED
This record is resolved when opened from a completed case.`,
  },
  {
    id: "archived_observer_after",
    name: "archived_observer.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "flag", flag: "ending_archive_self" },
    evidenceId: "archived_observer",
    alias: "ARCHIV~1.TXT",
    modified: "{TOMORROW} 03:16",
    content: `RECOVERY INDEX / OBSERVER FILED

SOURCE: unresolved
ARCHIVE: SB-0316
WITNESS: {PLAYER}

The field accepted a living witness by consent.
No replacement recipient was generated.
No physical recovery of Sarah Bishop was confirmed.

New documents found:
{PLAYER}_desktop.ini
{PLAYER}_recent_files.log
{PLAYER}_tomorrow.tmp

All three are dated {TOMORROW}.
All three were already here when you chose.`,
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

JOB ID: 1998-09-03-0314 / replayed {TOMORROW} 03:09
PRINTER: ORNE-B2-HP4L / disposed 2004
PAGES EXPECTED: 1
PAGES PRINTED: 0

FIELDS RECOVERED:
RECIPIENT: R. ARMITAGE
SUBJECT: [blank shelfmark]
LINE 01: MISSING = PREVENTS NEXT ENTRY
LINE 02: COMPLETE DESCRIPTION = INSTRUCTION
LINE 03: SARAH / TOMATO / LEAVE BLANK
LINE 04: DO NOT MAKE THE WARNING INTO A MAP

ERROR:
PROSE CHANNEL REFUSED.
FINAL STROKE INTERRUPTED AT SAME ANGLE AS 1998 SAMPLE.`,
  },
  {
    id: "miriam_shortcut",
    name: "MIRIAM.LNK",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "flag", flag: "miriam_1998_file_recovered" },
    alias: "MIRIAM~2.LNK",
    modified: "1998-09-03 03:14",
    content: `WINDOWS SHORTCUT

TARGET: C:\\WINDOWS\\Profiles\\M.BISHOP\\Recent\\ACCESSION.PRN
STATUS: TARGET UNAVAILABLE
LAST ACCESSED: 03:14

The target does not exist in this image. The shortcut does.`,
  },
  {
    id: "sarah_break_cache",
    name: "sarah_break_cache.tmp",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "flag", flag: "sarah_break_cache_materialized" },
    alias: "SARAHB~1.TMP",
    modified: "{TOMORROW} 03:16",
    setsFlagOnOpen: "break_protocol_recovered",
    content: `TEMP CACHE / PARTIAL FLUSH

Do not complete the record. A field can remain unresolved long enough to interrupt the copy.

The rest of the message was never committed.`,
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
    id: "graymoor_return_receipt",
    name: "RETURN_114.RCP",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "flag", flag: "graymoor_return_receipt_recovered" },
    evidenceId: "graymoor_return_receipt",
    alias: "RETURN~1.RCP",
    modified: "2026-03-12 08:03",
    completesOptionalMission: "two_days_out",
    content: `GRAYMOOR / LOT 114 RETURN RECONCILIATION

PICKUP REQUESTED .... 2026-03-10 16:41
PARCEL ACCEPTED ..... 2026-03-11 09:14
RETURN ROUTE CREATED  2026-03-11 09:13
LABEL PRINTED ....... 2026-03-12 08:03

SOURCE: S. BISHOP
DESTINATION: ORNE LIBRARY B2
UNINDEXED INTERVAL: 41:58:12

The return route predates acceptance of the parcel.
No correction operation was recorded.`,
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
COUNT: HELD

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
No determination was made whether the second voice counts toward the total or against it.

The archive has marked these omissions as intentional.`,
  },
  {
    id: "review_2_tmp",
    name: "REVIEW_2.TMP",
    folderId: "deleted",
    kind: "text",
    unlock: { type: "always" },
    size: "3 KB",
    modified: "03/12/2026 09:18",
    content: `PEER REVIEW / UNSENT DRAFT

I understand the objection. I also understand that calling the records “anxiety-shaped” saves everyone from reading them.

I was unfair in the meeting. The evidence is thin, and I made it sound thicker because I was tired of being the only person who could see the gap. That does not make me right.`,
  },
  {
    id: "gull_0310_receipt",
    name: "GULL_0310.RCT",
    folderId: "deleted",
    kind: "text",
    unlock: {
      type: "allOf",
      conditions: [
        { type: "puzzleSolved", puzzleId: "lot_114" },
        { type: "evidenceOpened", evidenceId: "diary" },
        { type: "evidenceOpened", evidenceId: "reasons_to_stop" },
      ],
    },
    evidenceId: "gull_0310_receipt",
    alias: "GULL03~1.RCT",
    size: "1 KB",
    modified: "2026-03-10 22:18",
    content: `GULL & LANTERN CAFÉ / 10 MARCH 2026

2 chowders
1 grilled cheese, tomato removed
2 coffees, one replaced after Em complained

TABLE: WINDOW 4
PAID: E. BISHOP

Handwritten on reverse, S. Bishop:
return pickup / GM-114-0310
Em says write it somewhere that isn't the book.`,
  },
  {
    id: "apology_tmp",
    name: "APOLOGY.TMP",
    folderId: "deleted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
    size: "2 KB",
    modified: "03/14/2026 22:11",
    content: `Tom —

I asked you because I knew you would not say no. That was not fair. You are not an errand service for my mother, my book, or whatever I am becoming around this file.

Please do not come to B2 tonight. I mean it.`,
  },
  {
    id: "return_lbl",
    name: "RETURN.LBL",
    folderId: "deleted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "margin_cipher" },
    size: "1 KB",
    modified: "03/15/2026 11:29",
    content: `GRAYMOOR ANTIQUARIAN BOOKSELLERS
RETURN LABEL / LOT 114 / VOLUME II

FROM: S. BISHOP
TO: __________________________
ROUTE: ADMINISTRATIVE HOLD

The recipient field was removed without leaving an erasure mark.`,
  },
  {
    id: "empty_tmp",
    name: "EMPTY.TMP",
    folderId: "deleted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "future_log" },
    size: "0 KB",
    modified: "{TOMORROW}",
    content: ``,
  },
  {
    id: "expedition_tmp",
    name: "EXPEDITION.TMP",
    folderId: "deleted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "counting_audio" },
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
