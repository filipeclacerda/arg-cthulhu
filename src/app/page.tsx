"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import WindowComponent from "./components/WindowComponent/WindowComponent";
import { useWindowManager } from "./context/WindowManagerContext";
import { resolveTokens } from "./utils/narrative";
import "./page.scss";

// Sarah Bishop's own login, left on the machine she vanished from.
const SARAH_USERNAME = "sarah.bishop";
const SARAH_PASSWORD = "password";

export default function Home() {
  const { openWindow } = useWindowManager();
  const [form, setForm] = useState({
    username: SARAH_USERNAME,
    password: SARAH_PASSWORD,
  });
  const [tomorrowStamp, setTomorrowStamp] = useState("--/--/----");

  useEffect(() => {
    setTomorrowStamp(resolveTokens("{TOMORROW}"));
  }, []);

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
                  Mount
                </button>
              </div>
            </form>

            <div className="entry-warning">
              <strong>Warning:</strong> The mounted image contains files dated{" "}
              {tomorrowStamp}. Windows will report this as a clock error.
            </div>
          </section>
        </div>
      </WindowComponent>
    </>
  );
}
