"use client";
import React, { useEffect, useRef, useState } from "react";
import "./style.scss";
import "../globals.scss";
import Image from "next/image";
import Clock from "../components/Clock/Clock";
import StartMenu from "../components/StartMenu/StartMenu";
import { useWindowManager, AppType } from "../context/WindowManagerContext";
import { useProgress } from "../context/ProgressContext";
import { useSound } from "../context/SoundContext";
import { useSubliminalGlitch } from "../hooks/useSubliminalGlitch";

interface DesktopApp {
  id: string;
  label: string;
  appType: AppType;
  icon: string;
  props?: Record<string, any>;
}

const desktopApps: DesktopApp[] = [
  {
    id: "my-computer",
    label: "My Computer",
    appType: "explorer",
    icon: "/icons/my-computer.png",
    props: { folderId: "my-computer" },
  },
  {
    id: "my-documents",
    label: "My Documents",
    appType: "explorer",
    icon: "/icons/my-documents.png",
    props: { folderId: "sarah" },
  },
  {
    id: "case-notes",
    label: "Case Notes",
    appType: "case-notes",
    icon: "/icons/notepad.png",
  },
  {
    id: "internet-explorer",
    label: "Internet Explorer",
    appType: "browser",
    icon: "/icons/internet-explorer.png",
  },
  {
    id: "inbox",
    label: "Outlook Express",
    appType: "email",
    icon: "/icons/outlook-express.png",
  },
  {
    id: "msn-messenger",
    label: "MSN Messenger",
    appType: "messenger",
    icon: "/icons/msn-messenger.png",
  },
  {
    id: "recycle-bin",
    label: "Recycle Bin",
    appType: "recycle-bin",
    icon: "/icons/recycle-bin.png",
  },
];

const appIcon = (appType: AppType) => {
  if (appType === "browser") return "/icons/internet-explorer.png";
  if (appType === "email") return "/icons/outlook-express.png";
  if (appType === "messenger") return "/icons/msn-messenger.png";
  if (appType === "case-notes" || appType === "notepad") return "/icons/notepad.png";
  if (appType === "audio") return "/icons/media-player.png";
  if (appType === "help") return "/icons/help.png";
  if (appType === "recycle-bin") return "/icons/recycle-bin.png";
  if (appType === "evidence-board") return "/icons/folder-special.png";
  return "/icons/file.png";
};

