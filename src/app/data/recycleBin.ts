import { UnlockCondition } from "../game/unlock";

export interface RecycleEntry {
  id: string;
  name: string;
  icon: "browser" | "notepad";
  size: string;
  deletedAt: string;
  originalPath: string;
  unlock: UnlockCondition;
  target: { type: "file"; fileId: string } | { type: "browser"; address: string };
}

const always: UnlockCondition = { type: "always" };
export const RECYCLE_ENTRIES: readonly RecycleEntry[] = [
  { id: "review", name: "REVIEW_2.TMP", icon: "notepad", size: "3 KB", deletedAt: "03/12/2026 09:18", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Temp", unlock: always, target: { type: "file", fileId: "review_2_tmp" } },
  { id: "gull", name: "GULLLANT.URL", icon: "browser", size: "1 KB", deletedAt: "03/15/2026 18:03", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Favorites", unlock: always, target: { type: "browser", address: "http://www.gull-lantern-arkham.com/" } },
  { id: "route", name: "ROUTE7.URL", icon: "browser", size: "1 KB", deletedAt: "03/16/2026 17:40", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Favorites", unlock: always, target: { type: "browser", address: "http://transit.arkham.gov/route7/" } },
  { id: "apology", name: "APOLOGY.TMP", icon: "notepad", size: "2 KB", deletedAt: "03/14/2026 22:11", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Temp", unlock: { type: "puzzleSolved", puzzleId: "lot_114" }, target: { type: "file", fileId: "apology_tmp" } },
  { id: "gull-0310", name: "GULL_0310.RCT", icon: "notepad", size: "1 KB", deletedAt: "03/11/2026 08:04", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Temp", unlock: { type: "allOf", conditions: [{ type: "puzzleSolved", puzzleId: "lot_114" }, { type: "evidenceOpened", evidenceId: "diary" }, { type: "evidenceOpened", evidenceId: "reasons_to_stop" }] }, target: { type: "file", fileId: "gull_0310_receipt" } },
  { id: "gateway", name: "ORNE_GATE.URL", icon: "browser", size: "1 KB", deletedAt: "03/15/2026 08:02", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Favorites", unlock: { type: "puzzleSolved", puzzleId: "lot_114" }, target: { type: "browser", address: "http://orne.miskatonic.edu/gateway/" } },
  { id: "return", name: "RETURN.LBL", icon: "notepad", size: "1 KB", deletedAt: "03/15/2026 11:29", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Temp", unlock: { type: "puzzleSolved", puzzleId: "margin_cipher" }, target: { type: "file", fileId: "return_lbl" } },
  { id: "arkweb", name: "ARKWEB.URL", icon: "browser", size: "1 KB", deletedAt: "03/15/2026 11:31", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Favorites", unlock: { type: "puzzleSolved", puzzleId: "margin_cipher" }, target: { type: "browser", address: "http://www.arkhamwebring.org/preservation/" } },
  { id: "empty", name: "EMPTY.TMP", icon: "notepad", size: "0 KB", deletedAt: "{TOMORROW}", originalPath: "C:\\WINDOWS\\Profiles\\S.BISHOP\\Temp", unlock: { type: "puzzleSolved", puzzleId: "future_log" }, target: { type: "file", fileId: "empty_tmp" } },
  { id: "danforth", name: "DANFORTH.URL", icon: "browser", size: "1 KB", deletedAt: "01/22/1931 06:16", originalPath: "Unknown", unlock: { type: "puzzleSolved", puzzleId: "counting_audio" }, target: { type: "browser", address: "http://www.geocities.com/arkham_heights/danforth.html" } },
  { id: "expedition", name: "EXPEDITION.TMP", icon: "notepad", size: "1 KB", deletedAt: "01/22/1931 06:17", originalPath: "Unknown", unlock: { type: "puzzleSolved", puzzleId: "counting_audio" }, target: { type: "file", fileId: "expedition_tmp" } },
];
