"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { resolveTokens } from "@/app/utils/narrative";
import {
  validateCoastQuery,
  validateLineageYear,
  validateLotQuery,
} from "@/app/game/validators";
import { puzzleHintsFor } from "@/app/game/puzzles";
import { useI18n } from "@/app/i18n";
import ClueText from "@/app/components/ClueText/ClueText";
import { localizedBrowserText } from "@/app/data/localizedNarrative";
import {
  BROWSER_PAGES,
  browserPage,
  browserPageFromVisitedId,
  BrowserPage,
  PAGE_ADDRESS,
} from "@/app/data/browserPages";
import { isUnlocked } from "@/app/game/unlock";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import "../ArgTools/style.scss";
import "./style.scss";

export type { BrowserPage } from "@/app/data/browserPages";

interface HistoryEntry {
  page: BrowserPage;
  address: string;
}

export { PAGE_ADDRESS } from "@/app/data/browserPages";

const normalize = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();

const RecoveredBrowser = ({
  initialAddress,
}: {
  initialAddress?: string;
}) => {
  const {
    state,
    solvePuzzle,
    attemptPuzzle,
    visitPage,
    isPuzzleSolved,
    discoverEvidence,
    recordNearMiss,
    activePuzzle,
    dispatchGameEvent,
    setFlag,
  } = useProgress();
  const { openWindow } = useWindowManager();
  const { locale, t } = useI18n();
  const unlockContext = {
    flags: state.flags,
    discoveredEvidenceIds: state.discoveredEvidenceIds,
    solvedPuzzleIds: Object.entries(state.puzzles)
      .filter(([, value]) => value.solvedAt)
      .map(([id]) => id) as import("@/app/game/progress").PuzzleId[],
    insightsUnlocked: state.insightsUnlocked,
  };
  const historicalCacheUnlocked = isPuzzleSolved("margin_cipher");
  const deepCacheUnlocked = isPuzzleSolved("counting_audio");
  const requestedInitialPage: BrowserPage = initialAddress
    ? ((Object.entries(PAGE_ADDRESS) as [BrowserPage, string][]).find(
        ([, addr]) => addr === initialAddress
      )?.[0] ??
      (initialAddress.includes("danforth") ? "danforth" : "home"))
    : "home";
  const initialPage: BrowserPage = isUnlocked(browserPage(requestedInitialPage).unlock, unlockContext)
    ? requestedInitialPage
    : "not-found";
  const [page, setPage] = useState<BrowserPage>(initialPage);
  const [address, setAddress] = useState(
    initialPage === "not-found" && requestedInitialPage !== "not-found"
      ? "res://shdoclc/dnserror.htm#CACHE_SEGMENT_NOT_MOUNTED"
      : initialAddress ?? PAGE_ADDRESS[initialPage]
  );
  const [backStack, setBackStack] = useState<HistoryEntry[]>([]);
  const [forwardStack, setForwardStack] = useState<HistoryEntry[]>([]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<"1998" | "2014" | "2026">("2026");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [nearMissMessage, setNearMissMessage] = useState("");
  const browserHint =
    activePuzzle &&
    ["lot_114", "lineage"].includes(activePuzzle) &&
    state.puzzles[activePuzzle].hintsUnlocked > 0
      ? puzzleHintsFor(state.locale, activePuzzle)[
          state.puzzles[activePuzzle].hintsUnlocked - 1
        ]
      : null;
  const eleanorReconciled = state.optionalDiscoveries.includes("eleanor_record");

  const recoverGraymoorReceipt = () => {
    setFlag("graymoor_return_receipt_recovered");
    openWindow({
      id: "notepad-graymoor-return-receipt",
      appType: "notepad",
      title: "RETURN_114.RCP - Notepad",
      props: { fileId: "graymoor_return_receipt", windowClassName: "corrupted" },
    });
  };

  const reconcileEleanorOwner = () => {
    if (!state.discoveredEvidenceIds.includes("record_2014")) return;
    discoverEvidence("eleanor_reconciliation", "personnel-14-ev");
    dispatchGameEvent({
      type: "COMPLETE_OPTIONAL_MISSION",
      missionId: "eleanor_record",
    });
  };

  const secure = address.startsWith("cache://");
  const statusText = useMemo(() => {
    if (page === "not-found") return t("cannotFindServer");
    if (page === "home" || page === "results") return t("cachedWebSearch");
    return secure ? t("recoveredCache") : t("internetZone");
  }, [page, secure, t]);

  const navigate = (
    next: BrowserPage,
    nextAddress = PAGE_ADDRESS[next],
    record = true,
    bypassUnlock = false
  ) => {
    if (!bypassUnlock && !isUnlocked(browserPage(next).unlock, unlockContext)) {
      next = "not-found";
      nextAddress = "res://shdoclc/dnserror.htm#CACHE_SEGMENT_NOT_MOUNTED";
    }
    if (record) {
      setBackStack((items) => [...items, { page, address }]);
      setForwardStack([]);
    }
    setPage(next);
    setAddress(nextAddress);
    setSourceOpen(false);
  };

  const visitAtmospherePage = (
    next: BrowserPage,
    pageId: string,
    evidenceId?: string
  ) => {
    if (!isUnlocked(browserPage(next).unlock, unlockContext)) {
      navigate("not-found", "res://shdoclc/dnserror.htm#CACHE_SEGMENT_NOT_MOUNTED");
      return;
    }
    visitPage(pageId);
    if (evidenceId) discoverEvidence(evidenceId, pageId);
    if (next === "tom" && state.puzzles.future_log.solvedAt) {
      dispatchGameEvent({ type: "TRIGGER_WORLD_REACTION", reactionId: "tom_page_changed" });
    }
    navigate(next);
  };

  const runQuery = (rawQuery: string) => {
    const query = rawQuery.trim();
    const value = normalize(query);
    const compact = value.replace(/\s/g, "");

    if (!query) {
      navigate("home");
      return;
    }
    if (compact.includes("SEARCHMISKATONICNET")) {
      navigate("home");
      return;
    }

    setSearchInput(query);
    setSearchTerm(query);
    setNearMissMessage("");

    const lotValidation = validateLotQuery(query);
    if (lotValidation.accepted) {
      attemptPuzzle("lot_114");
      solvePuzzle("lot_114");
      discoverEvidence("catalogue_lot_114", "catalogue-lot-114");
      visitPage("catalogue-lot-114");
      navigate("lot", PAGE_ADDRESS.lot, true, true);
      return;
    }
    if (!isPuzzleSolved("lot_114") && lotValidation.nearMiss) {
      recordNearMiss("lot_114", lotValidation.nearMiss);
      setNearMissMessage(
        state.locale === "pt-BR"
          ? "O catálogo encontrou quase todos os campos. Um identificador bibliográfico ainda está incompleto."
          : "The catalogue matched most fields. One bibliographic identifier is still incomplete."
      );
    }

    if (
      validateCoastQuery(query) &&
      isPuzzleSolved("margin_cipher")
    ) {
      attemptPuzzle("counting_audio");
      solvePuzzle("counting_audio");
      discoverEvidence("coastline_archive", "coastline-yhanthlei");
      visitPage("coastline-yhanthlei");
      navigate("coast", PAGE_ADDRESS.coast, true, true);
      return;
    }

    const lineageValidation = validateLineageYear(query);
    if (
      lineageValidation.accepted &&
      state.visitedPageIds.includes("coastline-yhanthlei")
    ) {
      attemptPuzzle("lineage");
      solvePuzzle("lineage");
      discoverEvidence("sarah_future_record", "catalogue-2026");
      visitPage("catalogue-2026");
      navigate("sarah", PAGE_ADDRESS.sarah, true, true);
      return;
    }
    if (
      state.visitedPageIds.includes("coastline-yhanthlei") &&
      lineageValidation.nearMiss &&
      !isPuzzleSolved("lineage")
    ) {
      recordNearMiss("lineage", lineageValidation.nearMiss);
      setNearMissMessage(
        state.locale === "pt-BR"
          ? "O índice reconhece o intervalo, mas não esse ponto final."
          : "The index recognizes the interval, but not that endpoint."
      );
    }

    if (compact === "SHEKNOWS") {
      visitPage("false-lead-search");
      navigate("false-lead");
      return;
    }

    const registryMatch = BROWSER_PAGES.find((candidate) => candidate.keywords.some((keyword) => compact.includes(keyword.toUpperCase())));
    if (registryMatch && registryMatch.id !== "home" && registryMatch.id !== "results") {
      visitAtmospherePage(registryMatch.id, registryMatch.pageId ?? registryMatch.id, registryMatch.evidenceId);
      return;
    }
    if (compact.includes("ARKHAMGAZETTE")) {
      visitAtmospherePage("gazette", "arkham-gazette");
      return;
    }
    if (compact.includes("PABODIE") || compact.includes("EXPEDITION")) {
      visitAtmospherePage("expedition", "pabodie-expedition", "pabodie_archive");
      return;
    }
    if (compact.includes("BELLASO")) {
      visitAtmospherePage("bellaso", "bellaso-reference");
      return;
    }
    if (compact.includes("WHITFIELD") || compact.includes("MEMO")) {
      visitAtmospherePage("memo", "library-memo-b2", "whitfield_memo");
      return;
    }
    if (compact.includes("FACILITIES") || compact.includes("MAINTENANCE") || compact.includes("HUMIDITY")) {
      visitAtmospherePage("maintenance", "facilities-b2", "maintenance_record");
      return;
    }
    if (compact.includes("EMBISHOP") || compact.includes("EMSPAGE")) {
      visitAtmospherePage("em", "em-personal-page");
      return;
    }
    if (compact.includes("TOMALVAREZ") || compact.includes("TOMSHOMEPAGE")) {
      visitAtmospherePage("tom", "tom-personal-page", "tom_homepage");
      return;
    }
    if (compact.includes("TOMGUESTBOOK") || compact.includes("VISITOR0004") || compact.includes("GUESTBOOK")) {
      visitAtmospherePage("tom-guestbook", "tom-guestbook");
      return;
    }
    if (compact.includes("LOOPBACK") || compact.includes("ARCHIVETOOLS") || compact.includes("DOWNLOADS")) {
      visitAtmospherePage("downloads", "miskanet-downloads");
      return;
    }
    if (compact.includes("ARMITAGE")) {
      visitAtmospherePage("staff", "library-staff-armitage");
      return;
    }
    if (compact.includes("READERLOG") || compact.includes("READERNOTICE") || compact.includes("READINGROOM")) {
      visitAtmospherePage("reader-log", "library-reader-notices");
      return;
    }
    if (compact.includes("GRAYMOOR")) {
      visitAtmospherePage("graymoor", "graymoor-history");
      return;
    }
    if (
      compact.includes("INNSMOUTH") ||
      compact.includes("HISTORICALSOCIETY") ||
      compact.includes("OLDFAMILIES") ||
      compact.includes("GENEALOGY")
    ) {
      visitAtmospherePage("families", "families-registry");
      return;
    }
    if (
      compact.includes("FORUM") ||
      compact.includes("MISKANET") ||
      compact.includes("BBS") ||
      compact.includes("CRYPTOZOOLOGY")
    ) {
      visitAtmospherePage("forum", "miskanet-forum");
      return;
    }
    if (compact.includes("ANTARCTIC") || compact.includes("WEATHER")) {
      visitAtmospherePage("weather", "antarctic-weather");
      return;
    }
    if (compact.includes("MISKATONIC") || value === "ABOUT HOME") {
      visitAtmospherePage("library", "miskatonic-library-home");
      return;
    }

    attemptPuzzle(isPuzzleSolved("counting_audio") ? "lineage" : "lot_114");
    navigate(
      "results",
      `${PAGE_ADDRESS.results}?q=${encodeURIComponent(query)}`
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    runQuery(address);
  };

  const goBack = () => {
    const previous = backStack.at(-1);
    if (!previous) return;
    setForwardStack((items) => [...items, { page, address }]);
    setBackStack((items) => items.slice(0, -1));
    setPage(previous.page);
    setAddress(previous.address);
  };

  const goForward = () => {
    const next = forwardStack.at(-1);
    if (!next) return;
    setBackStack((items) => [...items, { page, address }]);
    setForwardStack((items) => items.slice(0, -1));
    setPage(next.page);
    setAddress(next.address);
  };

  return (
    <div className="arg-tool recovered-browser">
      <div className="arg-tool__menubar">
        <span>{t("menuFile")}</span><span>{t("menuEdit")}</span><span>{t("menuView")}</span><span>{t("menuFavorites")}</span><span>{t("menuTools")}</span><span>{t("help")}</span>
      </div>
      <div className="browser-buttonbar">
        <button className="browser-tool button" type="button" disabled={backStack.length === 0} onClick={goBack}>
          <span>←</span>{t("back")}
        </button>
        <button className="browser-tool button" type="button" disabled={forwardStack.length === 0} onClick={goForward}>
          <span>→</span>{t("forwardLabel")}
        </button>
        <button className="browser-tool button" type="button" onClick={() => navigate("home")}>
          <span>⌂</span>{t("homeLabel")}
        </button>
        <button className={`browser-tool button ${favoritesOpen ? "active" : ""}`} type="button" onClick={() => setFavoritesOpen((value) => !value)}>
          <span>★</span>{t("menuFavorites")}
        </button>
        <button className={`browser-tool button ${historyOpen ? "active" : ""}`} type="button" onClick={() => setHistoryOpen((value) => !value)}>
          <span>▤</span>History
        </button>
        <button className={`browser-tool button ${sourceOpen ? "active" : ""}`} type="button" onClick={() => setSourceOpen((value) => !value)}>
          <span>&lt;/&gt;</span>Source
        </button>
      </div>
      <form className="arg-tool__toolbar browser-address" onSubmit={submit}>
        <label htmlFor="archive-address">{t("addressLabel")}</label>
        <input
          id="archive-address"
          value={address}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setAddress(event.target.value)}
          aria-label="Internet address or catalogue search"
        />
        <button className="button" type="submit">{t("goLabel")}</button>
      </form>

      <div className="browser-body">
        {favoritesOpen && (
          <aside className="browser-favorites">
            <strong>{t("menuFavorites")}</strong>
            <button onClick={() => visitAtmospherePage("library", "miskatonic-library-home")}>Miskatonic Library</button>
            <button onClick={() => visitAtmospherePage("gazette", "arkham-gazette")}>Arkham Gazette</button>
            <button onClick={() => visitAtmospherePage("gull-lantern", "gull-lantern")}>Gull &amp; Lantern Café</button>
            <button onClick={() => visitAtmospherePage("route-7", "arkham-route-7")}>Arkham Transit — Route 7</button>
            {isPuzzleSolved("lot_114") && <>
              <button onClick={() => visitAtmospherePage("compat-gateway", "orne-compat-gateway")}>Orne Compatibility Gateway</button>
              <button onClick={() => visitAtmospherePage("staff-bulletin", "orne-staff-bulletin")}>Orne Staff Bulletin</button>
            </>}
            {isPuzzleSolved("margin_cipher") && <>
              <button onClick={() => visitAtmospherePage("hydrography", "essex-hydrography")}>Essex Hydrographic Telemetry</button>
              <button onClick={() => visitAtmospherePage("web-ring", "arkham-web-ring")}>Arkham Preservation Web Ring</button>
            </>}
            {deepCacheUnlocked && (
              <>
                <button onClick={() => visitAtmospherePage("expedition", "pabodie-expedition")}>1930 Expedition</button>
                <button onClick={() => visitAtmospherePage("weather", "antarctic-weather")}>Lake Weather</button>
              </>
            )}
            {historicalCacheUnlocked && (
              <button onClick={() => visitAtmospherePage("families", "families-registry")}>Old Families of the Coast</button>
            )}
            <button onClick={() => visitAtmospherePage("forum", "miskanet-forum")}>MiskaNet Research Forum</button>
            <button onClick={() => visitAtmospherePage("reader-log", "library-reader-notices")}>Orne Reader Notices</button>
            <button onClick={() => visitAtmospherePage("em", "em-personal-page")}>Em&apos;s Photos</button>
            <button onClick={() => visitAtmospherePage("tom", "tom-personal-page", "tom_homepage")}>Tom&apos;s Homepage</button>
            {deepCacheUnlocked && (
              <button onClick={() => visitAtmospherePage("tom-guestbook", "tom-guestbook")}>Tom&apos;s Guestbook</button>
            )}
            <div />
            <small>{t("linksImportedNote")}</small>
          </aside>
        )}
        {historyOpen && (
          <aside className="browser-favorites browser-history">
            <strong>History</strong>
            {state.visitedPageIds.length === 0 && <small>No cached pages opened.</small>}
            {state.visitedPageIds.slice().reverse().slice(0, 14).map((id) => {
              const visited = browserPageFromVisitedId(id);
              return <button key={id} onClick={() => visited ? visitAtmospherePage(visited.id, id, visited.evidenceId) : navigate("not-found")}>
                {visited?.address ?? id}
              </button>;
            })}
            {state.puzzles.lineage.solvedAt && (
              <button className="browser-history__future" onClick={() => {
                setSearchInput("2026");
                dispatchGameEvent({ type: "TRIGGER_WORLD_REACTION", reactionId: "future_search" });
              }}>
                {resolveTokens("{TOMORROW}")} — search not performed
              </button>
            )}
          </aside>
        )}

        <div className="arg-tool__content">
          {sourceOpen && (
            <div className="browser-source">
              <header>
                <strong>Source: {address}</strong>
                <button className="button" onClick={() => setSourceOpen(false)}>×</button>
              </header>
              <pre>{`<!-- RECOVERED CACHE COPY -->
<meta name="archived" content="${snapshot}" />
<meta name="reader" content="${state.puzzles.future_log.solvedAt ? state.playerName || "NEXT USER" : "[unresolved]"}" />
<meta name="next-read" content="${state.puzzles.future_log.solvedAt ? resolveTokens("{TOMORROW}") : "[not indexed]"}" />
<body data-page="${page}">
  <!-- ${state.puzzles.future_log.solvedAt ? "The source contains one more visitor than the counter." : "Recovered cache body incomplete."} -->
</body>`}</pre>
            </div>
          )}
          {page === "home" && (
            <div className="retro-search-home">
              <div className="retro-search-logo" aria-label="Miskatonic Search">
                <span>M</span><span>i</span><span>s</span><span>k</span><span>a</span><span>t</span><span>o</span><span>n</span><span>i</span><span>c</span>
                <small>Search!</small>
              </div>
              <p className="retro-search-tagline">
                Search Sarah&apos;s recovered copy of the World Wide Web
              </p>
              <form
                className="retro-search-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  runQuery(searchInput);
                }}
              >
                <label htmlFor="miskatonic-search">{t("searchCachedWebLabel")}</label>
                <input
                  id="miskatonic-search"
                  autoFocus
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                <div>
                  <button type="submit">{t("miskatonicSearchButton")}</button>
                  {deepCacheUnlocked && (
                    <button
                      type="button"
                      onClick={() =>
                        visitAtmospherePage(
                          "danforth",
                          "danforth-personal-cache",
                          "danforth_cache"
                        )
                      }
                    >
                      {t("feelingUnlucky")}
                    </button>
                  )}
                </div>
              </form>
              <p className="retro-search-tip">{t("searchTip")}</p>
              {browserHint && (
                <div className="retro-search-index-note">
                  <strong>RECOVERED AUTOCOMPLETE:</strong> {browserHint}
                </div>
              )}
              <div className="retro-search-directory">
                <strong>{t("cachedPagesLabel")}</strong>
                <button onClick={() => visitAtmospherePage("library", "miskatonic-library-home")}>University</button>
                <span> - </span>
                <button onClick={() => visitAtmospherePage("gazette", "arkham-gazette")}>News</button>
                <span> - </span>
                <button onClick={() => visitAtmospherePage("gull-lantern", "gull-lantern")}>Café</button>
                <span> - </span>
                <button onClick={() => visitAtmospherePage("route-7", "arkham-route-7")}>Transit</button>
                <span> - </span>
                {deepCacheUnlocked && (
                  <>
                    <button onClick={() => visitAtmospherePage("expedition", "pabodie-expedition")}>Science</button>
                    <span> - </span>
                    <button onClick={() => visitAtmospherePage("weather", "antarctic-weather")}>Weather</button>
                    <span> - </span>
                  </>
                )}
                {historicalCacheUnlocked && (
                  <>
                    <button onClick={() => visitAtmospherePage("families", "families-registry")}>Genealogy</button>
                    <span> - </span>
                  </>
                )}
                <button onClick={() => visitAtmospherePage("forum", "miskanet-forum")}>Forums</button>
                <span> - </span>
                <button onClick={() => visitAtmospherePage("reader-log", "library-reader-notices")}>Reader Notices</button>
              </div>
              <footer>
                © 2000 Miskatonic Network · About · Help · Add URL
                <br />
                <em>41 pages available offline</em>
              </footer>
            </div>
          )}

          {page === "results" && (
            <div className="retro-search-results">
              <header>
                <div className="retro-search-logo retro-search-logo--small" aria-label="Miskatonic Search">
                  <span>M</span><span>i</span><span>s</span><span>k</span><span>a</span><span>t</span><span>o</span><span>n</span><span>i</span><span>c</span>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    runQuery(searchInput);
                  }}
                >
                  <input
                    aria-label="Search cached web"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                  <button type="submit">Search</button>
                </form>
              </header>
              <div className="retro-search-summary">
                Cached web results for <strong>{searchTerm}</strong>
              </div>
              {nearMissMessage && (
                <div className="retro-search-index-note">
                  <strong>CATALOGUE INDEX:</strong> {nearMissMessage}
                </div>
              )}
              <div className="retro-result-list">
                <button onClick={() => visitAtmospherePage("library", "miskatonic-library-home")}>
                  <strong>Miskatonic University — Orne Library</strong>
                  <span>Special Collections catalogue, staff references and restricted holdings.</span>
                  <small>www.miskatonic.edu/library/</small>
                </button>
                <button onClick={() => visitAtmospherePage("gazette", "arkham-gazette")}>
                  <strong>The Arkham Gazette — Local Archive</strong>
                  <span>University news, missing-person reports and searchable editions from 1823 onward.</span>
                  <small>www.arkham-gazette.com/archive/</small>
                </button>
                <button onClick={() => visitAtmospherePage("gull-lantern", "gull-lantern")}>
                  <strong>Gull &amp; Lantern Café</strong><span>Reservations, local coffee and a familiar name in the guest list.</span><small>www.gull-lantern-arkham.com/</small>
                </button>
                <button onClick={() => visitAtmospherePage("route-7", "arkham-route-7")}>
                  <strong>Arkham Transit — Route 7</strong><span>Weekday service from Orne Library to the waterfront.</span><small>transit.arkham.gov/route7/</small>
                </button>
                {isPuzzleSolved("lot_114") && <>
                  <button onClick={() => visitAtmospherePage("compat-gateway", "orne-compat-gateway")}><strong>Orne Compatibility Gateway</strong><span>Legacy mailbox mirror status.</span><small>orne.miskatonic.edu/gateway/</small></button>
                  <button onClick={() => visitAtmospherePage("staff-bulletin", "orne-staff-bulletin")}><strong>Orne Staff Bulletin</strong><span>Staff notices and campus life.</span><small>www.miskatonic.edu/staff/bulletin/</small></button>
                </>}
                {isPuzzleSolved("margin_cipher") && <>
                  <button onClick={() => visitAtmospherePage("hydrography", "essex-hydrography")}><strong>Essex Hydrographic Telemetry</strong><span>Instrument readings from inland monitoring stations.</span><small>cache://essex-hydro/telemetry/</small></button>
                  <button onClick={() => visitAtmospherePage("web-ring", "arkham-web-ring")}><strong>Arkham Preservation Web Ring</strong><span>Preserving the small web, one dead link at a time.</span><small>www.arkhamwebring.org/preservation/</small></button>
                </>}
                {deepCacheUnlocked && (
                  <button onClick={() => visitAtmospherePage("expedition", "pabodie-expedition")}>
                    <strong>Pabodie Antarctic Expedition, 1930–31</strong>
                    <span>Department of Geology photographs, personnel records and field notes.</span>
                    <small>www.miskatonic.edu/geology/pabodie/</small>
                  </button>
                )}
                <button onClick={() => visitAtmospherePage("bellaso", "bellaso-reference")}>
                  <strong>Cryptography Reference Shelf: Moving Alphabets</strong>
                  <span>Staff reference note compiled by M. Bishop in 1998.</span>
                  <small>www.miskatonic.edu/library/cryptography/</small>
                </button>
                <button onClick={() => visitAtmospherePage("reader-log", "library-reader-notices")}>
                  <strong>Orne Library — Reading Room Notices</strong>
                  <span>Reader policies, accession desk updates and a damaged sign-in export.</span>
                  <small>www.miskatonic.edu/library/readers/</small>
                </button>
                {historicalCacheUnlocked && (
                  <button onClick={() => visitAtmospherePage("families", "families-registry")}>
                    <strong>Innsmouth Historical &amp; Genealogical Society</strong>
                    <span>Family registry for the old coastal lines, compiled since 1952.</span>
                    <small>www.innsmouth-historical.org/registry/</small>
                  </button>
                )}
                <button onClick={() => visitAtmospherePage("forum", "miskanet-forum")}>
                  <strong>MiskaNet Research Forum</strong>
                  <span>Folklore, cryptozoology and local history discussion board.</span>
                  <small>www.miskanet-forums.org/board/folklore/</small>
                </button>
                {deepCacheUnlocked && (
                  <button onClick={() => visitAtmospherePage("tom-guestbook", "tom-guestbook")}>
                    <strong>Tom Alvarez&apos;s Guestbook</strong>
                    <span>A personal homepage guestbook with one visitor too many.</span>
                    <small>www.geocities.com/tomalvarez_archive/guestbook.html</small>
                  </button>
                )}
              </div>
              <p className="retro-search-help">
                Not the record you expected? Older accessions are indexed by
                provenance, year, lot and volume.
              </p>
            </div>
          )}

          {page === "library" && (
            <article className="site-library">
              <header>
                <div className="site-seal">MU</div>
                <div><p>MISKATONIC UNIVERSITY</p><h1>Orne Library</h1></div>
              </header>
              <nav>
                HOME | CATALOGUE | COLLECTIONS | READER SERVICES |{" "}
                <button className="web-link web-link--inline" onClick={() => visitAtmospherePage("staff", "library-staff-armitage")}>STAFF</button>
              </nav>
              <div className="browser-snapshots">
                <strong>Wayback copies:</strong>
                {(["1998", "2014", "2026"] as const).map((year) => (
                  <button
                    className={snapshot === year ? "active" : ""}
                    key={year}
                    onClick={() => setSnapshot(year)}
                  >
                    {year}
                  </button>
                ))}
                <span>
                  {snapshot === "1998"
                    ? "Whateley accession pending. Volume II field left blank."
                    : snapshot === "2014"
                      ? "One restricted incident exists without an owner."
                      : "Current cache. Three staff records hidden by administrative order."}
                </span>
              </div>
              <div className="site-columns">
                <section>
                  <h2>Special Collections Gateway</h2>
                  <p>This cached gateway contains 41 catalogue records and eight staff reference pages.</p>
                  <h3>Quick links</h3>
                  <button className="web-link" onClick={() => visitAtmospherePage("bellaso", "bellaso-reference")}>Cryptography reference shelf: moving alphabets</button>
                  <button className="web-link" onClick={() => visitAtmospherePage("expedition", "pabodie-expedition")}>Departmental archive: Pabodie Expedition</button>
                  <button className="web-link" onClick={() => visitAtmospherePage("staff", "library-staff-armitage")}>Staff directory: Special Collections</button>
                  <button className="web-link" onClick={() => visitAtmospherePage("reader-log", "library-reader-notices")}>Reading room notices and sign-in exports</button>
                  <button className="web-link" onClick={() => visitAtmospherePage("families", "families-registry")}>External reference: Innsmouth Historical &amp; Genealogical Society</button>
                  <h3>Restricted holdings register</h3>
                  <table className="browser-table"><tbody>
                    <tr><td>MS-WHA-1998-114</td><td>Whateley deposit, Vol. II unaccounted</td></tr>
                    <tr><td>MS-OLM-1846-002</td><td>Marriage register, sealed by donor request</td></tr>
                    <tr><td>MS-GLM-1928-071</td><td>Correspondence, access denied pending review</td></tr>
                    <tr><td>MS-CRT-1977-014</td><td>Volunteer desk log, withdrawn from circulation</td></tr>
                  </tbody></table>
                </section>
                <aside>
                  <strong>Catalogue notice</strong>
                  <p>Accession records before 2001 may require exact provenance, deposit year, lot, and volume.</p>
                  <p>Last cache: 03/16/2026 03:09</p>
                </aside>
              </div>
            </article>
          )}

          {page === "gazette" && (
            <article className="site-gazette">
              <header><small>Serving Arkham &amp; Essex County since 1823</small><h1>THE ARKHAM GAZETTE</h1><p>ARCHIVE MIRROR — TUESDAY EDITION</p></header>
              <div className="gazette-grid">
                <section>
                  <h2>University declines comment on renewed Bishop inquiry</h2>
                  <p>A campus spokesperson called standing water found in a locked office “a facilities matter.” The missing cataloguer&apos;s family disputes that account.</p>
                  <h3>From the archive</h3>
                  <dl className="gazette-archive">
                    <dt>1863</dt>
                    <dd>Coastal family vanishes during survey work — second such incident in the memory of township elders.</dd>
                    <dt>1912</dt>
                    <dd>Akeley correspondent reported missing — family describes letters that &ldquo;answer questions not yet asked.&rdquo;</dd>
                    <dt>1931</dt>
                    <dd>Geologist Dyer returns without Gedney, urges trustees to abandon further Antarctic work. Flight records list one additional mountain range not present on official maps.</dd>
                    <dt>1949</dt>
                    <dd>Carter researcher&apos;s notes describe &ldquo;counting in the walls.&rdquo; Notes donated to the University after his death, restricted at family request.</dd>
                    <dt>1977</dt>
                    <dd>Library volunteer reported missing. Desk log shows entries dated the following week.</dd>
                    <dt>1998</dt>
                    <dd>Cataloguer M. Bishop reported missing. Second volume of the Whateley deposit never recovered.</dd>
                  </dl>
                </section>
                <aside>
                  <h3>Weather</h3><p>Heavy fog. Tides unusually high.</p>
                  <h3>Classifieds</h3>
                  <p>Bookseller seeks buyer for incomplete Whateley estate lot. No returns.</p>
                  <p>
                    <button className="web-link web-link--inline" onClick={() => visitAtmospherePage("families", "families-registry")}>Innsmouth Historical &amp; Genealogical Society</button>
                    {" "}— new member inquiries welcome.
                  </p>
                  <p>
                    <button className="web-link web-link--inline" onClick={() => visitAtmospherePage("forum", "miskanet-forum")}>MiskaNet Research Forum</button>
                    {" "}— folklore &amp; local history board.
                  </p>
                </aside>
              </div>
            </article>
          )}

          {page === "expedition" && (
            <article className="site-expedition">
              <header><span>DEPARTMENT OF GEOLOGY</span><h1>Pabodie Antarctic Expedition, 1930–31</h1></header>
              <div className="mountain-panorama" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <p className="expedition-caption">Panorama assembled from Lake camp negatives. Frame 7 rejected: double exposure.</p>
              <div className="expedition-record">
                <dl>
                  <dt>Expedition lead</dt><dd>Prof. William Dyer</dd>
                  <dt>Equipment</dt><dd>Pabodie drill; four aircraft; shortwave station</dd>
                  <dt>Lake party</dt><dd>17 men; 16 recovered</dd>
                  <dt>Collections</dt><dd>Fourteen damaged biological specimens; access withdrawn</dd>
                  <dt>Personnel notes</dt>
                  <dd>
                    Danforth discharged from further fieldwork, cause
                    unspecified. Gedney listed as lost in transit; no remains
                    recovered. Dyer resigned his field posts within the year.
                  </dd>
                </dl>
                <aside>
                  <strong>Archive anomaly</strong>
                  <p>
                    Danforth&apos;s final camera plate contains peaks behind the recorded range.
                    {state.puzzles.lineage.solvedAt
                      ? " The emulsion date is tomorrow."
                      : " The emulsion date is missing from the cache."}
                  </p>
                  <button className="web-link damaged-frame" onClick={() => visitAtmospherePage("danforth", "danforth-personal-cache", "danforth_cache")}>View damaged frame 7</button>
                  <button className="web-link" onClick={() => visitAtmospherePage("families", "families-registry")}>Dyer family record (Historical Society)</button>
                </aside>
              </div>
            </article>
          )}

          {page === "bellaso" && (
            <article className="site-bellaso">
              <h1>Reference Note 12: Giovan Battista Bellaso</h1>
              <p className="byline">Compiled for Special Collections staff — M. Bishop, 1998</p>
              <p>Bellaso described a polyalphabetic method in which a repeating keyword selects changing cipher alphabets. Later catalogues frequently misattribute the family of methods to Vigenère.</p>
              <div className="bellaso-table">
                <span>Method family</span><strong>moving / polyalphabetic alphabet</strong>
                <span>Common modern label</span><strong>Vigenère cipher</strong>
                <span>Required object</span><strong>keyword</strong>
                <span>First documented</span><strong>1553, La Cifra del Sig. Giovan Battista Bellaso</strong>
              </div>
              <p>
                This reference note was filed alongside the Whateley deposit
                accession records; the cataloguer appears to have consulted
                it while transcribing chapter seven of Volume I.
              </p>
              <p className="site-footnote">Offline reference: this page was opened by Sarah Bishop at 03:10 and printed twice.</p>
            </article>
          )}

          {page === "weather" && (
            <article className="site-weather">
              <h1>ANTARCTIC-NET :: AUTOMATED STATION LAKE</h1>
              <div className="weather-terminal">
                <p>LINK STATUS .... MIRROR / 65 YEARS STALE</p>
                <p>TEMP ........... -41.2 C</p>
                <p>WIND ........... DATA OUT OF RANGE</p>
                <p>BAROMETER ...... FALLING</p>
                <p>AUDIO CARRIER .. TEKELI-LI [FILTERED]</p>
                <p>HORIZON ........ SECOND RIDGELINE DETECTED</p>
                <p>CREW ........... 0 ON STATION / 17 ON RECORD</p>
                <p>LAST RELIEF .... UNSCHEDULED, 1931</p>
              </div>
              <small>
                Station clocks are synchronized by shortwave. Current station date: {state.puzzles.lineage.solvedAt
                  ? resolveTokens("{TOMORROW}")
                  : "1931-02-18"}
              </small>
            </article>
          )}

          {page === "danforth" && (
            <article className="site-danforth">
              <div className="stars">★　·　✦　·　★</div>
              <h1>DANFORTH&apos;S ANTARCTIC TRUTH PAGE</h1>
              <p className="blink">THIS PAGE LOOKS BEST IN NETSCAPE 3.0 AT 800×600</p>
              <div className="danforth-counter">VISITOR 00000001</div>
              <p>They called it a mirage because a mirage ends when you stop looking.</p>
              <p>The city was not built for bodies that walk forward. The carvings were a history, and the history was afraid of something lower in the ice.</p>
              <p className="tekeli">TEKELI—LI&nbsp;&nbsp; TEKELI—LI&nbsp;&nbsp; TEKELI—LI</p>
              <p>
                {state.puzzles.lineage.solvedAt
                  ? localizedBrowserText(
                      "danforth_sarah_photo",
                      "I saw Sarah Bishop in the photograph attached to the scan. The photograph was taken before she was born.",
                      locale
                    )
                  : locale === "pt-BR"
                    ? "Há uma figura no scan que o índice não consegue nomear."
                    : "There is a figure in the scan the index cannot name."}
              </p>
              <p>They took my recommendation off the department site in 1932. It is still true. I have not changed one word since.</p>
              <hr />
              <small>
                Last updated: {state.puzzles.lineage.solvedAt ? resolveTokens("{TOMORROW}") : "1932-01-04"}
                {state.puzzles.lineage.solvedAt && " — webmaster email returned: USER DOES NOT EXIST YET"}
              </small>
            </article>
          )}

          {page === "lot" && (
            <article className="arg-tool__paper">
              <p className="arg-tool__kicker">CATALOGUE RECORD / RESTRICTED</p>
              <h2>MS-WHA-1998-114/II</h2>
              <dl className="arg-tool__properties">
                <dt>Deposit</dt>
                <dd>
                  <ClueText
                    as="span"
                    text="Whateley estate"
                    clues={[
                      {
                        tokenId: "family-whateley",
                        snippet: { en: "Whateley", "pt-BR": "Whateley" },
                      },
                    ]}
                  />
                </dd>
                <dt>Accession</dt><dd>1998 / M. Bishop</dd>
                <dt>Vendor lot</dt><dd>114</dd>
                <dt>Description</dt><dd>Bound MS., Volume II, marginal hand</dd>
                <dt>Attachment</dt><dd>114_verso.tif — recovered to Sarah&apos;s files</dd>
                <dt>Vendor</dt>
                <dd>
                  <button className="web-link web-link--inline" onClick={() => visitAtmospherePage("graymoor", "graymoor-history")}>Graymoor Antiquarian Booksellers</button>
                </dd>
              </dl>
              <p>The verso scan was rejected by OCR because its orientation and tonal range do not match the front page.</p>
              <p className="browser-redaction">
                ADVISORY: previous cataloguers of this deposit report headaches, lost time,
                and handwriting they do not recognize as their own. Access restricted to
                staff with a documented research need.
              </p>
            </article>
          )}

          {page === "coast" && (
            <article className="arg-tool__paper">
              <p className="arg-tool__kicker">HYDROGRAPHIC NAME AUTHORITY — CACHE</p>
              <h2>Y&apos;ha-nthlei / suppressed locality</h2>
              <p>Reader incidents associated with the same marginal hand:</p>
              <table className="browser-table"><tbody>
                {[1798, 1863, 1912, 1949, 1977, 1998, 2014].map((year) => <tr key={year}><td>{year}</td><td>record sealed</td></tr>)}
                <tr><td>?</td><td>record created; year index missing</td></tr>
              </tbody></table>
              <p className="browser-redaction">INTERVAL NOTE: each gap retains approximately ¾ of the previous gap.</p>
              <p>Maritime Survey Addendum: magnetic declination at this position is unstable;
              soundings vary 40–600 fathoms depending on time of day. Local advisories from
              1951 recommend against night anchorage. Access to the original survey requires
              Maritime Authority clearance.</p>
              <button className="web-link" onClick={() => visitAtmospherePage("families", "families-registry")}>Cross-reference: Innsmouth Historical &amp; Genealogical Society</button>
            </article>
          )}

          {page === "sarah" && (
            <article className="arg-tool__paper browser-future-record">
              <p className="arg-tool__kicker">CATALOGUE RECORD — CREATED {resolveTokens("{TOMORROW}")}</p>
              <h2>2026 / BISHOP, SARAH</h2>
              <p>Status: cataloguer incorporated into holding.</p>
              <p>Next observer: {state.playerName || "NEXT USER"}</p>
              <p>Access sequence written to ACCESS_LOG.TXT.</p>
            </article>
          )}

          {page === "memo" && (
            <article className="arg-tool__paper">
              <p className="arg-tool__kicker">INTERNAL MEMO — ORNE LIBRARY SPECIAL COLLECTIONS</p>
              <dl className="arg-tool__properties">
                <dt>To</dt><dd>Director</dd>
                <dt>From</dt><dd>Whitfield</dd>
                <dt>Re</dt><dd>Unusual incidents, Staff B2</dd>
                <dt>Date</dt><dd>2026-03-15</dd>
              </dl>
              <p>
                Sarah Bishop&apos;s workstation has now been found unoccupied three times this
                week. The floor reading remains 91% humidity despite running the dehumidifier.
                The machine is not leaking.
              </p>
              <p className="browser-redaction">
                I recommend we restrict access to the Whateley materials and contact the
                university legal office. Is this situation precedented?
              </p>
            </article>
          )}

          {page === "staff" && (
            <article className="site-library">
              <header>
                <div className="site-seal">MU</div>
                <div><p>MISKATONIC UNIVERSITY</p><h1>Special Collections — Staff</h1></div>
              </header>
              <nav>HOME | CATALOGUE | COLLECTIONS | READER SERVICES | STAFF</nav>
              <div className="site-columns">
                <section>
                  <h2>Dr. Robert Armitage</h2>
                  <p>Restricted Archives &amp; Provenance Review. Twenty-eight years on staff.</p>
                  <p>
                    Reviewed the original 1998 Whateley accession alongside M. Bishop and
                    restricted public access to the deposit shortly after her disappearance.
                    His 2019 paper, &ldquo;Containment vs. Access: Ethical Boundaries in
                    Restricted Collections,&rdquo; was rejected by three journals. He no longer
                    comments on the deposit for the record.
                  </p>
                </section>
                <aside>
                  <strong>Catalogue notice</strong>
                  <p>Direct inquiries regarding MS-WHA-1998-114 to the Director&apos;s office.</p>
                </aside>
              </div>
            </article>
          )}

          {page === "reader-log" && (
            <article className="site-library">
              <header>
                <div className="site-seal">MU</div>
                <div><p>ORNE LIBRARY</p><h1>Reading Room Notices</h1></div>
              </header>
              <nav>HOME | CATALOGUE | COLLECTIONS | READER SERVICES | NOTICES</nav>
              <div className="site-columns">
                <section>
                  <h2>Reader Services Bulletin</h2>
                  <p>Recovered cache of public notices posted near the Special Collections desk.</p>
                  <table className="browser-table"><tbody>
                    <tr><th>Date</th><th>Notice</th></tr>
                    <tr><td>2026-03-04</td><td>Readers may not photograph restricted accession slips without staff approval.</td></tr>
                    <tr><td>2026-03-09</td><td>Temporary relocation of the B2 dehumidifier log to Facilities.</td></tr>
                    <tr><td>2026-03-16</td><td>SB-ARCHIVE-02 removed from public terminal rotation.</td></tr>
                  </tbody></table>
                  <h3>Damaged export</h3>
                  <p className="browser-redaction">
                    SIGN-IN CSV recovered with a duplicate row. The duplicate has tomorrow&apos;s timestamp and no reader card number.
                  </p>
                </section>
                <aside>
                  <strong>Desk note</strong>
                  <p>Do not complete blank shelfmark fields on behalf of readers. Escalate to R. Armitage.</p>
                  <button className="web-link" onClick={() => visitAtmospherePage("staff", "library-staff-armitage")}>Open staff directory</button>
                </aside>
              </div>
            </article>
          )}

          {page === "graymoor" && (
            <article className="site-gazette">
              <header><small>Est. 1961</small><h1>GRAYMOOR ANTIQUARIAN BOOKSELLERS</h1><p>ABOUT THE HOUSE</p></header>
              <div className="gazette-grid">
                <section>
                  <h2>Specializing in deposit-estate lots of unverified provenance</h2>
                  <p>
                    We handle library deaccessions, estate liquidations, and lots whose chain
                    of custody cannot be fully documented. All sales are final; we do not
                    accept returns on unverified-provenance material.
                  </p>
                </section>
                <aside>
                  <h3>Note from the desk</h3>
                  <p>
                    Several lots from this house have been resold by estates whose original
                    buyer did not return to collect a second item. We are not able to comment
                    on individual sale histories.
                  </p>
                </aside>
              </div>
            </article>
          )}

          {page === "graymoor-return" && (
            <article className="arg-tool__paper site-maintenance">
              <p className="arg-tool__kicker">GRAYMOOR / RETURN TRACE CACHE</p>
              <h2>GM-114-0310</h2>
              <p>
                {locale === "pt-BR"
                  ? "Cópia local do rastreamento anotado por Sarah no verso do recibo do café."
                  : "Local copy of the tracking number Sarah wrote on the back of the café receipt."}
              </p>
              <table className="browser-table"><tbody>
                <tr><th>{locale === "pt-BR" ? "Evento" : "Event"}</th><th>{locale === "pt-BR" ? "Horário" : "Time"}</th></tr>
                <tr><td>{locale === "pt-BR" ? "Coleta solicitada" : "Pickup requested"}</td><td>2026-03-10 16:41</td></tr>
                <tr><td>{locale === "pt-BR" ? "Pacote aceito" : "Parcel accepted"}</td><td>2026-03-11 09:14</td></tr>
                <tr className="browser-redaction"><td>{locale === "pt-BR" ? "Rota de retorno criada" : "Return route created"}</td><td>2026-03-11 09:13</td></tr>
                <tr><td>{locale === "pt-BR" ? "Etiqueta impressa" : "Label printed"}</td><td>2026-03-12 08:03</td></tr>
              </tbody></table>
              <p className="browser-redaction">
                {locale === "pt-BR"
                  ? "A rota de retorno existia um minuto antes de a Graymoor aceitar o pacote."
                  : "The return route existed one minute before Graymoor accepted the parcel."}
              </p>
              <button className="button" type="button" onClick={recoverGraymoorReceipt}>
                {locale === "pt-BR" ? "Abrir comprovante em cache" : "Open cached receipt"}
              </button>
            </article>
          )}

          {page === "eleanor" && (
            <article className="arg-tool__paper site-maintenance">
              <p className="arg-tool__kicker">MISKATONIC PERSONNEL MIRROR / 14-EV</p>
              <h2>Eleanor Vale</h2>
              <dl className="arg-tool__properties">
                <dt>{locale === "pt-BR" ? "Cargo" : "Role"}</dt>
                <dd>{locale === "pt-BR" ? "Contratada de digitalização noturna" : "Night digitization contractor"}</dd>
                <dt>{locale === "pt-BR" ? "Programa" : "Program"}</dt>
                <dd>{locale === "pt-BR" ? "Preservação de bibliotecas" : "Library preservation"}</dd>
                <dt>{locale === "pt-BR" ? "Projeto" : "Project"}</dt>
                <dd>{locale === "pt-BR" ? "Histórias orais de Essex County" : "Essex County oral histories"}</dd>
                <dt>{locale === "pt-BR" ? "Última nota" : "Last note"}</dt>
                <dd>{locale === "pt-BR" ? "Ligar para a mãe depois das 08:00." : "Call mother after 08:00."}</dd>
              </dl>
              <hr />
              <h3>{locale === "pt-BR" ? "Reconciliação do espelho" : "Mirror reconciliation"}</h3>
              {!state.discoveredEvidenceIds.includes("record_2014") ? (
                <p className="browser-redaction">
                  {locale === "pt-BR"
                    ? "REGISTRO LOCAL AUSENTE: abra 2014_RECORD.DAT antes de confrontar o proprietário."
                    : "LOCAL RECORD MISSING: open 2014_RECORD.DAT before reconciling its owner."}
                </p>
              ) : (
                <>
                  <table className="browser-table"><tbody>
                    <tr><th>BADGE</th><td>14-EV</td></tr>
                    <tr><th>LOOPBACK 0.3</th><td>UPLOADER: e_vale / 2014-05-19 03:14</td></tr>
                    <tr><th>DISAPPEARANCE</th><td>2014-05-18 03:14</td></tr>
                    <tr><th>OWNER</th><td>{eleanorReconciled ? "[CHECKSUM]" : "ELEANOR VALE / CURRENT OBSERVER"}</td></tr>
                    <tr><th>WITNESS</th><td>{eleanorReconciled ? "ARCHIVE" : "[comparison pending]"}</td></tr>
                  </tbody></table>
                  <button className="button" type="button" disabled={eleanorReconciled} onClick={reconcileEleanorOwner}>
                    {eleanorReconciled
                      ? locale === "pt-BR" ? "Proprietário reconciliado" : "Owner reconciled"
                      : locale === "pt-BR" ? "Confrontar crachá e registro" : "Compare badge and record"}
                  </button>
                </>
              )}
              {eleanorReconciled && (
                <p className="browser-redaction">OWNER: CHECKSUM / HUMAN ATTRIBUTION UNRESOLVED</p>
              )}
            </article>
          )}

          {page === "families" && (
            <article className="site-families">
              <header>
                <div className="site-seal">IHS</div>
                <div>
                  <p>PRESERVING THE RECORD SINCE 1952</p>
                  <h1>Innsmouth Historical &amp; Genealogical Society</h1>
                </div>
              </header>
              <div className="families-registry">
                <p>
                  Family registry, old coastal lines. Entries compiled from
                  municipal records, ship manifests, and correspondence
                  donated to the Society. Several entries are incomplete by
                  request of surviving family members.
                </p>
                <dl>
                  <dt>DYER</dt>
                  <dd>
                    Academic family, Arkham branch. No coastal property on
                    record. One member is associated with the 1930–31
                    Antarctic expedition; correspondence with the Society
                    ceases shortly after his return.
                  </dd>
                  <dt>WHATELEY</dt>
                  <dd>
                    Dunwich branch, inland. Deposited a private manuscript
                    collection with the University in 1998. The estate did
                    not respond to the Society&apos;s follow-up letters.
                  </dd>
                  <dt>AKELEY</dt>
                  <dd>
                    Vermont branch; no coastal record on file. A single
                    letter in our archive describes &ldquo;noises in the
                    hills&rdquo; inherited from an unrelated family further
                    north.
                  </dd>
                  <dt>GILMAN</dt>
                  <dd>
                    Innsmouth branch, extinct in the male line since 1928.
                    Municipal records for this family are incomplete after
                    the federal action of that year.
                  </dd>
                  <dt>CARTER</dt>
                  <dd>
                    Boston branch with occasional coastal visits. One member
                    is recorded missing in a Gazette notice, 1977; no
                    obituary ever followed the notice.
                  </dd>
                  <dt>MARSH</dt>
                  <dd>
                    The senior Innsmouth family. Refining company dissolved
                    1929. Descendants relocated inland in three recorded
                    waves; the Society has been unable to trace any line past
                    the second generation.
                  </dd>
                  <dt>OLMSTEAD</dt>
                  <dd>
                    Married into the Marsh line, 1846. One descendant&apos;s
                    naturalization papers describe &ldquo;a family
                    resemblance that skips a generation, and then does
                    not.&rdquo;
                  </dd>
                  <dt>PEASLEE</dt>
                  <dd>
                    Haverhill branch. A 1913 newspaper account describes a
                    member &ldquo;recovered from an amnesia of several
                    years,&rdquo; with no memory of the interval. He was not
                    believed.
                  </dd>
                  <dt>BISHOP</dt>
                  <dd>
                    Arkham branch, university-adjacent for three generations.
                    Both listed disappearances (1998, present) involve
                    Special Collections library staff. The Society keeps no
                    theory as to why.
                  </dd>
                </dl>
              </div>
              <p className="families-footnote">
                New inquiry received, 2026-03: BISHOP, S. — cross-referencing
                the above nine entries against a restricted reader index.
                Status: pending. The Society was not able to reach the
                inquirer for a follow-up interview.
              </p>
            </article>
          )}

          {page === "forum" && (
            <article className="site-forum">
              <header>
                <h1>MiskaNet Research Forum</h1>
                <p>Folklore, Cryptozoology &amp; Local History Board</p>
              </header>
              <div className="forum-meta">
                {localizedBrowserText(
                  "forum_7411_meta",
                  "Thread #7411: “the counting pattern (regional disappearances, need eyes on this)” · 4 replies",
                  locale
                )}
              </div>
              <div className="forum-thread">
                <div className="forum-post">
                  <div>
                    <span className="forum-handle">coastal_folklorist</span>
                    Member since 2014
                  </div>
                  <div className="forum-post-body">
                    <time>2019-11-02</time>
                    <p>
                      Cross-referencing missing-persons notices back to 1798.
                      There&apos;s something wrong with how close together
                      the recent ones are compared to the old ones. Anyone
                      else seeing this or am I just bad at reading old
                      newspapers at 3am?
                    </p>
                  </div>
                </div>
                <div className="forum-post">
                  <div>
                    <span className="forum-handle">deleted_user_4471</span>
                    Member since —
                  </div>
                  <div className="forum-post-body">
                    <time>2019-11-02</time>
                    <p>
                      You&apos;re not doing bad math. Take it down before
                      more people see it.
                    </p>
                  </div>
                </div>
                <div className="forum-post">
                  <div>
                    <span className="forum-handle">coastal_folklorist</span>
                    Member since 2014
                  </div>
                  <div className="forum-post-body">
                    <time>2019-11-02</time>
                    <p>who is this</p>
                  </div>
                </div>
                <div className="forum-post forum-post--system">
                  <div />
                  <div className="forum-post-body">
                    <p>coastal_folklorist has not posted since 2019-11-02.</p>
                  </div>
                </div>
                <div className="forum-post">
                  <div>
                    <span className="forum-handle">grad_student_arkham</span>
                    Member since 2023
                  </div>
                  <div className="forum-post-body">
                    <time>2024-04-19</time>
                    <p>
                      Found this thread doing research for my thesis. OP, are
                      you still around? I think I found the same pattern
                      independently.
                    </p>
                  </div>
                </div>
                <div className="forum-post forum-post--system">
                  <div />
                  <div className="forum-post-body">
                    <p>
                      This thread was moved to the Archive forum by a
                      moderator. Reason: inactive.
                    </p>
                  </div>
                </div>
                {state.puzzles.future_log.solvedAt && (
                  <div className="forum-post forum-post--orphan">
                  <div>
                    <span className="forum-handle">
                      {resolveTokens("{PLAYER}", {
                        playerName: state.playerName,
                      })}
                    </span>
                    New member
                  </div>
                  <div className="forum-post-body">
                    <time>{resolveTokens("{TOMORROW}")}</time>
                    <p>i think i found the same pattern independently too</p>
                  </div>
                  </div>
                )}
              </div>
            </article>
          )}

          {page === "em" && (
            <article className="site-geocities site-em">
              <div className="stars">✿　★　EM&apos;S CORNER OF THE WEB　★　✿</div>
              <h1>photos / family / things Sarah says I imagined</h1>
              <p className="blink">BEST VIEWED WITH NETSCAPE AND PATIENCE</p>
              <div className="geocities-boxes">
                <section>
                  <h2>Dad&apos;s 65th</h2>
                  <p>Sarah arrived before the candles went out. Evidence that miracles were possible before all this.</p>
                </section>
                <section>
                  <h2>North shore trip</h2>
                  <p>The shape behind us is a piling. Sarah circled it on the printout anyway. She always needed the ordinary explanation and the impossible one beside each other.</p>
                </section>
                <section>
                  <h2>Last voicemail</h2>
                  <p>
                    {localizedBrowserText(
                      "em_last_voicemail",
                      "“Leaving the archive at six-thirty. If I forget to call, be annoying.” Saved 03/16, 17:42. She never called at six-thirty. By the time anyone opened the office, the water had been standing long enough to leave a ring.",
                      locale
                    )}
                  </p>
                </section>
              </div>
              <footer>Last updated 2001. Cached revision appended 2026-03-16 by S. Bishop.</footer>
            </article>
          )}

          {page === "tom" && (
            <article className="site-geocities site-tom">
              <h1>TOM ALVAREZ&apos;S EXTREMELY PROFESSIONAL HOMEPAGE</h1>
              <p>Library systems, terrible coffee, and one photograph where I do not look surprised.</p>
              <hr />
              <h2>Current projects</h2>
              <ul>
                <li>DBX mailbox recovery utility</li>
                <li>Convincing Sarah that “backup” is not a personality trait</li>
                <li>Never volunteering to image another undocumented workstation</li>
              </ul>
              {state.puzzles.future_log.solvedAt && (
                <>
                  <div className="browser-redaction">
                    PAGE SOURCE NOTE: this list was edited on {resolveTokens("{TOMORROW}")}. The archived author account was disabled on 2026-03-23.
                  </div>
                  <p className="tom-counter">YOU ARE VISITOR 0004. TOM EXPECTED 0003.</p>
                </>
              )}
              <p>
                <button className="web-link web-link--inline" onClick={() => visitAtmospherePage("tom-guestbook", "tom-guestbook")}>Sign my guestbook</button>
              </p>
            </article>
          )}

          {page === "tom-guestbook" && (
            <article className="site-geocities site-tom">
              <h1>TOM&apos;S GUESTBOOK</h1>
              <p className="blink">PLEASE BE NICE OR AT LEAST TECHNICALLY INTERESTING</p>
              <div className="forum-thread">
                <div className="forum-post">
                  <div><span className="forum-handle">sarah_b</span> 2001 cache</div>
                  <div className="forum-post-body">
                    <time>2001-08-17</time>
                    <p>This page has more animated envelopes than a federal mail crime.</p>
                  </div>
                </div>
                <div className="forum-post">
                  <div><span className="forum-handle">tom_admin</span> 2001 cache</div>
                  <div className="forum-post-body">
                    <time>2001-08-17</time>
                    <p>Logged and ignored.</p>
                  </div>
                </div>
                {state.puzzles.lineage.solvedAt && (
                  <>
                    <div className="forum-post">
                      <div><span className="forum-handle">rosa.alvarez</span> appended revision</div>
                      <div className="forum-post-body">
                        <time>2026-04-02</time>
                        <p>
                          {localizedBrowserText(
                            "tom_guestbook_mother",
                            "This is Tom's mother. He built this page in college and I don't know where else to write. If you worked with my son, please call me. The police say adults are allowed to disappear. He was supposed to come for Easter.",
                            locale
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="forum-post">
                      <div><span className="forum-handle">j.okafor</span> appended revision</div>
                      <div className="forum-post-body">
                        <time>2026-04-05</time>
                        <p>
                          {localizedBrowserText(
                            "tom_guestbook_colleague",
                            "Tom queued a package for me on the 23rd. It never arrived, and I am ashamed of how relieved that makes me. Rosa, I called. Keep your phone on.",
                            locale
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <div className="forum-post forum-post--orphan">
                  <div>
                    <span className="forum-handle">
                      {resolveTokens("{PLAYER}", { playerName: state.playerName })}
                    </span>
                    cached visitor
                  </div>
                  <div className="forum-post-body">
                    <time>{resolveTokens("{TOMORROW}")}</time>
                    <p>visitor 0004 signed before the counter rendered visitor 0003.</p>
                  </div>
                </div>
              </div>
              <p className="tom-counter">COUNTER FILE: expected 0003 / displayed 0004 / archived 0004</p>
              <button className="web-link" onClick={() => visitAtmospherePage("tom", "tom-personal-page", "tom_homepage")}>Back to homepage</button>
            </article>
          )}

          {page === "maintenance" && (
            <article className="arg-tool__paper site-maintenance">
              <p className="arg-tool__kicker">FACILITIES WORK ORDER ARCHIVE / B2</p>
              <h2>Ticket sequence: moisture complaints</h2>
              <table className="browser-table"><tbody>
                <tr><th>Date</th><th>Location</th><th>Disposition</th></tr>
                <tr><td>1998-09-02</td><td>Orne B2 / M. Bishop</td><td>ADMINISTRATIVE</td></tr>
                <tr><td>2014-05-18</td><td>Off-site archive mirror</td><td>{eleanorReconciled ? "OWNER: CHECKSUM" : "OWNER REDACTED"}</td></tr>
                <tr><td>2026-03-11</td><td>Orne B2 / S. Bishop</td><td>ADMINISTRATIVE</td></tr>
              </tbody></table>
              <p>No active water line entered any affected room. Conductivity in all retained samples matched seawater within test tolerance.</p>
              <p className="browser-redaction">
                DIRECTOR&apos;S ORDER: recategorize all matching reports as facilities incidents. Do not link staff names in the public index.
              </p>
              <button className="web-link" onClick={() => visitAtmospherePage("memo", "library-memo-b2", "whitfield_memo")}>Open Whitfield memo</button>
            </article>
          )}

          {page === "downloads" && (
            <article className="site-downloads">
              <header><h1>MiskaNet Shareware Vault</h1><p>Archive utilities, MIDI players and things your administrator told you not to run.</p></header>
              <div className="download-row">
                <strong>LOOPBACK 0.3</strong>
                <span>Register a mounted index as its own verification witness.</span>
                <button
                  className="button"
                  disabled={!state.puzzles.future_log.solvedAt}
                  onClick={() => {
                    discoverEvidence("containment_utility", "miskanet-downloads");
                    dispatchGameEvent({ type: "DISCOVER_OPTIONAL", discoveryId: "containment_utility" });
                  }}
                >
                  {state.puzzles.future_log.solvedAt ? "Download" : "CRC locked"}
                </button>
              </div>
              <div className="download-row">
                <strong>MUSEUM_AFTER_DARK.MID</strong>
                <span>4 KB · uploaded by sarah_b · “less depressing than the title”</span>
                <button className="button" onClick={() => dispatchGameEvent({ type: "DISCOVER_OPTIONAL", discoveryId: "midi_collection" })}>Download</button>
              </div>
              <div className="download-row">
                <strong>DEEPSEA.SCR</strong>
                <span>Screensaver · monitor may fail to wake</span>
                <button className="button" onClick={() => dispatchGameEvent({ type: "SEE_ASSET_VARIANT", variantId: "deepsea-screensaver" })}>Download</button>
              </div>
              <small>Files in this cache were scanned in 2001. Virus definitions expired 9,131 days ago.</small>
            </article>
          )}

          {page === "gull-lantern" && (
            <article className="arg-tool__paper"><p className="arg-tool__kicker">ARKHAM WATERFRONT / EST. 1978</p><h2>Gull &amp; Lantern Café</h2><p>{locale === "pt-BR" ? "Café ruim, sopa honesta e mesas perto da janela." : "Bad coffee, honest soup, and tables by the window."}</p><hr /><p><strong>Reservations — March 16</strong><br />18:00 · E. Bishop + S. Bishop · window table requested</p><p className="browser-redaction">{locale === "pt-BR" ? "Observação: Sarah pediu para adiar. Em respondeu: “você sempre pede isso”." : "Note: Sarah asked to postpone. Em replied: “you always ask that.”"}</p></article>
          )}
          {page === "route-7" && (
            <article className="arg-tool__paper"><p className="arg-tool__kicker">ARKHAM TRANSIT AUTHORITY</p><h2>Route 7 — Orne / Waterfront</h2><table className="browser-table"><tbody><tr><th>Stop</th><th>Weekday</th></tr><tr><td>Orne Library</td><td>18:30</td></tr><tr><td>Gull &amp; Lantern</td><td>18:42</td></tr><tr><td>Waterfront terminus</td><td>18:57</td></tr></tbody></table>{state.puzzles.future_log.solvedAt && <p className="browser-redaction">NEXT BUS: 1 MINUTE · EXPECTED PASSENGERS: 4</p>}<small>{locale === "pt-BR" ? "Horário arquivado; não confirma embarque." : "Archived timetable; it does not confirm boarding."}</small></article>
          )}
          {page === "compat-gateway" && (
            <article className="arg-tool__paper"><p className="arg-tool__kicker">ORNE COMPUTING SERVICES</p><h2>Compatibility Gateway</h2><p>{locale === "pt-BR" ? "O espelho de caixa postal termina TLS e autenticação no servidor. Este Outlook Express só lê uma cópia DBX de arquivo." : "The mailbox mirror terminates TLS and authentication upstream. This Outlook Express only reads an archival DBX copy."}</p><table className="browser-table"><tbody><tr><th>Mirror</th><td>READ-ONLY</td></tr><tr><th>Transport log</th><td>COMPLETE</td></tr><tr><th>Legacy client</th><td>OUTLOOK EXPRESS ARCHIVE VIEW</td></tr></tbody></table><p className="browser-redaction">No outbound message from S. Bishop appears in the upstream transport log.</p></article>
          )}
          {page === "staff-bulletin" && (
            <article className="arg-tool__paper"><p className="arg-tool__kicker">MISKATONIC UNIVERSITY / STAFF BULLETIN</p><h2>Week of March 9</h2><p><strong>Thursday seminar:</strong> Tom Alvarez will cover Sarah Bishop&apos;s 14:00 provenance session.</p><p><strong>Scanner B2:</strong> still leaving a wet band along the lower edge. Please stop calling Facilities “the sea people.”</p><p><strong>Gull &amp; Lantern:</strong> library staff trivia team is short one archivist. Sarah said she was “probably coming.”</p></article>
          )}
          {page === "hydrography" && (
            <article className="arg-tool__paper"><p className="arg-tool__kicker">ESSEX HYDROGRAPHIC TELEMETRY / RECOVERED CACHE</p><h2>Inland station 03:14</h2><table className="browser-table"><tbody><tr><th>Reading</th><th>Value</th><th>Status</th></tr><tr><td>Conductivity</td><td>54.8 mS/cm</td><td>INVALID</td></tr><tr><td>Salinity</td><td>35.1 PSU</td><td>INVALID</td></tr><tr><td>Location</td><td>Orne B2</td><td>NOT A WATER SITE</td></tr></tbody></table><p>{locale === "pt-BR" ? "O instrumento registrou água do mar onde não havia linha d’água." : "The instrument recorded seawater where no water line existed."}</p></article>
          )}
          {page === "web-ring" && (
            <article className="arg-tool__paper"><p className="arg-tool__kicker">ARKHAM PRESERVATION WEB RING · 2001</p><h2>Keep the small web alive</h2><p>{locale === "pt-BR" ? "Esta página liga colecionadores, bibliotecas de bairro e diários pessoais antes que os provedores fechem." : "This page links collectors, neighborhood libraries and personal diaries before providers close them."}</p><ul><li>◄ Previous: <s>Old Essex Photos</s> [404]</li><li>Random: Miskatonic Library mirror</li><li>Next ►: <s>Sea Glass Journal</s> [host unavailable]</li></ul><small>Last ring crawl: 2001-08-17. 19 of 43 members responded.</small></article>
          )}

          {page === "false-lead" && (
            <div className="browser-error browser-false-lead">
              <div className="browser-error__icon">!</div>
              <div>
                <h2>No catalogue record under this name</h2>
                <p>
                  The archive has no record filed under that word. It has
                  your search logged under a different one.
                </p>
                <hr />
                <p>Cannot find server or DNS Error<br />Internet Explorer</p>
              </div>
            </div>
          )}

          {page === "not-found" && (
            <div className="browser-error">
              <div className="browser-error__icon">!</div>
              <div><h2>The page cannot be displayed</h2><p>The archive did not search synonyms or correct incomplete evidence.</p><hr /><p>Cannot find server or DNS Error<br />Internet Explorer</p></div>
            </div>
          )}
        </div>
      </div>
      <div className="arg-tool__status">
        <span>{statusText}</span>
        <span>{secure ? "🔒 " : ""}{address}</span>
      </div>
    </div>
  );
};

export default RecoveredBrowser;
