import { UnlockCondition } from "../game/unlock";

/** One registry for every addressable recovered page.  Browser controls must
 * consult this rather than accidentally revealing a deep-cache page early. */
export type BrowserPage =
  | "home" | "results" | "library" | "gazette" | "expedition" | "bellaso"
  | "weather" | "danforth" | "lot" | "coast" | "sarah" | "memo" | "staff"
  | "reader-log" | "graymoor" | "families" | "forum" | "em" | "tom"
  | "tom-guestbook" | "maintenance" | "downloads" | "false-lead" | "not-found"
  | "gull-lantern" | "route-7" | "compat-gateway" | "staff-bulletin"
  | "hydrography" | "web-ring" | "graymoor-return" | "eleanor"
  | "recall-history";

export interface BrowserPageDefinition {
  id: BrowserPage;
  address: string;
  keywords: string[];
  unlock: UnlockCondition;
  pageId?: string;
  evidenceId?: string;
}

const always: UnlockCondition = { type: "always" };
const afterLot: UnlockCondition = { type: "puzzleSolved", puzzleId: "lot_114" };
const afterMargin: UnlockCondition = { type: "puzzleSolved", puzzleId: "margin_cipher" };
const deep: UnlockCondition = { type: "puzzleSolved", puzzleId: "counting_audio" };
/** The coast result consumes the audio solution; searching can never solve it. */
export const canRevealCoastPage = (countingAudioSolved: boolean): boolean =>
  countingAudioSolved;

