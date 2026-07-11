"use client";
import React, { useEffect, useRef, useState } from "react";
import "./style.scss";
import "../globals.scss";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Clock from "../components/Clock/Clock";
import StartMenu from "../components/StartMenu/StartMenu";
import { useWindowManager, AppType } from "../context/WindowManagerContext";
import { useProgress } from "../context/ProgressContext";
import { useSound, type AmbientStage } from "../context/SoundContext";
import { useSubliminalGlitch } from "../hooks/useSubliminalGlitch";
import { useCorruptionPulse } from "../hooks/useCorruptionPulse";
import { useI18n, TranslationKey } from "../i18n";
import {
  OBSERVER_CONCLUSION_IDS,
  OBSERVER_CONCLUSION_LABELS,
  ObserverConclusionId,
  isObserverConclusionAvailable,
  localized,
} from "../game/campaign";
import {
  DIEGETIC_EVENTS,
  DIEGETIC_FOCAL_WINDOW_IDS,
  DIEGETIC_SET_PIECE_WINDOW_IDS,
  DiegeticEventDefinition,
  diegeticContext,
  diegeticEventDelayMs,
  selectNextDiegeticEvent,
} from "../game/diegeticEvents";
import { setFocalSetPieceActive } from "../context/diegeticFocus";
import {
  desktopModeFromSearch,
  isStoryComplete,
  type DesktopMode,
} from "../game/endingLifecycle";
import DeepseaScreensaver from "../components/DeepseaScreensaver/DeepseaScreensaver";

/** A discreet coordinator toast (never a window) with one action. */
interface DiegeticToast {
  eventId: string;
  icon: string;
  kicker: string;
  heading: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}

interface DesktopApp {
  id: string;
  label: string;
  labelKey?: TranslationKey;
  appType: AppType;
  icon: string;
  props?: Record<string, any>;
  maximized?: boolean;
}

const LegacyMessengerTerminal = ({ onComplete }: { onComplete: () => void }) => {
  const { state, dispatchGameEvent } = useProgress();
  const [step, setStep] = useState<"connected" | "answer">("connected");
  const modernChoice = state.playerChoices.find(
    (choice) => choice.choiceId === "sarah_live_question"
  )?.optionId;
  const echo: Record<string, { en: string; pt: string }> = {
    alive: { en: "ARE YOU ALIVE?", pt: "VOCE ESTA VIVO?" },
    restore: { en: "WHAT DOES RESTORE DO?", pt: "O QUE RESTORE FAZ?" },
    break: { en: "HOW DO WE BREAK THIS?", pt: "COMO QUEBRAMOS ISSO?" },
    fourth: { en: "DID YOU CREATE THE FOURTH RECIPIENT?", pt: "VOCE CRIOU O QUARTO DESTINATARIO?" },
  };
  const received = echo[modernChoice ?? ""] ?? {
    en: "NO MESSAGE BODY RECOVERED",
    pt: "CORPO DA MENSAGEM NAO RECUPERADO",
  };
  const finish = (optionId: "remember" | "warn" | "silence") => {
    dispatchGameEvent({ type: "RECORD_CHOICE", choiceId: "next_user_1998_reply", optionId });
    dispatchGameEvent({ type: "SET_FLAG", flag: "next_user_1998_complete" });
    dispatchGameEvent({ type: "SET_FLAG", flag: "legacy_msn_files_recovered" });
    onComplete();
  };

  return (
    <section className="legacy-msn-terminal" aria-label="MSN text terminal">
      <header>MSN TEXT SERVICE 2.5 / M.BISHOP / 09-03-1998 03:14</header>
      <pre>{`MODEM 33.6K ........ CARRIER DETECTED\nREMOTE ID ......... NEXT_USER\nROUTE ............. RELAY-07 / LOOPBACK\n\nNEXT_USER> ${state.locale === "pt-BR" ? received.pt : received.en}\n\n${step === "connected" ? (state.locale === "pt-BR" ? "A mensagem tem data de 28 anos no futuro.\nO campo REMOTE USER contem a sua designacao." : "The message is dated 28 years in the future.\nREMOTE USER contains your designation.") : (state.locale === "pt-BR" ? "NEXT_USER> Eu lembro desta tela. Voce ainda nao.\nNEXT_USER> Escolha o que eu devo encontrar quando chegar ai." : "NEXT_USER> I remember this screen. You do not.\nNEXT_USER> Choose what I should find when I reach you.")}`}</pre>
      <div className="legacy-msn-terminal__choices">
        {step === "connected" ? (
          <button onClick={() => setStep("answer")}>[{state.locale === "pt-BR" ? "RESPONDER" : "REPLY"}]</button>
        ) : (
          <>
            <button onClick={() => finish("remember")}>{state.locale === "pt-BR" ? "[LEMBRE DESTA TELA]" : "[REMEMBER THIS SCREEN]"}</button>
            <button onClick={() => finish("warn")}>{state.locale === "pt-BR" ? "[NAO ESCREVA SEU NOME]" : "[DO NOT WRITE YOUR NAME]"}</button>
            <button onClick={() => finish("silence")}>{state.locale === "pt-BR" ? "[DEIXAR EM BRANCO]" : "[LEAVE BLANK]"}</button>
          </>
        )}
      </div>
    </section>
  );
};

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

