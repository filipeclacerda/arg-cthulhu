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
  /** Opening this file triggers the desktop corruption effect. */
  triggersCorruption?: boolean;
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
];

export const files: VFile[] = [
  {
    id: "diary",
    name: "diary.txt",
    folderId: "sarah",
    kind: "text",
    unlock: { type: "always" },
    content: `RESEARCH JOURNAL — S. BISHOP

March 2 — Acquired the second volume today. The bookseller wouldn't meet my eyes when he handed it over. Said the previous owner "stopped coming around." I didn't ask what that meant.

March 9 — The cross-references check out. Three separate sources, three different centuries, the same coastline. Innsmouth isn't the only one. R'lyeh isn't a metaphor.

March 14 — I haven't slept. Every time I close my eyes I hear it counting. Not words. Counting.

March 15 — Found something in the margins of the second volume, not printed, written by hand. The same alphabet recurs throughout chapter seven. I've copied what I can make out into a separate file. If I'm right about the cipher, the translation key is straightforward, just tedious.

March 16 —`,
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

ᚱᛚᚤᛖᚺ   ᚱᛚᚤᛖᚺ   ᚱᛚᚤᛖᚺ

Decode it with the key from field_notes.txt and type the word below to continue.`,
  },
  {
    id: "manuscript",
    name: "DO_NOT_OPEN.txt",
    folderId: "restricted",
    kind: "text",
    unlock: { type: "always" },
    triggersCorruption: true,
    content: `[The text resists being read. Every time your eyes settle on a line, it has already become a different line.]

She didn't disappear. She finished the working. The date on this file is tomorrow.

If you are reading this, the desktop is already starting to remember things that haven't happened yet. Close it now, while you still believe you decided to.`,
  },
];