export const BROWSER_PAGES: readonly BrowserPageDefinition[] = [
  { id: "recall-history", address: "cache://sb-archive-02/history/0314", keywords: [], unlock: { type: "flag", flag: "recall_0314_receipt_seen" }, pageId: "recall-history-0314" },
  { id: "home", address: "http://search.miskatonic.net/", keywords: ["search"], unlock: always },
  { id: "results", address: "http://search.miskatonic.net/search", keywords: [], unlock: always },
  { id: "library", address: "http://www.miskatonic.edu/library/", keywords: ["miskatonic"], unlock: always, pageId: "miskatonic-library-home" },
  { id: "gazette", address: "http://www.arkham-gazette.com/archive/", keywords: ["gazette"], unlock: always, pageId: "arkham-gazette" },
  { id: "bellaso", address: "http://www.miskatonic.edu/library/cryptography/bellaso.htm", keywords: ["bellaso"], unlock: always, pageId: "bellaso-reference" },
  { id: "lot", address: "cache://miskatonic/catalog/MS-WHA-1998-114-II", keywords: [], unlock: afterLot },
  { id: "coast", address: "cache://hydrographic/yhanthlei", keywords: ["yhanthlei"], unlock: { type: "puzzleSolved", puzzleId: "counting_audio" }, pageId: "coastline-yhanthlei", evidenceId: "coastline_archive" },
  { id: "sarah", address: "cache://miskatonic/catalog/2026-bishop-sarah", keywords: [], unlock: { type: "puzzleSolved", puzzleId: "lineage" } },
  { id: "memo", address: "cache://miskatonic/library/incident-memo-2026", keywords: ["memo", "whitfield"], unlock: always, pageId: "library-memo-b2", evidenceId: "whitfield_memo" },
  { id: "staff", address: "http://www.miskatonic.edu/library/staff/armitage.htm", keywords: ["armitage"], unlock: always, pageId: "library-staff-armitage" },
  { id: "reader-log", address: "http://www.miskatonic.edu/library/readers/notices.htm", keywords: ["readerlog"], unlock: always, pageId: "library-reader-notices" },
  { id: "graymoor", address: "http://www.graymoor-antiquarian.com/about/", keywords: ["graymoor"], unlock: always, pageId: "graymoor-history" },
  { id: "graymoor-return", address: "cache://graymoor/returns/GM-114-0310", keywords: ["gm1140310"], unlock: { type: "evidenceOpened", evidenceId: "gull_0310_receipt" }, pageId: "graymoor-return-gm-114-0310" },
  { id: "forum", address: "http://www.miskanet-forums.org/board/folklore/", keywords: ["forum", "miskanet"], unlock: always, pageId: "miskanet-forum" },
  { id: "em", address: "http://www.geocities.com/em_bishop/photos/", keywords: ["embishop"], unlock: always, pageId: "em-personal-page" },
  { id: "tom", address: "http://www.geocities.com/tomalvarez_archive/", keywords: ["tomalvarez"], unlock: always, pageId: "tom-personal-page", evidenceId: "tom_homepage" },
  { id: "maintenance", address: "cache://miskatonic/facilities/B2/", keywords: ["facilities", "humidity"], unlock: always, pageId: "facilities-b2", evidenceId: "maintenance_record" },
  { id: "eleanor", address: "cache://miskatonic/personnel/14-EV", keywords: ["14ev", "eleanorvale"], unlock: { type: "allOf", conditions: [{ type: "puzzleSolved", puzzleId: "future_log" }, { type: "evidenceOpened", evidenceId: "victim_2014" }] }, pageId: "personnel-14-ev" },
  { id: "downloads", address: "http://www.miskanet-files.org/archive-tools/", keywords: ["downloads", "loopback"], unlock: always, pageId: "miskanet-downloads" },
  { id: "false-lead", address: "http://search.miskatonic.net/search", keywords: ["sheknows"], unlock: always, pageId: "false-lead-search" },
  { id: "not-found", address: "res://shdoclc/dnserror.htm", keywords: [], unlock: always },
  { id: "expedition", address: "http://www.miskatonic.edu/geology/pabodie/", keywords: ["pabodie", "expedition"], unlock: deep, pageId: "pabodie-expedition", evidenceId: "pabodie_archive" },
  { id: "weather", address: "http://weather.antarctic-net.org/station/lake/", keywords: ["antarctic", "weather"], unlock: deep, pageId: "antarctic-weather" },
  { id: "danforth", address: "http://www.geocities.com/arkham_heights/danforth.html", keywords: ["danforth", "tekeli"], unlock: deep, pageId: "danforth-personal-cache", evidenceId: "danforth_cache" },
  { id: "families", address: "http://www.innsmouth-historical.org/registry/", keywords: ["innsmouth", "genealogy"], unlock: deep, pageId: "families-registry" },
  { id: "tom-guestbook", address: "http://www.geocities.com/tomalvarez_archive/guestbook.html", keywords: ["guestbook", "visitor0004"], unlock: deep, pageId: "tom-guestbook" },
  { id: "gull-lantern", address: "http://www.gull-lantern-arkham.com/", keywords: ["gull", "lantern", "cafe"], unlock: always, pageId: "gull-lantern" },
  { id: "route-7", address: "http://transit.arkham.gov/route7/", keywords: ["route7", "transit"], unlock: always, pageId: "arkham-route-7" },
  { id: "compat-gateway", address: "http://orne.miskatonic.edu/gateway/", keywords: ["gateway", "compatibility"], unlock: afterLot, pageId: "orne-compat-gateway" },
  { id: "staff-bulletin", address: "http://www.miskatonic.edu/staff/bulletin/", keywords: ["bulletin", "staffbulletin"], unlock: afterLot, pageId: "orne-staff-bulletin" },
  { id: "hydrography", address: "cache://essex-hydro/telemetry/", keywords: ["telemetry", "hydrographic"], unlock: afterMargin, pageId: "essex-hydrography" },
  { id: "web-ring", address: "http://www.arkhamwebring.org/preservation/", keywords: ["arkweb", "webring", "preservation"], unlock: afterMargin, pageId: "arkham-web-ring" },
];

export const PAGE_ADDRESS = Object.fromEntries(BROWSER_PAGES.map((page) => [page.id, page.address])) as Record<BrowserPage, string>;
export const browserPage = (id: BrowserPage) => BROWSER_PAGES.find((page) => page.id === id)!;
export const browserPageFromVisitedId = (pageId: string) => BROWSER_PAGES.find((page) => page.pageId === pageId);