const Desktop = () => {
  const { openWindow, windows, focusWindow } = useWindowManager();
  const {
    flags,
    isHydrated,
    setFlag,
    saveStatus,
    isReadOnly,
    persistenceAvailable,
    recoveredFromCheckpoint,
    exportCode,
    corruptionStage,
    playerName,
  } = useProgress();
  const { play, setAmbientActive, muted, toggleMuted } = useSound();
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [caseCodeCopied, setCaseCodeCopied] = useState(false);
  const [booted, setBooted] = useState(false);
  const previousCorruptionStage = useRef<number | null>(null);
  const { labelGlitch, cursorEcho } = useSubliminalGlitch(
    corruptionStage >= 4,
    playerName
  );

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (
      previousCorruptionStage.current !== null &&
      corruptionStage > previousCorruptionStage.current
    ) {
      play("glitch");
    }
    previousCorruptionStage.current = corruptionStage;
  }, [corruptionStage, play]);

  useEffect(() => {
    setAmbientActive(corruptionStage >= 3);
    return () => setAmbientActive(false);
  }, [corruptionStage, setAmbientActive]);

  useEffect(() => {
    document.body.classList.add("desktop-mode");
    return () => document.body.classList.remove("desktop-mode");
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.sarah_email_arrived || flags.sarah_email_notice_shown) return;

    const t = setTimeout(() => {
      setFlag("sarah_email_notice_shown");
      play("chime");
      openWindow({
        id: "new-mail-alert",
        appType: "generic",
        title: "New Mail",
        props: {
          windowClassName: "corrupted",
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">Message received</p>
              <h2>sarah.bishop@miskatonic-research.org</h2>
              <p>
                This message is dated tomorrow. Outlook Express recommends
                treating this as a clock synchronization error.
              </p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  openWindow({
                    id: "inbox",
                    appType: "email",
                    title: "E-mail",
                  })
                }
              >
                Open Inbox
              </button>
            </div>
          ),
        },
      });
    }, 900);

    return () => clearTimeout(t);
  }, [
    flags.sarah_email_arrived,
    flags.sarah_email_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.puzzle_lot_114_solved || flags.restricted_folder_notice_shown) return;

    const t = setTimeout(() => {
      setFlag("restricted_folder_notice_shown");
      play("chime");
      openWindow({
        id: "restricted-folder-alert",
        appType: "generic",
        title: "New Folder Recovered",
        props: {
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">File system change</p>
              <h2>A new folder has appeared in this account.</h2>
              <p>RECOVERED — Sarah Bishop&apos;s My Documents.</p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  openWindow({
                    id: "explorer-restricted",
                    appType: "explorer",
                    title: "RECOVERED",
                    props: { folderId: "restricted" },
                  })
                }
              >
                Open Folder
              </button>
            </div>
          ),
        },
      });
    }, 900);

    return () => clearTimeout(t);
  }, [
    flags.puzzle_lot_114_solved,
    flags.restricted_folder_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.puzzle_counting_audio_solved || flags.chapter_seven_notice_shown) return;

    const t = setTimeout(() => {
      setFlag("chapter_seven_notice_shown");
      play("chime");
      openWindow({
        id: "chapter-seven-alert",
        appType: "generic",
        title: "New Folder Recovered",
        props: {
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">File system change</p>
              <h2>A new folder has appeared inside RECOVERED.</h2>
              <p>CHAPTER_SEVEN.</p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  openWindow({
                    id: "explorer-chapter-seven",
                    appType: "explorer",
                    title: "CHAPTER_SEVEN",
                    props: { folderId: "chapter-seven" },
                  })
                }
              >
                Open Folder
              </button>
            </div>
          ),
        },
      });
    }, 900);

    return () => clearTimeout(t);
  }, [
    flags.puzzle_counting_audio_solved,
    flags.chapter_seven_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.endgame_available || flags.endgame_notice_shown) return;

    const t = setTimeout(() => {
      setFlag("endgame_notice_shown");
      play("chime");
      openWindow({
        id: "recovered-program-alert",
        appType: "generic",
        title: "Recovered Program Installed",
        props: {
          windowClassName: "corrupted",
          children: (
            <div className="new-mail-alert recovered-program-alert">
              <p className="new-mail-alert__kicker">Recovered executable</p>
              <h2>Chapter Seven has finished indexing.</h2>
              <p>
                A recovered program is now available from the Start menu. It
                has no publisher and no creation date before tomorrow.
              </p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  openWindow({
                    id: "finale",
                    appType: "finale",
                    title: "RECOVERED PROGRAM",
                  })
                }
              >
                Run Program
              </button>
            </div>
          ),
        },
      });
    }, 900);

    return () => clearTimeout(t);
  }, [
    flags.endgame_available,
    flags.endgame_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
  ]);

  const onClickOffsideIcon = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const target = ev.target as HTMLDivElement;
    if (target.closest(".desktop-icon")) {
      return;
    } else {
      deselectIcons();
    }
  };

  const deselectIcons = () => {
    const icons = document.querySelectorAll(".desktop-icon");
    icons.forEach((icon) => {
      icon.classList.remove("selected");
    });
  };

  const handleClickIcon = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const target = ev.target as HTMLDivElement;
    const icon = target.closest(".desktop-icon") as HTMLElement | null;
    if (!icon) return;
    if (icon.classList.contains("selected")) {
      const appId = icon.dataset.appId;
      const app = desktopApps.find((a) => a.id === appId);
      if (app) {
        openWindow({
          id: app.id,
          appType: app.appType,
          title: app.label,
          props: app.props,
        });
      }
      deselectIcons();
    } else {
      icon.classList.toggle("selected");
    }
  };

  if (!booted) {
    return (
      <main className="boot-splash">
        <div className="boot-splash__bar">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p>MOUNTING DISK IMAGE — VOL_114</p>
      </main>
    );
  }

  return (
    <main id="desktop-root">
      <div className="desktop-atmosphere" aria-hidden="true" />
      <div className="desktop-case-label" aria-hidden="true">
        {labelGlitch ? (
          <span className="desktop-case-label__glitch">{labelGlitch}</span>
        ) : (
          <>
            <span>MISKATONIC DISK IMAGE</span>
            <span>READ ONLY / VOL_114</span>
          </>
        )}
      </div>
      {cursorEcho && (
        <div
          className="cursor-echo"
          aria-hidden="true"
          style={{ left: cursorEcho.x, top: cursorEcho.y }}
        />
      )}
      <div id="taskbar">
        <div className="taskbar-left">
          <StartMenu />
          <div className="taskbar-divider" />
          <div className="taskbar-windows">
            {windows.map((win) => (
              <button
                key={win.id}
                className={`button taskbar-window ${
                  win.minimized ? "taskbar-window--minimized" : ""
                }`}
                onClick={() => focusWindow(win.id)}
                title={win.title}
              >
                <Image src={appIcon(win.appType)} alt="" width={18} height={18} />
                <span>{win.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="taskbar-tray">
          <span
            className={`save-indicator save-indicator--${saveStatus}`}
            title={
              isReadOnly
                ? "Case open in another tab"
                : persistenceAvailable
                  ? "Archive changes retained"
                  : "Archive is not retaining changes"
            }
          >
            {isReadOnly ? "READ ONLY" : saveStatus.toUpperCase()}
          </span>
          <button
            className="taskbar-sound-toggle"
            type="button"
            onClick={toggleMuted}
            title={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
          >
            <Image src="/icons/sound-recorder.png" alt="" width={16} height={16} />
            {muted && <span className="taskbar-sound-toggle__muted" aria-hidden="true" />}
          </button>
          <Clock />
        </div>
      </div>
      <div id="desktop-icons" onClick={(ev) => onClickOffsideIcon(ev)}>
        {desktopApps.map((app) => (
          <div
            key={app.id}
            className="desktop-icon"
            data-app-id={app.id}
            title="Double-click to open"
            onClick={(ev) => handleClickIcon(ev)}
          >
            <Image src={app.icon} alt={app.label} width={46} height={46} />
            <p>{app.label}</p>
          </div>
        ))}
      </div>
      {!warningDismissed &&
        isHydrated &&
        (isReadOnly || !persistenceAvailable || recoveredFromCheckpoint) && (
          <div className="archive-warning" role="status">
            <Image src="/icons/help.png" alt="" width={34} height={34} />
            <div>
              <strong>
                {isReadOnly
                  ? "This case is already open in another window."
                  : recoveredFromCheckpoint
                    ? "Archive consistency check recovered an earlier checkpoint."
                    : "Archive is not retaining changes."}
              </strong>
              <p>
                {isReadOnly
                  ? "This copy is read-only. Close the other tab before continuing."
                  : "Export a Case Code if you want a portable copy of your notes and progress."}
              </p>
            </div>
            {!isReadOnly && (
              <button
                className="button"
                onClick={async () => {
                  const code = await exportCode();
                  await navigator.clipboard.writeText(code);
                  setCaseCodeCopied(true);
                }}
              >
                {caseCodeCopied ? "Copied" : "Copy Case Code"}
              </button>
            )}
            <button
              className="button archive-warning__close"
              aria-label="Dismiss"
              onClick={() => setWarningDismissed(true)}
            >
              ×
            </button>
          </div>
        )}
    </main>
  );
};

export default Desktop;
