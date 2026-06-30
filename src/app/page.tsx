"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import WindowComponent from "./components/WindowComponent/WindowComponent";
import { useWindowManager } from "./context/WindowManagerContext";
import { useProgress } from "./context/ProgressContext";
import { ProgressStateV3, puzzleAct } from "./game/progress";
import { resolveTokens } from "./utils/narrative";
import "./page.scss";

// Sarah Bishop's own login, left on the machine she vanished from.
const SARAH_USERNAME = "sarah.bishop";
const SARAH_PASSWORD = "password";

export default function Home() {
  const { openWindow } = useWindowManager();
  const {
    state,
    isHydrated,
    newCase,
    previewCode,
    importCode,
  } = useProgress();
  const [form, setForm] = useState({
    username: SARAH_USERNAME,
    password: SARAH_PASSWORD,
  });
  const [tomorrowStamp, setTomorrowStamp] = useState("--/--/----");
  const [showImport, setShowImport] = useState(false);
  const [caseCode, setCaseCode] = useState("");
  const [casePreview, setCasePreview] = useState<ProgressStateV3 | null>(null);
  const [caseError, setCaseError] = useState("");

  useEffect(() => {
    setTomorrowStamp(resolveTokens("{TOMORROW}"));
  }, []);

  const hasExistingCase =
    Boolean(state.playerName) ||
    state.readFileIds.length > 0 ||
    state.readEmailIds.length > 0 ||
    Object.values(state.puzzles).some((puzzle) => puzzle.solvedAt) ||
    Boolean(state.flags.registration_shown);

  const handleSubmit = () => {
    if (form.username === SARAH_USERNAME && form.password === SARAH_PASSWORD) {
      window.location.href = "/desktop";
    } else {
      openWindow({
        appType: "generic",
        title: "Incorrect Username or Password",
        props: {
          children: (
            <div className="description">
              <p className="p">
                The username or password you entered is incorrect. Please try
                again.
              </p>
            </div>
          ),
        },
      });
    }
  };
  return (
    <>
      <div className="entry-screen" aria-hidden="true">
        <div className="entry-scanline" />
        <div className="entry-watermark">DISK IMAGE / READ ONLY</div>
      </div>

      <WindowComponent
        title={`Unverified Disk Image — received ${tomorrowStamp}`}
        className="entry-window"
      >
        <div className="entry-layout">
          <aside className="entry-brief">
            <div className="entry-logo">
              <Image
                alt="Windows 98 Logo"
                src="/windows-98-logo.png"
                width={180}
                height={128}
                priority
              />
            </div>

            <div className="evidence-tag">MISKATONIC RECOVERY VIEWER</div>
            <h1>Sarah Bishop Workstation</h1>
            <p>
              A compressed forensic copy arrived with no valid sender and one
              attached note. The timestamp says it was sent tomorrow.
            </p>

            <div className="tom-note">
              <p className="tom-note-label">attached_note.txt</p>
              <p>
                I found the computer that belonged to Sarah Bishop. You asked
                me for a copy. I don&apos;t remember when we spoke.
              </p>
              <p className="tom-signature">— Tom Alvarez</p>
            </div>

            <div className="credential-strip">
              <span>Recovered credentials</span>
              <code>sarah.bishop / password</code>
            </div>
          </aside>

          <section className="entry-login">
            <div className="entry-login-header">
              <span className="entry-led" />
              <div>
                <p className="entry-kicker">Mounted volume</p>
                <h2>Windows 98 authentication</h2>
              </div>
            </div>

            <p className="entry-copy">
              The username was already present in the disk image. The password
              was recovered from the sender&apos;s note. Continue only if you
              are willing to inspect the contents of this machine.
            </p>

            <form
              className="form entry-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <div className="formItem">
                <label className="label">Username:</label>
                <input
                  className="input"
                  type="text"
                  autoComplete="off"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                ></input>
              </div>
              <div className="formItem">
                <label className="label">Password:</label>
                <input
                  className="input"
                  type="password"
                  autoComplete="off"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                ></input>
              </div>
              <div className="entry-options">
                <button
                  className="button btn-lg"
                  type="button"
                  onClick={() =>
                    setForm({
                      username: SARAH_USERNAME,
                      password: SARAH_PASSWORD,
                    })
                  }
                >
                  Autofill
                </button>
                <button
                  className="button btn-lg entry-primary"
                  type="submit"
                >
                  {hasExistingCase ? "Continue Case" : "Mount"}
                </button>
              </div>
            </form>

            <div className="entry-warning">
              <strong>Warning:</strong> The mounted image contains files dated{" "}
              {tomorrowStamp}. Windows will report this as a clock error.
            </div>

            {isHydrated && (
              <div className="entry-case-actions">
                <span>
                  {hasExistingCase
                    ? `Existing case: ${state.playerName || "NEXT USER"} / Act ${puzzleAct(state)}`
                    : "No prior investigation found on this machine."}
                </span>
                <div>
                  <button
                    className="button"
                    type="button"
                    onClick={async () => {
                      if (
                        hasExistingCase &&
                        !window.confirm(
                          "Start a new case? The current case will be checkpointed before it is replaced."
                        )
                      ) {
                        return;
                      }
                      await newCase();
                    }}
                  >
                    New Case
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setShowImport((value) => !value);
                      setCaseError("");
                      setCasePreview(null);
                    }}
                  >
                    Import Case Code
                  </button>
                </div>
              </div>
            )}

            {showImport && (
              <div className="case-import">
                <label htmlFor="case-code">MISK3 Case Code</label>
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
                {caseError && <p className="case-import__error">{caseError}</p>}
                {casePreview && (
                  <div className="case-import__preview">
                    <strong>{casePreview.playerName || "NEXT USER"}</strong>
                    <span>Act {puzzleAct(casePreview)}</span>
                    <span>{new Date(casePreview.updatedAt).toLocaleString()}</span>
                    <small>Player name and Case Notes are included in this code.</small>
                  </div>
                )}
                <div className="case-import__buttons">
                  {!casePreview ? (
                    <button
                      className="button"
                      type="button"
                      onClick={async () => {
                        try {
                          setCasePreview(await previewCode(caseCode));
                        } catch (error) {
                          setCaseError(
                            error instanceof Error
                              ? error.message
                              : "Invalid Case Code."
                          );
                        }
                      }}
                    >
                      Verify
                    </button>
                  ) : (
                    <button
                      className="button"
                      type="button"
                      onClick={async () => {
                        await importCode(caseCode);
                        window.location.href = "/desktop";
                      }}
                    >
                      Replace &amp; Continue
                    </button>
                  )}
                  <button className="button" type="button" onClick={() => setShowImport(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </WindowComponent>
    </>
  );
}
