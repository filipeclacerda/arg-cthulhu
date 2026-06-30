"use client";

import { useEffect, useState } from "react";
import { useProgress } from "./context/ProgressContext";
import { ProgressStateV3, puzzleAct } from "./game/progress";
import { resolveTokens } from "./utils/narrative";
import "./page.scss";

const SARAH_USERNAME = "sarah.bishop";
const SARAH_PASSWORD = "password";

const BOOT_LINES = [
  "ORNE LIBRARY DARK ARCHIVE // RELAY 07",
  "HANDSHAKE ACCEPTED FROM UNLISTED OBSERVER",
  "CHECKING CHAIN OF CUSTODY ........ FAILED",
  "CHECKING SOURCE SIGNATURE .... T. ALVAREZ",
  "CHECKING RECIPIENT FIELD ......... [BLANK]",
  "COMPARING SYSTEM CLOCK ........... +24:00:00",
  "SEALED IMAGE SB-0316 FOUND",
];

export default function Home() {
  const {
    state,
    isHydrated,
    newCase,
    previewCode,
    importCode,
    setPlayerName,
    setFlag,
  } = useProgress();
  const [phase, setPhase] = useState<"sealed" | "mount">("sealed");
  const [visibleLines, setVisibleLines] = useState(0);
  const [observerName, setObserverName] = useState("");
  const [username, setUsername] = useState(SARAH_USERNAME);
  const [password, setPassword] = useState(SARAH_PASSWORD);
  const [authError, setAuthError] = useState("");
  const [tomorrowStamp, setTomorrowStamp] = useState("--/--/----");
  const [showImport, setShowImport] = useState(false);
  const [caseCode, setCaseCode] = useState("");
  const [casePreview, setCasePreview] = useState<ProgressStateV3 | null>(null);
  const [caseError, setCaseError] = useState("");

  useEffect(() => {
    setTomorrowStamp(resolveTokens("{TOMORROW}"));
    const timer = window.setInterval(() => {
      setVisibleLines((count) => {
        if (count >= BOOT_LINES.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 125);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isHydrated) setObserverName(state.playerName ?? "");
  }, [isHydrated, state.playerName]);

  const hasExistingCase =
    Boolean(state.playerName) ||
    state.readFileIds.length > 0 ||
    state.readEmailIds.length > 0 ||
    Object.values(state.puzzles).some((puzzle) => puzzle.solvedAt) ||
    Boolean(state.flags.relay_envelope_opened) ||
    Boolean(state.flags.registration_shown);

  const mountImage = () => {
    if (username !== SARAH_USERNAME || password !== SARAH_PASSWORD) {
      setAuthError("ACCESS DENIED // recovered credentials do not match image header");
      return;
    }
    setPlayerName(observerName.trim() || null);
    setFlag("relay_envelope_opened");
    window.location.href = "/desktop";
  };

  return (
    <main className="relay-shell">
      <div className="relay-shell__noise" aria-hidden="true" />
      <div className="relay-shell__sigil" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>

      <section className="relay-terminal" aria-label="Miskatonic forensic relay">
        <header className="relay-terminal__header">
          <div className="relay-terminal__lamps" aria-hidden="true">
            <span /><span /><span />
          </div>
          <div>
            <strong>MISKATONIC UNIVERSITY // DIGITAL FORENSICS</strong>
            <small>UNAUTHORIZED RELAY NODE 07</small>
          </div>
          <span className="relay-terminal__date">QUEUE DATE {tomorrowStamp}</span>
        </header>

        <div className="relay-terminal__body">
          <aside className="relay-manifest">
            <p className="relay-label">SEALED EVIDENCE</p>
            <h1>SB-0316</h1>
            <dl>
              <dt>Subject</dt><dd>BISHOP, SARAH</dd>
              <dt>Medium</dt><dd>DISK IMAGE</dd>
              <dt>Source</dt><dd>T. ALVAREZ</dd>
              <dt>Status</dt><dd>UNRESOLVED</dd>
              <dt>Recipient</dt><dd className="relay-unstable">GENERATED AT OPEN</dd>
              <dt>Timestamp</dt><dd>{tomorrowStamp}</dd>
            </dl>
            <div className="relay-boundary">
              Everything shown here belongs to the relay envelope.
              The Windows system beyond the mount belongs to Sarah Bishop.
            </div>
          </aside>

          <div className="relay-console">
            <div className="relay-console__output" aria-live="polite">
              {BOOT_LINES.slice(0, visibleLines).map((line, index) => (
                <p key={line}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {line}
                </p>
              ))}
              <b className="relay-cursor" aria-hidden="true">█</b>
            </div>

            {visibleLines >= BOOT_LINES.length && phase === "sealed" && (
              <div className="relay-envelope">
                <p className="relay-label">UPLOAD ENVELOPE // OUTSIDE DISK IMAGE</p>
                <blockquote>
                  <p>I found the computer that belonged to Sarah Bishop.</p>
                  <p>
                    I made a forensic copy before the archive took it. I queued
                    it for three colleagues. There is a fourth recipient now.
                    I did not add one.
                  </p>
                  <p>
                    The field is blank on my screen. Maybe it will not be blank
                    when somebody opens this.
                  </p>
                  <footer>— Tom Alvarez</footer>
                </blockquote>
                <button
                  className="relay-command"
                  type="button"
                  onClick={() => setPhase("mount")}
                >
                  [ OPEN SEALED ATTACHMENT ]
                </button>
              </div>
            )}

            {phase === "mount" && (
              <div className="relay-mount">
                <div className="relay-warning">
                  <strong>OBSERVER SESSION CREATED</strong>
                  <span>
                    The relay has no record of inviting you. Opening the image
                    is the only credential it has for you.
                  </span>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    mountImage();
                  }}
                >
                  <label>
                    Observer designation
                    <input
                      value={observerName}
                      onChange={(event) => setObserverName(event.target.value)}
                      placeholder="optional / stored in access log"
                    />
                  </label>
                  <div className="relay-credentials">
                    <label>
                      Image username
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      Recovered password
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="off"
                      />
                    </label>
                  </div>
                  <p className="relay-credential-source">
                    Credentials recovered from Alvarez upload manifest:
                    <code>sarah.bishop / password</code>
                  </p>
                  {authError && <p className="relay-error">{authError}</p>}
                  <button className="relay-command" type="submit">
                    [ {hasExistingCase ? "CONTINUE MOUNTED CASE" : "MOUNT READ-ONLY IMAGE"} ]
                  </button>
                </form>

                {isHydrated && (
                  <div className="relay-case-controls">
                    <span>
                      {hasExistingCase
                        ? `LOCAL CHECKPOINT // ${state.playerName || "NEXT USER"} // ACT ${puzzleAct(state)}`
                        : "NO LOCAL CHECKPOINT FOUND"}
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            hasExistingCase &&
                            !window.confirm(
                              "Create a new observer session? The current case will be checkpointed."
                            )
                          ) {
                            return;
                          }
                          await newCase();
                          setObserverName("");
                        }}
                      >
                        New session
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowImport((value) => !value);
                          setCasePreview(null);
                          setCaseError("");
                        }}
                      >
                        Import MISK3
                      </button>
                    </div>
                  </div>
                )}

                {showImport && (
                  <div className="relay-import">
                    <label htmlFor="case-code">Portable case code</label>
                    <textarea
                      id="case-code"
                      value={caseCode}
                      onChange={(event) => {
                        setCaseCode(event.target.value);
                        setCasePreview(null);
                        setCaseError("");
                      }}
                      placeholder="MISK3.payload.checksum"
                    />
                    {caseError && <p className="relay-error">{caseError}</p>}
                    {casePreview && (
                      <p>
                        VERIFIED {"//"} {casePreview.playerName || "NEXT USER"}{" "}
                        {"//"} ACT {puzzleAct(casePreview)} {"//"}{" "}
                        {new Date(casePreview.updatedAt).toLocaleString()}
                      </p>
                    )}
                    <div>
                      {!casePreview ? (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setCasePreview(await previewCode(caseCode));
                            } catch (error) {
                              setCaseError(
                                error instanceof Error
                                  ? error.message
                                  : "Invalid case code."
                              );
                            }
                          }}
                        >
                          Verify checksum
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            await importCode(caseCode);
                            window.location.href = "/desktop";
                          }}
                        >
                          Replace and mount
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="relay-terminal__footer">
          <span>NO RETURN PATH</span>
          <span>OBSERVER ADDRESS: CURIOSITY</span>
          <span>LINK INTEGRITY 07%</span>
        </footer>
      </section>
    </main>
  );
}
