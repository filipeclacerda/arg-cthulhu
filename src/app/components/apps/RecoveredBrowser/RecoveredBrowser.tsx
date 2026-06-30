"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { resolveTokens } from "@/app/utils/narrative";
import "../ArgTools/style.scss";
import "./style.scss";

type BrowserPage =
  | "home"
  | "results"
  | "library"
  | "gazette"
  | "expedition"
  | "bellaso"
  | "weather"
  | "danforth"
  | "lot"
  | "coast"
  | "sarah"
  | "not-found";

interface HistoryEntry {
  page: BrowserPage;
  address: string;
}

const PAGE_ADDRESS: Record<BrowserPage, string> = {
  home: "http://search.miskatonic.net/",
  results: "http://search.miskatonic.net/search",
  library: "http://www.miskatonic.edu/library/",
  gazette: "http://www.arkham-gazette.com/archive/",
  expedition: "http://www.miskatonic.edu/geology/pabodie/",
  bellaso: "http://www.miskatonic.edu/library/cryptography/bellaso.htm",
  weather: "http://weather.antarctic-net.org/station/lake/",
  danforth: "http://www.geocities.com/arkham_heights/danforth.html",
  lot: "cache://miskatonic/catalog/MS-WHA-1998-114-II",
  coast: "cache://hydrographic/yhanthlei",
  sarah: "cache://miskatonic/catalog/2026-bishop-sarah",
  "not-found": "res://shdoclc/dnserror.htm",
};

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
  } = useProgress();
  const initialPage: BrowserPage = initialAddress?.includes("danforth")
    ? "danforth"
    : "home";
  const [page, setPage] = useState<BrowserPage>(initialPage);
  const [address, setAddress] = useState(
    initialAddress ?? PAGE_ADDRESS[initialPage]
  );
  const [backStack, setBackStack] = useState<HistoryEntry[]>([]);
  const [forwardStack, setForwardStack] = useState<HistoryEntry[]>([]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const secure = address.startsWith("cache://");
  const statusText = useMemo(() => {
    if (page === "not-found") return "Cannot find server";
    if (page === "home" || page === "results") return "Cached web search";
    return secure ? "Recovered cache" : "Internet zone";
  }, [page, secure]);

  const navigate = (
    next: BrowserPage,
    nextAddress = PAGE_ADDRESS[next],
    record = true
  ) => {
    if (record) {
      setBackStack((items) => [...items, { page, address }]);
      setForwardStack([]);
    }
    setPage(next);
    setAddress(nextAddress);
  };

  const visitAtmospherePage = (
    next: BrowserPage,
    pageId: string,
    evidenceId?: string
  ) => {
    visitPage(pageId);
    if (evidenceId) discoverEvidence(evidenceId, pageId);
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

    const lotMatch =
      value.includes("WHATELEY") &&
      value.includes("1998") &&
      value.includes("114") &&
      (value.includes("II") || value.includes("VOLUME 2"));
    if (lotMatch) {
      attemptPuzzle("lot_114");
      solvePuzzle("lot_114");
      discoverEvidence("catalogue_lot_114", "catalogue-lot-114");
      visitPage("catalogue-lot-114");
      navigate("lot");
      return;
    }

    if (
      compact.includes("YHANTHLEI") &&
      isPuzzleSolved("margin_cipher")
    ) {
      attemptPuzzle("counting_audio");
      solvePuzzle("counting_audio");
      discoverEvidence("coastline_archive", "coastline-yhanthlei");
      visitPage("coastline-yhanthlei");
      navigate("coast");
      return;
    }

    if (value === "2026" && state.visitedPageIds.includes("coastline-yhanthlei")) {
      attemptPuzzle("lineage");
      solvePuzzle("lineage");
      discoverEvidence("sarah_future_record", "catalogue-2026");
      visitPage("catalogue-2026");
      navigate("sarah");
      return;
    }

    if (compact.includes("GEOCITIES") || compact.includes("DANFORTH") || compact.includes("TEKELILI")) {
      visitAtmospherePage("danforth", "danforth-personal-cache", "danforth_cache");
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
        <span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span>
      </div>
      <div className="browser-buttonbar">
        <button className="browser-tool button" type="button" disabled={backStack.length === 0} onClick={goBack}>
          <span>←</span>Back
        </button>
        <button className="browser-tool button" type="button" disabled={forwardStack.length === 0} onClick={goForward}>
          <span>→</span>Forward
        </button>
        <button className="browser-tool button" type="button" onClick={() => navigate("home")}>
          <span>⌂</span>Home
        </button>
        <button className={`browser-tool button ${favoritesOpen ? "active" : ""}`} type="button" onClick={() => setFavoritesOpen((value) => !value)}>
          <span>★</span>Favorites
        </button>
      </div>
      <form className="arg-tool__toolbar browser-address" onSubmit={submit}>
        <label htmlFor="archive-address">Address</label>
        <input
          id="archive-address"
          value={address}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setAddress(event.target.value)}
          aria-label="Internet address or catalogue search"
        />
        <button className="button" type="submit">Go</button>
      </form>

      <div className="browser-body">
        {favoritesOpen && (
          <aside className="browser-favorites">
            <strong>Favorites</strong>
            <button onClick={() => visitAtmospherePage("library", "miskatonic-library-home")}>Miskatonic Library</button>
            <button onClick={() => visitAtmospherePage("gazette", "arkham-gazette")}>Arkham Gazette</button>
            <button onClick={() => visitAtmospherePage("expedition", "pabodie-expedition")}>1930 Expedition</button>
            <button onClick={() => visitAtmospherePage("weather", "antarctic-weather")}>Lake Weather</button>
            <div />
            <small>Links imported from Sarah&apos;s Favorites folder.</small>
          </aside>
        )}

        <div className="arg-tool__content">
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
                <label htmlFor="miskatonic-search">Search the cached web:</label>
                <input
                  id="miskatonic-search"
                  autoFocus
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                <div>
                  <button type="submit">Miskatonic Search</button>
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
                    I&apos;m Feeling Unlucky
                  </button>
                </div>
              </form>
              <p className="retro-search-tip">
                Search tip: combine names, dates, lot numbers and volume
                information to narrow catalogue records.
              </p>
              <div className="retro-search-directory">
                <strong>Cached pages:</strong>
                <button onClick={() => visitAtmospherePage("library", "miskatonic-library-home")}>University</button>
                <span> - </span>
                <button onClick={() => visitAtmospherePage("gazette", "arkham-gazette")}>News</button>
                <span> - </span>
                <button onClick={() => visitAtmospherePage("expedition", "pabodie-expedition")}>Science</button>
                <span> - </span>
                <button onClick={() => visitAtmospherePage("weather", "antarctic-weather")}>Weather</button>
              </div>
              <footer>
                © 2000 Miskatonic Network · About · Help · Add URL
                <br />
                <em>37 pages available offline</em>
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
                <button onClick={() => visitAtmospherePage("expedition", "pabodie-expedition")}>
                  <strong>Pabodie Antarctic Expedition, 1930–31</strong>
                  <span>Department of Geology photographs, personnel records and field notes.</span>
                  <small>www.miskatonic.edu/geology/pabodie/</small>
                </button>
                <button onClick={() => visitAtmospherePage("bellaso", "bellaso-reference")}>
                  <strong>Cryptography Reference Shelf: Moving Alphabets</strong>
                  <span>Staff reference note compiled by M. Bishop in 1998.</span>
                  <small>www.miskatonic.edu/library/cryptography/</small>
                </button>
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
              <nav>HOME | CATALOGUE | COLLECTIONS | READER SERVICES | STAFF</nav>
              <div className="site-columns">
                <section>
                  <h2>Special Collections Gateway</h2>
                  <p>This cached gateway contains 37 catalogue records and six staff reference pages.</p>
                  <h3>Quick links</h3>
                  <button className="web-link" onClick={() => visitAtmospherePage("bellaso", "bellaso-reference")}>Cryptography reference shelf: moving alphabets</button>
                  <button className="web-link" onClick={() => visitAtmospherePage("expedition", "pabodie-expedition")}>Departmental archive: Pabodie Expedition</button>
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
                  <h3>From our 1931 archive</h3>
                  <p>Geologist William Dyer returned without Gedney and urged the trustees to abandon further Antarctic work. Flight records list one additional mountain range not present on official maps.</p>
                </section>
                <aside>
                  <h3>Weather</h3><p>Heavy fog. Tides unusually high.</p>
                  <h3>Classifieds</h3><p>Bookseller seeks buyer for incomplete Whateley estate lot. No returns.</p>
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
                </dl>
                <aside>
                  <strong>Archive anomaly</strong>
                  <p>Danforth&apos;s final camera plate contains peaks behind the recorded range. The emulsion date is tomorrow.</p>
                  <button className="web-link damaged-frame" onClick={() => visitAtmospherePage("danforth", "danforth-personal-cache", "danforth_cache")}>View damaged frame 7</button>
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
              </div>
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
              </div>
              <small>Station clocks are synchronized by shortwave. Current station date: {resolveTokens("{TOMORROW}")}</small>
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
              <p>I saw the range again in Sarah Bishop&apos;s scan. She was not born when the photograph was taken.</p>
              <hr />
              <small>Last updated: {resolveTokens("{TOMORROW}")} — webmaster email returned: USER DOES NOT EXIST YET</small>
            </article>
          )}

          {page === "lot" && (
            <article className="arg-tool__paper">
              <p className="arg-tool__kicker">CATALOGUE RECORD / RESTRICTED</p>
              <h2>MS-WHA-1998-114/II</h2>
              <dl className="arg-tool__properties">
                <dt>Deposit</dt><dd>Whateley estate</dd>
                <dt>Accession</dt><dd>1998 / M. Bishop</dd>
                <dt>Vendor lot</dt><dd>114</dd>
                <dt>Description</dt><dd>Bound MS., Volume II, marginal hand</dd>
                <dt>Attachment</dt><dd>114_verso.tif — recovered to Sarah&apos;s files</dd>
              </dl>
              <p>The verso scan was rejected by OCR because its orientation and tonal range do not match the front page.</p>
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