const conclusionNotifiedFlag = (id: ObserverConclusionId) =>
  `observer_conclusion_${id}_notified`;

/**
 * Non-modal, one-time notice that an observer conclusion can now be retained.
 * Rendered as a fixed taskbar toast (never a dialog window), with direct
 * access to Casefile.exe. The persisted `observer_conclusion_*_notified`
 * flag is set the moment the toast appears, so it can never repeat.
 */
const ConclusionReadyToast = () => {
  const { flags, isHydrated, setFlag, state } = useProgress();
  const { openWindow } = useWindowManager();
  const { play } = useSound();
  const { locale, t } = useI18n();
  const [visibleId, setVisibleId] = useState<ObserverConclusionId | null>(
    null
  );

  useEffect(() => {
    if (!isHydrated || visibleId) return;
    const ready = OBSERVER_CONCLUSION_IDS.find(
      (id) =>
        !flags[conclusionNotifiedFlag(id)] &&
        !state.caseAnswers[id]?.solvedAt &&
        isObserverConclusionAvailable(state, id)
    );
    if (!ready) return;
    const timer = setTimeout(() => {
      setFlag(conclusionNotifiedFlag(ready));
      play("chime");
      setVisibleId(ready);
    }, 1800);
    return () => clearTimeout(timer);
  }, [flags, isHydrated, play, setFlag, state, visibleId]);

  if (!visibleId) return null;

  return (
    <div className="archive-warning conclusion-toast" role="status">
      <Image src="/icons/folder-special.png" alt="" width={34} height={34} />
      <div>
        <strong>{t("conclusionReadyKicker")}</strong>
        <p>
          {t("conclusionReadyBody")}{" "}
          <em>{localized(OBSERVER_CONCLUSION_LABELS[visibleId], locale)}</em>
        </p>
      </div>
      <button
        className="button"
        type="button"
        onClick={() => {
          openWindow({
            id: "casefile",
            appType: "casefile",
            title: t("casefileLabel"),
            maximized: true,
          });
          setVisibleId(null);
        }}
      >
        {t("openCasefileLabel")}
      </button>
      <button
        className="button archive-warning__close"
        aria-label={t("dismissLabel")}
        onClick={() => setVisibleId(null)}
      >
        ×
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
  const router = useRouter();
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
  // Read the query after mounting rather than through useSearchParams: this
  // desktop is statically built, and the mode must not turn /desktop into a
  // client-rendering bailout. Event presentation is hydration-gated below.
  const [desktopMode, setDesktopMode] = useState<DesktopMode | null>(null);
  const endingPresentationOpened = useRef(false);
  useEffect(() => {
    setDesktopMode(desktopModeFromSearch(window.location.search));
  }, []);
  // The only post-game desktop is an explicit archive review. A finished
  // campaign opened without this mode is handled by the Relay guard; keeping
  // this check narrow also means old/in-progress saves retain their desktop.
  const isAftermath = desktopMode === "aftermath" && isStoryComplete(state);
  const isEndingPresentation =
    desktopMode === "ending" && isStoryComplete(state);
  const isPostEndingDesktop = isAftermath || isEndingPresentation;
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
  const [flash1998, setFlash1998] = useState<1 | 2 | 3 | null>(null);
  const previousCorruptionStage = useRef<number | null>(null);
  const { labelGlitch, cursorEcho } = useSubliminalGlitch(
    !isPostEndingDesktop && corruptionStage >= 4,
    playerName
  );
  useCorruptionPulse(isPostEndingDesktop ? 0 : corruptionStage, play);

  // -------------------------------------------------------------------
  // Diegetic event coordinator. Every dialog, toast and takeover that used
  // to fire from independent effects now drains from one prioritized queue
  // (see src/app/game/diegeticEvents.ts). Never two focal windows at once;
  // a variable pause separates consecutive events; simple alerts present as
  // taskbar toasts instead of windows.
  // -------------------------------------------------------------------
  const [activeToast, setActiveToast] = useState<DiegeticToast | null>(null);

  const liveContactActive = state.liveContact.status === "active";
  const focalBusy =
    flash1998 !== null ||
    windows.some(
      (win) =>
        !win.minimized &&
        (DIEGETIC_FOCAL_WINDOW_IDS.has(win.id) ||
          win.id === "indexer-result" ||
          (win.id === "msn-messenger" && liveContactActive))
    );

  // Mandatory set pieces (priority-1 focal events and the 1998 overlay)
  // pause Sarah's live-contact timer in the Messenger.
  const setPieceActive =
    flash1998 !== null ||
    windows.some(
      (win) => !win.minimized && DIEGETIC_SET_PIECE_WINDOW_IDS.has(win.id)
    );
  useEffect(() => {
    setFocalSetPieceActive(setPieceActive);
    return () => setFocalSetPieceActive(false);
  }, [setPieceActive]);

  const localeIs = (pt: string, en: string) =>
    state.locale === "pt-BR" ? pt : en;

  const openFileFromToast = (
    appType: "notepad" | "image" | "audio",
    fileId: string,
    title: string
  ) =>
    openWindow({
      id: `${appType}-${fileId}`,
      appType,
      title,
      props: { fileId, windowClassName: "corrupted" },
    });

  const presentDiegeticEvent = (definition: DiegeticEventDefinition) => {
    if (flags[definition.seenFlag]) return;
    setFlag(definition.seenFlag);
    play(definition.sound);
    switch (definition.id) {
      case "mail_from_tomorrow":
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
                    openWindow({ id: "inbox", appType: "email", title: "E-mail" })
                  }
                >
                  {t("openInboxLabel")}
                </button>
              </div>
            ),
          },
        });
        break;
      case "restricted_folder":
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
        break;
      case "flash_1998_attempt_1":
      case "flash_1998_attempt_2":
      case "next_user_1998_session":
        setFlag("1998_flash_seen");
        setFlash1998(definition.id === "flash_1998_attempt_1" ? 1 : definition.id === "flash_1998_attempt_2" ? 2 : 3);
        break;
      case "margin_file":
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
        break;
      case "counting_file":
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
        break;
      case "chapter_seven":
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
        break;
      case "endgame_program":
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
        break;
      case "sarah_msn_live":
        // Sarah's live window is a chapter event, not a contact the player
        // must happen to check. One of the three sanctioned auto-opens.
        openWindow({
          id: "msn-messenger",
          appType: "messenger",
          title: "MSN Messenger",
          props: { windowClassName: "corrupted" },
        });
        break;
      case "printer_miriam_draft":
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
                  {localeIs(
                    "Uma impressora removida em 2004 confirmou o trabalho. Uma página foi recuperada em RECOVERED.",
                    "A printer removed in 2004 acknowledged the job. One page was recovered to RECOVERED."
                  )}
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
                  {localeIs("Ver página", "View page")}
                </button>
              </div>
            ),
          },
        });
        break;
      case "status_sheet":
        openWindow({
          id: "status-sheet-alert",
          appType: "generic",
          title: "EPSON Stylus COLOR 600",
          props: { children: <StatusSheetAlert /> },
        });
        break;
      case "voicemail_to_em":
        setActiveToast({
          eventId: definition.id,
          icon: "/icons/media-player.png",
          kicker: t("voicemailAttachmentKicker"),
          heading: "voicemail_to_em.wav",
          body: t("voicemailRecoveredLine"),
          actionLabel: t("openRecordingLabel"),
          onAction: () =>
            openWindow({
              id: "audio-voicemail_to_em",
              appType: "audio",
              title: "voicemail_to_em.wav",
              props: { fileId: "voicemail_to_em" },
            }),
        });
        break;
      case "optional_directory_comparison":
        setActiveToast({
          eventId: definition.id,
          icon: "/icons/notepad.png",
          kicker: "OPTIONAL RECOVERY THREAD",
          heading: "BISHOP_TREE.CMP",
          body: localeIs(
            "Duas imagens de usuário discordam sobre uma entrada que nenhuma origem contém.",
            "Two user snapshots disagree about an entry neither source contains."
          ),
          actionLabel: t("openFileLabel"),
          onAction: () =>
            openFileFromToast("notepad", "directory_comparison", "BISHOP_TREE.CMP"),
        });
        break;
      case "optional_office_1998":
        setActiveToast({
          eventId: definition.id,
          icon: "/icons/file.png",
          kicker: "OPTIONAL RECOVERY THREAD",
          heading: "office_1998.jpg",
          body: localeIs(
            "Três exposições compartilham o mesmo checksum e três datas incompatíveis.",
            "Three exposures share one frame checksum and three incompatible dates."
          ),
          actionLabel: t("openFileLabel"),
          onAction: () =>
            openFileFromToast("image", "office_1998_overlay", "office_1998.jpg"),
        });
        break;
      case "optional_silent_call":
        setActiveToast({
          eventId: definition.id,
          icon: "/icons/media-player.png",
          kicker: "OPTIONAL RECOVERY THREAD",
          heading: "CALL_0314.WAV",
          body: localeIs(
            "Uma chamada sem origem contém dois canais quase idênticos.",
            "A call with no caller contains two channels that are almost identical."
          ),
          actionLabel: t("openRecordingLabel"),
          onAction: () =>
            openFileFromToast("audio", "silent_call", "CALL_0314.WAV"),
        });
        break;
      case "sarah_break_cache":
        // Technical fallback for the break protocol: materializes the cache
        // fragment in RECOVERED only after the live contact is spent without
        // the `break` question. The emotional reply stays live-exclusive.
        setActiveToast({
          eventId: definition.id,
          icon: "/icons/notepad.png",
          kicker: "TEMP CACHE / PARTIAL FLUSH",
          heading: "sarah_break_cache.tmp",
          body: localeIs(
            "Um segmento de cache não descartado foi gravado em RECOVERED. A escrita nunca foi concluída.",
            "An undiscarded cache segment was written to RECOVERED. The write was never completed."
          ),
          actionLabel: t("openFileLabel"),
          onAction: () =>
            openFileFromToast(
              "notepad",
              "sarah_break_cache",
              "sarah_break_cache.tmp - Notepad"
            ),
        });
        break;
      case "micro_two_days_out":
        setActiveToast({
          eventId: definition.id,
          icon: "/icons/folder-special.png",
          kicker: "RETURN TRACE / UNINDEXED INTERVAL",
          heading: "41:58:12",
          body: localeIs(
            "Por quase dois dias, nenhum evento de Sarah entrou no índice. O relógio se lembrou deles de uma vez.",
            "For almost two days, no Sarah event entered the index. The clock remembered them all at once."
          ),
          actionLabel: localeIs("Ver sistema", "View system"),
          onAction: () =>
            openWindow({
              id: "system-properties",
              appType: "system-properties",
              title: "System Properties",
            }),
        });
        break;
      case "micro_tom_held_block":
        setActiveToast({
          eventId: definition.id,
          icon: "/icons/drive.png",
          kicker: "A: / VERIFY COMPLETE",
          heading: "TOM_HOLD.LOG",
          body: localeIs(
            "A unidade continua procurando um bloco que a cópia já regenerou.",
            "The drive keeps seeking for a block the copy has already regenerated."
          ),
          actionLabel: t("openFileLabel"),
          onAction: () =>
            openFileFromToast("notepad", "tom_hold_log", "TOM_HOLD.LOG"),
        });
        break;
      case "micro_eleanor_record":
        setActiveToast({
          eventId: definition.id,
          icon: "/icons/file.png",
          kicker: "PERSONNEL MIRROR / OWNER RECONCILED",
          heading: "ELEANOR.VCF",
          body: localeIs(
            "O registro recuperou uma pessoa. O campo de proprietário recuperou apenas um checksum.",
            "The record recovered a person. The owner field recovered only a checksum."
          ),
          actionLabel: t("openFileLabel"),
          onAction: () =>
            openFileFromToast("notepad", "eleanor_vcard", "ELEANOR.VCF"),
        });
        break;
    }
  };
  const presentRef = useRef(presentDiegeticEvent);
  useEffect(() => {
    presentRef.current = presentDiegeticEvent;
  });

  const nextEventId = isHydrated
    ? selectNextDiegeticEvent(diegeticContext(state), {
        focalBusy,
        toastBusy: activeToast !== null,
        aftermathReview: isPostEndingDesktop,
      })?.id ?? null
    : null;

  useEffect(() => {
    if (!nextEventId) return;
    const definition = DIEGETIC_EVENTS.find(
      (event) => event.id === nextEventId
    );
    if (!definition) return;
    const timer = setTimeout(
      () => presentRef.current(definition),
      diegeticEventDelayMs(definition)
    );
    return () => clearTimeout(timer);
    // The narrative pause does not restart on unrelated renders: the
    // presenter is read through a ref at fire time and a gate change changes
    // `nextEventId`, which cancels this timer.
  }, [nextEventId]);

  useEffect(() => {
    const timer = setTimeout(() => setBooted(true), 1700);
    return () => clearTimeout(timer);
  }, []);

  // A completed case never resumes as an ordinary live desktop. The only
  // exceptions are the deliberate ending replay and aftermath-review routes.
  // While an ending is being shown in the current window layer, keep it in
  // place so its coda can reach the explicit closure screen.
  useEffect(() => {
    if (
      !isHydrated ||
      !isStoryComplete(state) ||
      isPostEndingDesktop ||
      windows.some((window) => window.appType === "finale")
    )
      return;
    router.replace("/");
  }, [isHydrated, isPostEndingDesktop, router, state, windows]);

  // Sarah did not close the two windows that establish the case: Tom's
  // welfare-check email and her recently modified profile directory. This is
  // intentionally one-time and saved, so returning players resume their own
  // desktop instead of having their workspace rearranged on every reload.
  useEffect(() => {
    if (
      isPostEndingDesktop ||
      !booted ||
      !isHydrated ||
      flags.initial_boot_windows_restored
    )
      return;
    setFlag("initial_boot_windows_restored");
    const timer = setTimeout(() => {
      openWindow({ id: "inbox", appType: "email", title: "E-mail" });
      openWindow({
        id: "initial-profile-explorer",
        appType: "explorer",
        title: "Sarah Bishop",
        props: { folderId: "sarah" },
      });
    }, 260);
    return () => clearTimeout(timer);
  }, [
    booted,
    flags.initial_boot_windows_restored,
    isPostEndingDesktop,
    isHydrated,
    openWindow,
    setFlag,
  ]);

  useEffect(() => {
    if (
      !isPostEndingDesktop &&
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
  }, [corruptionStage, isPostEndingDesktop, play]);

  useEffect(() => {
    const normalizedStage = booted && !isPostEndingDesktop
      ? (Math.min(4, Math.max(0, corruptionStage)) as Exclude<AmbientStage, null>)
      : null;
    setAmbientStage(normalizedStage);
    return () => setAmbientStage(null);
  }, [booted, corruptionStage, isPostEndingDesktop, setAmbientStage]);

  useEffect(() => {
    document.body.classList.add("desktop-mode");
    return () => document.body.classList.remove("desktop-mode");
  }, []);

  // A few seconds after the sheet is visible, PRESENT flickers to DUPLICATED.
  // Driven by a persisted flag (not local component state) so the swap holds
  // even if the alert window was closed mid-wait.
  useEffect(() => {
    if (isPostEndingDesktop || !isHydrated) return;
    if (!flags.status_sheet_notice_shown || flags.status_sheet_duplicated) return;
    const flipDelay = 4000 + Math.random() * 3000;
    const timer = setTimeout(() => setFlag("status_sheet_duplicated"), flipDelay);
    return () => clearTimeout(timer);
  }, [
    flags.status_sheet_duplicated,
    flags.status_sheet_notice_shown,
    isPostEndingDesktop,
    isHydrated,
    setFlag,
  ]);


  // Generous, fixed 7s window, then a hard cut back to normal.
  useEffect(() => {
    if (isPostEndingDesktop || flash1998 == null || flash1998 === 3) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      if (flash1998 === 2) setFlag("miriam_1998_file_recovered");
      play("disk");
      setFlash1998(null);
    }, reducedMotion ? 20_000 : 7000);
    return () => clearTimeout(timer);
  }, [flash1998, isPostEndingDesktop, play, setFlag]);

  // Unlike the brief earlier flashes, this session requires a reply. Restore
  // it after a reload until the persisted terminal choice has been made.
  useEffect(() => {
    if (
      !isHydrated ||
      isPostEndingDesktop ||
      flash1998 !== null ||
      !flags.next_user_1998_session_shown ||
      flags.next_user_1998_complete
    ) return;
    setFlash1998(3);
  }, [flags.next_user_1998_complete, flags.next_user_1998_session_shown, flash1998, isHydrated, isPostEndingDesktop]);

  // A deliberate ending replay opens only the already-recorded Finale. Its
  // component renders the canonical coda from state and cannot offer another
  // ending once state.ending is present.
  useEffect(() => {
    if (
      !isHydrated ||
      !isEndingPresentation ||
      endingPresentationOpened.current
    )
      return;
    endingPresentationOpened.current = true;
    openWindow({
      id: "finale",
      appType: "finale",
      title: "RECOVERED PROGRAM",
    });
  }, [isEndingPresentation, isHydrated, openWindow]);

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
        !isPostEndingDesktop && state.worldReactionsSeen.includes("monitor_condensation")
          ? "desktop--condensation"
          : ""
      }
    >
      <DeepseaScreensaver
        enabled={
          !isPostEndingDesktop && state.assetVariantsSeen.includes("deepsea-screensaver")
        }
        playerName={playerName}
      />
      <div className="desktop-atmosphere" aria-hidden="true" />
      <div className="desktop-case-label" aria-hidden="true">
        {isAftermath ? (
          <>
            <span>CASE CLOSED — AFTERMATH REVIEW</span>
            <span>SB-0316 / READ-ONLY NARRATIVE ARCHIVE</span>
          </>
        ) : labelGlitch ? (
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
      {isAftermath && (
        <div className="archive-warning" role="status">
          <Image src="/icons/folder-special.png" alt="" width={34} height={34} />
          <div>
            <strong>
              {state.locale === "pt-BR"
                ? "CASO ENCERRADO — CONSULTA PÓS-ARQUIVAMENTO"
                : "CASE CLOSED — AFTERMATH REVIEW"}
            </strong>
            <p>
              {state.locale === "pt-BR"
                ? "Este desktop preserva apenas os registros já recuperados. Nenhum novo evento será iniciado."
                : "This desktop preserves recovered records only. No new narrative events will begin."}
            </p>
          </div>
          <button className="button" type="button" onClick={() => router.push("/play")}>
            {state.locale === "pt-BR" ? "VOLTAR AO RELAY" : "RETURN TO RELAY"}
          </button>
        </div>
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
      {activeToast && (
        <div className="archive-warning coordinator-toast" role="status">
          <Image src={activeToast.icon} alt="" width={34} height={34} />
          <div>
            <small>{activeToast.kicker}</small>
            <strong>{activeToast.heading}</strong>
            <p>{activeToast.body}</p>
          </div>
          <button
            className="button"
            type="button"
            onClick={() => {
              const action = activeToast.onAction;
              setActiveToast(null);
              action();
            }}
          >
            {activeToast.actionLabel}
          </button>
          <button
            className="button archive-warning__close"
            type="button"
            aria-label={t("dismissLabel")}
            onClick={() => setActiveToast(null)}
          >
            ×
          </button>
        </div>
      )}
      {!isPostEndingDesktop && <ConclusionReadyToast />}
      {!isPostEndingDesktop && flash1998 != null && (
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
          {flash1998 === 3 && (
            <>
              <LegacyMessengerTerminal onComplete={() => { play("disk"); setFlash1998(null); }} />
              <div className="desktop-1998-overlay__artifact desktop-1998-overlay__artifact--first">
                <Image src="/icons/file.png" alt="" width={34} height={34} /><span>DIALUP.LOG</span>
              </div>
              <div className="desktop-1998-overlay__artifact desktop-1998-overlay__artifact--second">
                <Image src="/icons/file.png" alt="" width={34} height={34} /><span>USERMAP.DAT</span>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
};

export default Desktop;
