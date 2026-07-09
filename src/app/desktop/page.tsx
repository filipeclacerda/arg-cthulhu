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
import { useCorruptionPulse } from "../hooks/useCorruptionPulse";
import { useI18n, TranslationKey } from "../i18n";

interface DesktopApp {
  id: string;
  label: string;
  labelKey?: TranslationKey;
  appType: AppType;
  icon: string;
  props?: Record<string, any>;
  maximized?: boolean;
}

const desktopApps: DesktopApp[] = [
  {
    id: "my-computer",
    label: "My Computer",
    labelKey: "myComputerLabel",
    appType: "explorer",
    icon: "/icons/my-computer.png",
    props: { folderId: "my-computer" },
  },
  {
    id: "my-documents",
    label: "My Documents",
    labelKey: "myDocumentsLabel",
    appType: "explorer",
    icon: "/icons/my-documents.png",
    props: { folderId: "sarah" },
  },
  {
    id: "case-notes",
    label: "Case Notes",
    labelKey: "caseNotesLabel",
    appType: "case-notes",
    icon: "/icons/notepad.png",
  },
  {
    id: "casefile",
    label: "Casefile.exe",
    labelKey: "casefileLabel",
    appType: "casefile",
    icon: "/icons/folder-special.png",
    maximized: true,
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
    labelKey: "recycleBinLabel",
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
  if (appType === "casefile") return "/icons/folder-special.png";
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
    state,
  } = useProgress();
  const { play, setAmbientActive, muted, toggleMuted } = useSound();
  const { t } = useI18n();
  const appLabel = (app: DesktopApp) => (app.labelKey ? t(app.labelKey) : app.label);
  const windowTitle = (win: (typeof windows)[number]) =>
    win.appType === "casefile"
      ? t("casefileLabel")
      : win.title;
  const SAVE_STATUS_LABELS: Record<string, TranslationKey> = {
    loading: "statusLoading",
    saving: "statusSaving",
    saved: "statusSaved",
    error: "statusError",
    readonly: "statusReadonly",
  };
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [caseCodeCopied, setCaseCodeCopied] = useState(false);
  const [booted, setBooted] = useState(false);
  const [selectedDesktopAppId, setSelectedDesktopAppId] = useState<
    string | null
  >(null);
  const previousCorruptionStage = useRef<number | null>(null);
  const { labelGlitch, cursorEcho } = useSubliminalGlitch(
    corruptionStage >= 4,
    playerName
  );
  useCorruptionPulse(corruptionStage, play);

  useEffect(() => {
    const timer = setTimeout(() => setBooted(true), 1700);
    return () => clearTimeout(timer);
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

    const timer = setTimeout(() => {
      setFlag("sarah_email_notice_shown");
      play("chime");
      openWindow({
        id: "new-mail-alert",
        appType: "generic",
        title: t("newMailTitle"),
        props: {
          windowClassName: "corrupted",
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">{t("messageReceivedKicker")}</p>
              <h2>sarah.bishop@miskatonic-research.org</h2>
              <p>{t("clockSyncWarning")}</p>
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
                {t("openInboxLabel")}
              </button>
            </div>
          ),
        },
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [
    flags.sarah_email_arrived,
    flags.sarah_email_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
    t,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (
      !state.worldReactionsSeen.includes("printer_wake") ||
      flags.printer_reaction_shown
    ) {
      return;
    }
    const timer = setTimeout(() => {
      setFlag("printer_reaction_shown");
      play("chime");
      openWindow({
        id: "printer-recovery-alert",
        appType: "generic",
        title: "EPSON Stylus COLOR 600",
        props: {
          children: (
            <div className="new-mail-alert printer-recovery-alert">
              <p className="new-mail-alert__kicker">PRINT SPOOLER / DEVICE NOT FOUND</p>
              <h2>MIRIAM_DRAFT.PRN</h2>
              <p>
                {state.locale === "pt-BR"
                  ? "Uma impressora removida em 2004 confirmou o trabalho. Uma página foi recuperada em RECOVERED."
                  : "A printer removed in 2004 acknowledged the job. One page was recovered to RECOVERED."}
              </p>
              <button
                className="button"
                onClick={() =>
                  openWindow({
                    id: "miriam-draft",
                    appType: "notepad",
                    title: "MIRIAM_DRAFT.PRN - Notepad",
                    props: { fileId: "miriam_draft" },
                  })
                }
              >
                {state.locale === "pt-BR" ? "Ver página" : "View page"}
              </button>
            </div>
          ),
        },
      });
    }, 1100);
    return () => clearTimeout(timer);
  }, [
    flags.printer_reaction_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
    t,
    state.locale,
    state.worldReactionsSeen,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (
      (!flags.puzzle_lot_114_solved && !flags.act1_recovered_partial) ||
      flags.restricted_folder_notice_shown
    ) return;

    const timer = setTimeout(() => {
      setFlag("restricted_folder_notice_shown");
      play("chime");
      openWindow({
        id: "restricted-folder-alert",
        appType: "generic",
        title: t("newFolderRecoveredTitle"),
        props: {
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">{t("fileSystemChangeKicker")}</p>
              <h2>{t("newFolderAppearedAccount")}</h2>
              <p>{t("recoveredMyDocumentsLine")}</p>
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
                {t("openFolderLabel")}
              </button>
            </div>
          ),
        },
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [
    flags.puzzle_lot_114_solved,
    flags.act1_recovered_partial,
    flags.restricted_folder_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
    t,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.puzzle_counting_audio_solved || flags.chapter_seven_notice_shown) return;

    const timer = setTimeout(() => {
      setFlag("chapter_seven_notice_shown");
      play("chime");
      openWindow({
        id: "chapter-seven-alert",
        appType: "generic",
        title: t("newFolderRecoveredTitle"),
        props: {
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">{t("fileSystemChangeKicker")}</p>
              <h2>{t("newFolderAppearedInside")}</h2>
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
                {t("openFolderLabel")}
              </button>
            </div>
          ),
        },
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [
    flags.puzzle_counting_audio_solved,
    flags.chapter_seven_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
    t,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (
      !flags.puzzle_palimpsest_solved ||
      flags.puzzle_margin_cipher_solved ||
      flags.margin_file_notice_shown
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setFlag("margin_file_notice_shown");
      play("chime");
      openWindow({
        id: "margin-file-alert",
        appType: "generic",
        title: t("newFileRecoveredTitle"),
        props: {
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">{t("fileSystemChangeKicker")}</p>
              <h2>margin_ch7.enc</h2>
              <p>{t("palimpsestFileLine")}</p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  openWindow({
                    id: "notepad-cipher_1",
                    appType: "notepad",
                    title: "margin_ch7.enc - Notepad",
                    props: { fileId: "cipher_1" },
                  })
                }
              >
                {t("openFileLabel")}
              </button>
            </div>
          ),
        },
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    flags.margin_file_notice_shown,
    flags.puzzle_margin_cipher_solved,
    flags.puzzle_palimpsest_solved,
    isHydrated,
    openWindow,
    play,
    setFlag,
    t,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (
      !flags.puzzle_margin_cipher_solved ||
      state.puzzles.counting_audio.solvedAt ||
      flags.counting_file_notice_shown
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setFlag("counting_file_notice_shown");
      play("chime");
      openWindow({
        id: "counting-file-alert",
        appType: "generic",
        title: t("newFileRecoveredTitle"),
        props: {
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">{t("fileSystemChangeKicker")}</p>
              <h2>counting.wav</h2>
              <p>{t("marginAudioLine")}</p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  openWindow({
                    id: "audio-counting_audio",
                    appType: "audio",
                    title: "counting.wav",
                    props: { fileId: "counting_audio" },
                  })
                }
              >
                {t("openRecordingLabel")}
              </button>
            </div>
          ),
        },
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    flags.counting_file_notice_shown,
    flags.puzzle_margin_cipher_solved,
    isHydrated,
    openWindow,
    play,
    setFlag,
    state.puzzles.counting_audio.solvedAt,
    t,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.endgame_available || flags.endgame_notice_shown) return;

    const timer = setTimeout(() => {
      setFlag("endgame_notice_shown");
      play("chime");
      openWindow({
        id: "recovered-program-alert",
        appType: "generic",
        title: t("recoveredProgramInstalledTitle"),
        props: {
          windowClassName: "corrupted",
          children: (
            <div className="new-mail-alert recovered-program-alert">
              <p className="new-mail-alert__kicker">{t("recoveredExecutableKicker")}</p>
              <h2>{t("chapterSevenFinishedIndexing")}</h2>
              <p>{t("recoveredProgramAvailable")}</p>
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
                {t("runProgramLabel")}
              </button>
            </div>
          ),
        },
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [
    flags.endgame_available,
    flags.endgame_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
    t,
  ]);

  const onClickOffsideIcon = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const target = ev.target as HTMLElement;
    if (!target.closest(".desktop-icon")) setSelectedDesktopAppId(null);
  };

  const handleClickIcon = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    appId: string
  ) => {
    ev.stopPropagation();
    setSelectedDesktopAppId(appId);
  };

  const handleDoubleClickIcon = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    app: DesktopApp
  ) => {
    ev.stopPropagation();
    openWindow({
      id: app.id,
      appType: app.appType,
      title: appLabel(app),
      props: app.props,
      maximized: app.maximized,
    });
    setSelectedDesktopAppId(null);
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
        <p>{t("mountingDiskImage")} — VOL_114</p>
      </main>
    );
  }

  return (
    <main
      id="desktop-root"
      className={
        state.worldReactionsSeen.includes("monitor_condensation")
          ? "desktop--condensation"
          : ""
      }
    >
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
                title={windowTitle(win)}
              >
                <Image src={appIcon(win.appType)} alt="" width={18} height={18} />
                <span>{windowTitle(win)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="taskbar-tray">
          <span
            className={`save-indicator save-indicator--${saveStatus}`}
            title={
              isReadOnly
                ? t("caseOpenAnotherTab")
                : persistenceAvailable
                  ? t("archiveChangesRetained")
                  : t("archiveNotRetaining")
            }
          >
            {t(isReadOnly ? "statusReadonly" : SAVE_STATUS_LABELS[saveStatus])}
          </span>
          <button
            className="taskbar-sound-toggle"
            type="button"
            onClick={toggleMuted}
            title={muted ? t("unmuteLabel") : t("muteLabel")}
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
            className={`desktop-icon ${
              selectedDesktopAppId === app.id ? "selected" : ""
            }`}
            data-app-id={app.id}
            title={t("doubleClickToOpen")}
            onClick={(ev) => handleClickIcon(ev, app.id)}
            onDoubleClick={(ev) => handleDoubleClickIcon(ev, app)}
          >
            <Image src={app.icon} alt={appLabel(app)} width={46} height={46} />
            <p>{appLabel(app)}</p>
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
                  ? t("caseOpenAnotherWindow")
                  : recoveredFromCheckpoint
                    ? t("checkpointRecovered")
                    : t("archiveNotRetaining")}
              </strong>
              <p>
                {isReadOnly
                  ? t("readOnlyCopyWarning")
                  : t("exportCaseCodeHint")}
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
                {caseCodeCopied ? t("copiedLabel") : t("copyCaseCodeLabel")}
              </button>
            )}
            <button
              className="button archive-warning__close"
              aria-label={t("dismissLabel")}
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
