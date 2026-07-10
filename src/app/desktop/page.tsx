"use client";
import React, { useEffect, useRef, useState } from "react";
import "./style.scss";
import "../globals.scss";
import Image from "next/image";
import Clock from "../components/Clock/Clock";
import StartMenu from "../components/StartMenu/StartMenu";
import { useWindowManager, AppType } from "../context/WindowManagerContext";
import { useProgress } from "../context/ProgressContext";
import { useSound, type AmbientStage } from "../context/SoundContext";
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

// Manifestation: the printer wakes on its own a few seconds after lot_114 is
// solved and answers a query nobody typed. This is a distinct artifact from
// the Casefile printer_wake/MIRIAM_DRAFT.PRN flow — do not conflate them.
// PRESENT -> DUPLICATED happens live here (data-driven off the persisted
// flag, not a local-only animation) so the swap survives even if the alert
// window is closed mid-flicker; STATUS_QUERY.PRN only ever shows the
// resolved line on reread.
const StatusSheetAlert = () => {
  const { flags, state } = useProgress();
  const { play } = useSound();
  const { openWindow } = useWindowManager();
  const { t } = useI18n();
  const duplicated = Boolean(flags.status_sheet_duplicated);
  const [flashed, setFlashed] = useState(false);
  const wasDuplicated = useRef(duplicated);

  useEffect(() => {
    if (duplicated && !wasDuplicated.current) {
      setFlashed(true);
      play("glitch");
      const timer = setTimeout(() => setFlashed(false), 220);
      wasDuplicated.current = true;
      return () => clearTimeout(timer);
    }
    wasDuplicated.current = duplicated;
  }, [duplicated, play]);

  return (
    <div className="new-mail-alert status-sheet-alert" role="status" aria-live="polite">
      <p className="new-mail-alert__kicker">PRINT SPOOL / UNSCHEDULED JOB</p>
      <h2>STATUS_QUERY.PRN</h2>
      <pre
        className={`status-sheet-alert__line ${
          flashed ? "status-sheet-alert__line--flicker" : ""
        }`}
      >
        {"SARAH BISHOP — STATUS: "}
        <span>{duplicated ? "DUPLICATED" : "PRESENT"}</span>
      </pre>
      <p>
        {state.locale === "pt-BR"
          ? "Nenhum aplicativo solicitou esta impressão. Uma linha foi capturada antes de o spooler ser liberado."
          : "No application requested this print job. One line was captured before the spooler cleared."}
      </p>
      <button
        className="button"
        type="button"
        onClick={() =>
          openWindow({
            id: "notepad-status_query_sheet",
            appType: "notepad",
            title: "STATUS_QUERY.PRN - Notepad",
            props: { fileId: "status_query_sheet" },
          })
        }
      >
        {t("openFileLabel")}
      </button>
    </div>
  );
};

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
  const { play, setAmbientStage, muted, toggleMuted } = useSound();
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
  // Manifestation: for ~7s the machine "becomes" Miriam's 1998 desktop. Two
  // possible attempts (palimpsest, then margin_cipher as a second chance) —
  // whichever the player takes, or neither.
  const [flash1998, setFlash1998] = useState<1 | 2 | null>(null);
  const previousCorruptionStage = useRef<number | null>(null);
  const { labelGlitch, cursorEcho } = useSubliminalGlitch(
    corruptionStage >= 4,
    playerName
  );
  useCorruptionPulse(corruptionStage, play);

  useEffect(() => {
    if (!isHydrated) return;
    const blockingIds = new Set([
      "new-mail-alert",
      "printer-recovery-alert",
      "restricted-folder-alert",
      "chapter-seven-alert",
      "margin-file-alert",
      "counting-file-alert",
      "voicemail-alert",
      "recovered-program-alert",
      "status-sheet-alert",
      "indexer-result",
      "msn-messenger",
    ]);
    const manifestationBusy =
      flash1998 !== null ||
      windows.some(
        (win) =>
          !win.minimized &&
          (blockingIds.has(win.id) || win.id.startsWith("optional-recovery-"))
      );
    if (manifestationBusy) return;
    const recovery =
      state.puzzles.margin_cipher.solvedAt &&
      !flags.directory_comparison_notice_shown
        ? {
            flag: "directory_comparison_notice_shown",
            title: "CHKDSK / ORPHANED DIRECTORY",
            fileId: "directory_comparison",
            appType: "notepad" as const,
            fileName: "BISHOP_TREE.CMP",
            en: "Two user snapshots disagree about an entry neither source contains.",
            pt: "Duas imagens de usuário discordam sobre uma entrada que nenhuma origem contém.",
          }
        : state.puzzles.counting_audio.solvedAt &&
            !flags.temporal_photos_notice_shown
          ? {
              flag: "temporal_photos_notice_shown",
              title: "EVIDENCE CAMERA / FRAME COLLISION",
              fileId: "office_1998_overlay",
              appType: "image" as const,
              fileName: "office_1998.jpg",
              en: "Three exposures share one frame checksum and three incompatible dates.",
              pt: "Três exposições compartilham o mesmo checksum e três datas incompatíveis.",
            }
          : state.puzzles.lineage.solvedAt && !flags.silent_call_notice_shown
            ? {
                flag: "silent_call_notice_shown",
                title: "PBX RECOVERY / NO ROUTE",
                fileId: "silent_call",
                appType: "audio" as const,
                fileName: "CALL_0314.WAV",
                en: "A call with no caller contains two channels that are almost identical.",
                pt: "Uma chamada sem origem contém dois canais quase idênticos.",
              }
            : null;
    if (!recovery) return;
    const timer = setTimeout(() => {
      setFlag(recovery.flag);
      play(recovery.appType === "audio" ? "future" : "disk");
      openWindow({
        id: `optional-recovery-${recovery.fileId}`,
        appType: "generic",
        title: recovery.title,
        props: {
          children: (
            <div className="new-mail-alert optional-recovery-alert">
              <p className="new-mail-alert__kicker">OPTIONAL RECOVERY THREAD</p>
              <h2>{recovery.fileName}</h2>
              <p>{state.locale === "pt-BR" ? recovery.pt : recovery.en}</p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  openWindow({
                    id: `${recovery.appType}-${recovery.fileId}`,
                    appType: recovery.appType,
                    title: recovery.fileName,
                    props: { fileId: recovery.fileId, windowClassName: "corrupted" },
                  })
                }
              >
                {t("openFileLabel")}
              </button>
            </div>
          ),
        },
      });
    }, 2400);
    return () => clearTimeout(timer);
  }, [
    flags,
    flash1998,
    isHydrated,
    openWindow,
    play,
    setFlag,
    state.locale,
    state.puzzles.counting_audio.solvedAt,
    state.puzzles.lineage.solvedAt,
    state.puzzles.margin_cipher.solvedAt,
    t,
    windows,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setBooted(true), 1700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (
      previousCorruptionStage.current !== null &&
      corruptionStage > previousCorruptionStage.current
    ) {
      const transitionSound =
        corruptionStage === 1
          ? "disk"
          : corruptionStage === 2
            ? "wet"
            : corruptionStage === 3
              ? "future"
              : "glitch";
      play(transitionSound);
    }
    previousCorruptionStage.current = corruptionStage;
  }, [corruptionStage, play]);

  useEffect(() => {
    const normalizedStage = booted
      ? (Math.min(4, Math.max(0, corruptionStage)) as Exclude<AmbientStage, null>)
      : null;
    setAmbientStage(normalizedStage);
    return () => setAmbientStage(null);
  }, [booted, corruptionStage, setAmbientStage]);

  useEffect(() => {
    document.body.classList.add("desktop-mode");
    return () => document.body.classList.remove("desktop-mode");
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.sarah_email_arrived || flags.sarah_email_notice_shown) return;

    const timer = setTimeout(() => {
      setFlag("sarah_email_notice_shown");
      play("future");
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

  // Sarah's live window is a chapter event, not a contact the player must
  // happen to check. It starts only once the mail alert is out of the way and
  // the Messenger window can actually receive focus.
  useEffect(() => {
    if (!isHydrated || !flags.sarah_msn_live || flags.sarah_msn_notice_shown) return;
    if (windows.some((win) => !win.minimized && win.id === "new-mail-alert")) return;
    const timer = setTimeout(() => {
      setFlag("sarah_msn_notice_shown");
      play("future");
      openWindow({
        id: "msn-messenger",
        appType: "messenger",
        title: "MSN Messenger",
        props: { windowClassName: "corrupted" },
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    flags.sarah_msn_live,
    flags.sarah_msn_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
    windows,
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
      play("disk");
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
      play("disk");
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
      play("disk");
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
      play("disk");
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
      play("wet");
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

  // The everyday reward: a banal voicemail arrives a beat after the
  // counting.wav set piece (post_end_transcript), never immediately — the
  // contrast lands better once the ghost transcript has had time to fade.
  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.post_end_transcript_seen || flags.voicemail_notice_shown) return;

    const timer = setTimeout(() => {
      setFlag("voicemail_notice_shown");
      play("chime");
      openWindow({
        id: "voicemail-alert",
        appType: "generic",
        title: t("newFileRecoveredTitle"),
        props: {
          children: (
            <div className="new-mail-alert">
              <p className="new-mail-alert__kicker">{t("voicemailAttachmentKicker")}</p>
              <h2>voicemail_to_em.wav</h2>
              <p>{t("voicemailRecoveredLine")}</p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  openWindow({
                    id: "audio-voicemail_to_em",
                    appType: "audio",
                    title: "voicemail_to_em.wav",
                    props: { fileId: "voicemail_to_em" },
                  })
                }
              >
                {t("openRecordingLabel")}
              </button>
            </div>
          ),
        },
      });
    }, 26_000);

    return () => clearTimeout(timer);
  }, [
    flags.post_end_transcript_seen,
    flags.voicemail_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
    t,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (
      !flags.endgame_available ||
      !flags.indexer_sequence_seen ||
      flags.endgame_notice_shown
    ) return;

    const timer = setTimeout(() => {
      setFlag("endgame_notice_shown");
      play("future");
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
    flags.indexer_sequence_seen,
    isHydrated,
    openWindow,
    play,
    setFlag,
    t,
  ]);

  // Manifestation: the printer wakes on its own 3-6s after lot_114 is solved.
  useEffect(() => {
    if (!isHydrated) return;
    if (
      !state.worldReactionsSeen.includes("status_sheet") ||
      flags.status_sheet_notice_shown
    ) {
      return;
    }
    const wakeDelay = 3000 + Math.random() * 3000;
    const timer = setTimeout(() => {
      setFlag("status_sheet_notice_shown");
      play("disk");
      openWindow({
        id: "status-sheet-alert",
        appType: "generic",
        title: "EPSON Stylus COLOR 600",
        props: { children: <StatusSheetAlert /> },
      });
    }, wakeDelay);
    return () => clearTimeout(timer);
  }, [
    flags.status_sheet_notice_shown,
    isHydrated,
    openWindow,
    play,
    setFlag,
    state.worldReactionsSeen,
  ]);

  // A few seconds after the sheet is visible, PRESENT flickers to DUPLICATED.
  // Driven by a persisted flag (not local component state) so the swap holds
  // even if the alert window was closed mid-wait.
  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.status_sheet_notice_shown || flags.status_sheet_duplicated) return;
    const flipDelay = 4000 + Math.random() * 3000;
    const timer = setTimeout(() => setFlag("status_sheet_duplicated"), flipDelay);
    return () => clearTimeout(timer);
  }, [
    flags.status_sheet_duplicated,
    flags.status_sheet_notice_shown,
    isHydrated,
    setFlag,
  ]);

  // Manifestation: the 1998 desktop flash. First chance after palimpsest;
  // if missed, a second chance after margin_cipher. Once the file is
  // recovered (or both chances are spent), it never triggers again.
  useEffect(() => {
    if (!isHydrated) return;
    if (flags.miriam_1998_file_recovered || flash1998 != null) return;
    if (windows.some((win) => !win.minimized && win.id === "margin-file-alert")) return;
    const attempt1Ready =
      Boolean(state.puzzles.palimpsest.solvedAt) &&
      !flags.flash_1998_attempt_1_shown;
    const attempt2Ready =
      Boolean(state.puzzles.margin_cipher.solvedAt) &&
      Boolean(flags.flash_1998_attempt_1_shown) &&
      !flags.flash_1998_attempt_2_shown;
    if (!attempt1Ready && !attempt2Ready) return;
    const attempt = attempt1Ready ? 1 : 2;
    const timer = setTimeout(() => {
      setFlag(`flash_1998_attempt_${attempt}_shown`);
      setFlag("1998_flash_seen");
      play("disk");
      setFlash1998(attempt);
    }, 1600);
    return () => clearTimeout(timer);
  }, [
    flags.flash_1998_attempt_1_shown,
    flags.flash_1998_attempt_2_shown,
    flags.miriam_1998_file_recovered,
    flash1998,
    isHydrated,
    play,
    setFlag,
    state.puzzles.margin_cipher.solvedAt,
    state.puzzles.palimpsest.solvedAt,
    windows,
  ]);

  // Generous, fixed 7s window, then a hard cut back to normal.
  useEffect(() => {
    if (flash1998 == null) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      if (flash1998 === 2) setFlag("miriam_1998_file_recovered");
      play("disk");
      setFlash1998(null);
    }, reducedMotion ? 20_000 : 7000);
    return () => clearTimeout(timer);
  }, [flash1998, play, setFlag]);

  const openMiriamAccessionFile = () => {
    setFlag("miriam_1998_file_recovered");
    play("disk");
    openWindow({
      id: "notepad-miriam_accession_notes_wk3",
      appType: "notepad",
      title: "accession_notes_wk3.txt - Notepad",
      props: { fileId: "miriam_accession_notes_wk3" },
    });
    // The window survives; only the overlay cuts away.
    setFlash1998(null);
  };

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
            <span>READ ONLY / VOL_114 / WRITES: 0</span>
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
      {flash1998 != null && (
        <div
          className="desktop-1998-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={
            state.locale === "pt-BR"
              ? "Sessão legada de 1998 detectada"
              : "Legacy 1998 session detected"
          }
        >
          <div className="desktop-1998-overlay__taskbar">
            <span className="desktop-1998-overlay__user">M. BISHOP</span>
            <span className="desktop-1998-overlay__clock">03:14</span>
          </div>
          <button
            type="button"
            className="desktop-1998-overlay__icon"
            onClick={openMiriamAccessionFile}
            autoFocus
          >
            <Image src="/icons/notepad.png" alt="" width={40} height={40} />
            <p>accession_notes_wk3.txt</p>
          </button>
        </div>
      )}
    </main>
  );
};

export default Desktop;
