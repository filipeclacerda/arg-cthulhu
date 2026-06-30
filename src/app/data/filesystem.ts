import { PuzzleId } from "../game/progress";

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
    id: "restricted",
    name: "RECOVERED",
    parentId: "sarah",
    unlock: { type: "puzzleSolved", puzzleId: "lot_114" },
  },
  {
    id: "chapter-seven",
    name: "CHAPTER_SEVEN",
    parentId: "restricted",
    unlock: { type: "puzzleSolved", puzzleId: "counting_audio" },
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

  // --- Act 1: the person (always visible in Sarah's home folder) ------------
  {
    id: "diary",
    name: "diary.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "diary",
    alias: "DIARY.TXT",
    size: "7 KB",
    content: `RESEARCH JOURNAL — S. BISHOP

Feb 24 — Em called. I let it go to voicemail again and I hate that I did. She just wants to know I'm eating. I'll call her back when this lot is catalogued. I keep saying that.

March 2 — Acquired the second volume today. The bookseller wouldn't meet my eyes when he handed it over. Said the previous owner "stopped coming around." I didn't ask what that meant. This is the volume Mom listed in her '98 notes — the one nobody could ever find. I'm using her old machine to cross-check her files. It still smells like her office.

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

M. BISHOP — ACCESSION NOTES, Whateley deposit, 1998

"Vol. II not present in the crate. Cataloguer (myself) to follow up re: the second volume — see marginalia in Vol. I, ch. 7. The hand in the margins is not the printer's. It answers questions I have not yet written down.

If anyone reads this after me: the counting is not a countdown. Do not finish the —"

[entry ends. Mom was reported missing eleven days later. They never found the second volume. I did. It came as Lot 114.]`,
  },
  {
    id: "police_report",
    name: "incident_report.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    evidenceId: "incident_report",
    alias: "INCIDE~1.TXT",
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
    content: `[Image metadata: taken 03/19 — three days after the office was sealed. Photographer unknown.]

An empty office. Chair pushed back. The damp patch under the desk, darker now.

In the black mirror of the powered-off monitor there is a reflection of someone sitting at the desk, facing the camera.

The office was empty when this was taken. The monitor was off. You are looking at it through a monitor that is on.`,
  },
  {
    id: "access_log",
    name: "access_log.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "future_access_log",
    alias: "ACCESS~1.TXT",
    reference: "B9",
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
    id: "toms_recording",
    name: "toms_last_message.txt",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    evidenceId: "tom_last_message",
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
successful future-log replay.`,
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
