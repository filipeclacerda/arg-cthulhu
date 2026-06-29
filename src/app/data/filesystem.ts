export type UnlockCondition =
  | { type: "always" }
  | { type: "flag"; flag: string };

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
  kind: "text" | "cipher";
  content: string;
  unlock: UnlockCondition;
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

export function isUnlocked(
  condition: UnlockCondition,
  flags: Record<string, boolean>
): boolean {
  return condition.type === "always" || !!flags[condition.flag];
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
    id: "restricted",
    name: "RECOVERED",
    parentId: "sarah",
    unlock: { type: "flag", flag: "cipher_1_solved" },
    icon: "/icons/folder-special.png",
  },
  {
    id: "chapter-seven",
    name: "CHAPTER_SEVEN",
    parentId: "restricted",
    unlock: { type: "flag", flag: "cipher_2_solved" },
    icon: "/icons/folder-special.png",
  },
];

export const files: VFile[] = [
  // --- Act 1: the person (always visible in Sarah's home folder) ------------
  {
    id: "diary",
    name: "diary.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
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
    content: `MISKATONIC CAMPUS SECURITY — INCIDENT 2026-0316-4
SUBJECT: Bishop, S. (faculty, Special Collections)

Responding to welfare check requested by colleague (T. Alvarez). Office door locked from the inside; no other egress. Window painted shut, intact. Subject not present.

Standing water on the floor beneath the desk, approx. 2 cm, no visible source. Field-tested: saline. Consistent with seawater. Nearest coast 180+ km.

Computer powered on at time of entry. Screen showed a single text file. Responding officer notes the file's modification date as the day AFTER entry. Attributed to a clock error.

Case open. No signs of forced entry or struggle.`,
  },
  {
    id: "notes",
    name: "field_notes.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    content: `TRANSLATION KEY (copied from the margin notes, Vol. II, ch. 7)

a ᚨ   b ᛒ   c ᚲ   d ᛞ   e ᛖ   f ᚠ   g ᚷ   h ᚺ   i ᛁ   j ᛃ
k ᛣ   l ᛚ   m ᛗ   n ᚾ   o ᛟ   p ᛈ   q ᛩ   r ᚱ   s ᛋ   t ᛏ
u ᚢ   v ᚡ   w ᚹ   x ᛪ   y ᚤ   z ᛉ

Whoever wrote this wasn't being careful. It's a straight substitution, no shift, no trick. If you find more of this alphabet, write it out letter by letter and it should read like English underneath.

— S.B.`,
  },
  {
    id: "cipher_1",
    name: "what_i_found.txt",
    folderId: "sarah",
    kind: "cipher",
    unlock: { type: "always" },
    answer: "rlyeh",
    unlocksFlag: "cipher_1_solved",
    content: `Found scratched into the inside cover, over and over, like whoever held the pen couldn't stop:

${toRunic("rlyeh")}   ${toRunic("rlyeh")}   ${toRunic("rlyeh")}

Decode it with the key from field_notes.txt and type the word below to continue.`,
  },

  // --- Act 2: the pattern (RECOVERED, unlocked by cipher_1) -----------------
  {
    id: "manuscript",
    name: "DO_NOT_OPEN.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "always" },
    raisesCorruptionTo: 1,
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
    raisesCorruptionTo: 1,
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
    unlock: { type: "always" },
    content: `FILE ACCESS LOG (most recent first)

{TOMORROW} 03:14  OPEN  the_name.txt
{TOMORROW} 03:14  OPEN  DO_NOT_OPEN.txt
{TOMORROW} 03:13  OPEN  what_i_found.txt
{TOMORROW} 03:12  LOGIN sarah.bishop

These are your clicks. You have not made them yet.`,
  },
  {
    id: "while_you_were_out",
    name: "while_you_were_out.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "flag", flag: "returned_after_absence" },
    raisesCorruptionTo: 1,
    content: `You were gone {ELAPSED_HOURS} hours.

It was not.

While the window was closed, the files kept their appointments. Something was catalogued in your absence. The next entry is dated {TOMORROW} and the cataloguer's initials are yours.`,
  },
  {
    id: "cipher_2",
    name: "margin_ch7.txt",
    folderId: "restricted",
    kind: "cipher",
    unlock: { type: "always" },
    answer: "yhanthlei",
    unlocksFlag: "cipher_2_solved",
    content: `More of the same hand, crowded into the margin of chapter seven. The coastline has a name underneath the name Sarah used. Decode it.

${toRunic("yhanthlei")}

(Same key as before. Type the decoded word to open what it points to.)`,
  },

  // --- Act 2/3: chapter seven (unlocked by cipher_2) -----------------------
  {
    id: "the_pattern",
    name: "the_pattern.txt",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "always" },
    raisesCorruptionTo: 2,
    content: `Sarah's last note. Five names, five dates, one coastline. Each one read chapter seven. None of them is buried anywhere.

  1791 — Obed M.        (read it)
  1844 — A. Gilman      (53 years later)
  1898 — E. Whateley    (54 years later)
  1951 — H. Akeley      (53 years later)
  1998 — Miriam Bishop  (47 years later)

"The gaps are getting shorter. I worked out when the next one falls.
 I'm not going to write the year down. You already know it.
 You're reading chapter seven right now."`,
  },
  {
    id: "toms_recording",
    name: "toms_last_message.txt",
    folderId: "chapter-seven",
    kind: "text",
    unlock: { type: "always" },
    raisesCorruptionTo: 3,
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
    unlock: { type: "always" },
    untypeable: true,
    raisesCorruptionTo: 4,
    setsFlagOnOpen: "endgame_available",
    content: `The last thing in chapter seven is its name. Not "R'lyeh" — that was Sarah's polite approximation, a word small enough to fit in a footnote. This is the thing underneath it.

The runes will not hold still long enough to copy. Try to write the name below and see for yourself.

Chapter seven is not in the book. Chapter seven is the person trying to understand it.`,
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
];
