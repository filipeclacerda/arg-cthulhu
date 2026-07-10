"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import "./style.scss";
import { AppType, useWindowManager } from "@/app/context/WindowManagerContext";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { useI18n, TranslationKey } from "@/app/i18n";
import {
  OBSERVER_CONCLUSION_LABELS,
  localized,
  pendingObserverConclusions,
} from "@/app/game/campaign";

type MenuView = "root" | "programs" | "accessories" | "recent";

interface ProgramEntry {
  label: string;
  labelKey?: TranslationKey;
  icon: string;
  appType: AppType;
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  maximized?: boolean;
}

const PROGRAMS: ProgramEntry[] = [
  {
    id: "internet-explorer",
    label: "Internet Explorer",
    title: "Microsoft Internet Explorer",
    icon: "/icons/internet-explorer.png",
    appType: "browser",
  },
  {
    id: "outlook-express",
    label: "Outlook Express",
    icon: "/icons/outlook-express.png",
    appType: "email",
  },
  {
    id: "msn-messenger",
    label: "MSN Messenger",
    icon: "/icons/msn-messenger.png",
    appType: "messenger",
  },
  {
    id: "windows-explorer",
    label: "Windows Explorer",
    icon: "/icons/my-computer.png",
    appType: "explorer",
    props: { folderId: "my-computer" },
  },
];

const ACCESSORIES: ProgramEntry[] = [
  {
    id: "casefile",
    label: "Casefile.exe",
    labelKey: "casefileLabel",
    icon: "/icons/folder-special.png",
    appType: "casefile",
    maximized: true,
  },
  {
    id: "archive-viewer",
    label: "Archive Viewer",
    icon: "/icons/drive.png",
    appType: "archive-viewer",
  },
  {
    id: "case-notes",
    label: "Case Notes",
    labelKey: "caseNotesLabel",
    icon: "/icons/notepad.png",
    appType: "case-notes",
  },
  {
    id: "cipher-lab",
    label: "Cipher Lab",
    labelKey: "cipherLabLabel",
    icon: "/icons/internet-options.png",
    appType: "cipher-lab",
  },
  {
    id: "calculator",
    label: "Calculator",
    labelKey: "calculatorLabel",
    icon: "/icons/internet-options.png",
    appType: "calculator",
  },
  {
    id: "paint",
    label: "Paint",
    icon: "/icons/favorites.png",
    appType: "paint",
  },
];

// A deliberately small first-reading surface. These are shortcuts, not a
// replacement for Explorer: the rest of Sarah's disk remains discoverable.
const RECENT_DOCUMENTS: ProgramEntry[] = [
  { id: "recent-incident", label: "incident_report.txt", icon: "/icons/notepad.png", appType: "notepad", props: { fileId: "incident_report" } },
  { id: "recent-diary", label: "diary.txt", icon: "/icons/notepad.png", appType: "notepad", props: { fileId: "diary" } },
  { id: "recent-miriam", label: "mom_1998.txt", icon: "/icons/notepad.png", appType: "notepad", props: { fileId: "mom_1998" } },
  { id: "recent-borrowers", label: "borrower_index.txt", icon: "/icons/notepad.png", appType: "notepad", props: { fileId: "borrower_index" } },
  { id: "recent-todo", label: "to_do.txt", icon: "/icons/notepad.png", appType: "notepad", props: { fileId: "todo" } },
  { id: "recent-lecture", label: "lecture_draft.txt", icon: "/icons/notepad.png", appType: "notepad", props: { fileId: "lecture_draft" } },
];

const INDEX_FRAGMENTS = ["E7", "A1", "C4", "B9"];

// Dry system tally, phase 2 of the IDENTITY COLLISION sequence. Kept in
// English in both locales — this is system output, same convention as
// "INDEX /JOIN" itself never being translated.
const PHASE_TWO_LINES = [
  "4 REFERENCES FOUND",
  "3 RECIPIENTS CLOSED",
  "1 RECIPIENT ACTIVE",
];

const IndexerResult = ({
  locale,
  playerName,
}: {
  locale: "en" | "pt-BR";
  playerName: string | null;
}) => {
  const { setFlag } = useProgress();
  const [visible, setVisible] = useState(0);
  const [phase2Visible, setPhase2Visible] = useState(0);
  const [showBridgeLine, setShowBridgeLine] = useState(false);
  const [showCollision, setShowCollision] = useState(false);
  const [showStartMenuNote, setShowStartMenuNote] = useState(false);

  // Phase 1 (existing): the four collected references acknowledge one by one.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisible((count) => {
        if (count >= INDEX_FRAGMENTS.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, []);

  // Once all four are acknowledged and the unreadable runes appear, the rest
  // of the sequence plays out in fixed beats: a dry recipient tally (phase 2),
  // the bridge line that already existed, then the IDENTITY COLLISION block
  // itself (phase 3), then the pointer to the Start Menu. Placed after the
  // runes rather than before them — the runes are the mystery beat, the tally
  // is the system's administrative comedown from it, and the collision block
  // is the sentence that comedown was building toward.
  useEffect(() => {
    if (visible < INDEX_FRAGMENTS.length) return;
    const timers = [
      window.setTimeout(() => setPhase2Visible(1), 900),
      window.setTimeout(() => setPhase2Visible(2), 1600),
      window.setTimeout(() => setPhase2Visible(3), 2300),
      window.setTimeout(() => setShowBridgeLine(true), 3200),
      window.setTimeout(() => setShowCollision(true), 4400),
      window.setTimeout(() => setShowStartMenuNote(true), 5700),
      window.setTimeout(() => setFlag("indexer_sequence_seen"), 6500),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [setFlag, visible]);

  return (
    <div className="indexer-result">
      <p>
        {locale === "pt-BR"
          ? "UNINDO REFERÊNCIAS DE OBJETO"
          : "JOINING OBJECT REFERENCES"}
      </p>
      <ol>
        {INDEX_FRAGMENTS.map((fragment, index) => (
          <li key={fragment} className={index < visible ? "visible" : ""}>
            {fragment} {index < visible ? "ACKNOWLEDGED" : "WAITING"}
          </li>
        ))}
      </ol>
      {visible === INDEX_FRAGMENTS.length && (
        <>
          <div
            className="indexer-result__runes"
            aria-label="The assembled name cannot be displayed"
          >
            ᚱᛚᛇ·ᚦᛟᚾ·ᚷᚨᛏ·ᛞᛉ
          </div>
          {phase2Visible > 0 && (
            <ol className="indexer-result__system-log">
              {PHASE_TWO_LINES.slice(0, phase2Visible).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          )}
          {showBridgeLine && (
            <strong className="indexer-result__bridge">
              {locale === "pt-BR"
                ? "O índice contém seu leitor atual."
                : "The index contains its current reader."}
            </strong>
          )}
          {showCollision && (
            <div className="indexer-result__collision">
              <p className="indexer-result__collision-label">
                IDENTITY COLLISION:
              </p>
              <p className="indexer-result__collision-record">SARAH BISHOP</p>
              <p className="indexer-result__collision-record">
                {(playerName?.trim() || "NEXT USER").toUpperCase()}
              </p>
              <p className="indexer-result__collision-select">
                SELECT CANONICAL RECORD
              </p>
            </div>
          )}
          {showStartMenuNote && (
            <p className="indexer-result__note">
              {locale === "pt-BR"
                ? "RECOVERED PROGRAM disponível no Menu Iniciar."
                : "RECOVERED PROGRAM available from the Start Menu."}
            </p>
          )}
        </>
      )}
    </div>
  );
};

const StartMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<MenuView>("root");
  const [showRun, setShowRun] = useState(false);
  const [runInput, setRunInput] = useState("");
  const { openWindow } = useWindowManager();
  const { hasFlag, runCommand, playerName, state } = useProgress();
  const { play } = useSound();
  const { locale, t } = useI18n();

  const endgameAvailable = hasFlag("endgame_available");

  const closeMenu = () => {
    setIsOpen(false);
    setView("root");
  };

  const toggleMenu = () => {
    setIsOpen((value) => !value);
    setView("root");
  };

  const entryLabel = (entry: ProgramEntry) =>
    entry.labelKey ? t(entry.labelKey) : entry.label;

  const launch = (entry: ProgramEntry) => {
    openWindow({
      id: entry.id,
      appType: entry.appType,
      title: entry.title ?? entryLabel(entry),
      props: entry.props,
      maximized: entry.maximized,
    });
    closeMenu();
  };

  const executeRunCommand = () => {
    const command = runInput.trim();
    const normalizedCommand = command.toUpperCase().replace(/\s+/g, " ");
    const sealCommand =
      normalizedCommand === "INDEX /SEAL RELAY-07 /WITNESS ARCHIVE";
    const incompleteRestoreCommand =
      normalizedCommand === "INDEX /RESTORE /INCOMPLETE";
    setRunInput("");
    setShowRun(false);
    const result = runCommand(command);

    if (result.commandAccepted) {
      play("chime");
      if (sealCommand) {
        openWindow({
          id: "finale",
          appType: "finale",
          title: "RECOVERED PROGRAM / LOOPBACK",
          props: { windowClassName: "corrupted" },
        });
        return;
      }
      if (incompleteRestoreCommand) {
        openWindow({
          id: "counter-index-ready",
          appType: "generic",
          title: "Miskatonic Recovery Indexer / STAGED OPERATION",
          props: {
            windowClassName: "corrupted",
            children: (
              <div className="indexer-result">
                <p>INDEX /RESTORE /INCOMPLETE</p>
                <ol className="indexer-result__system-log">
                  <li>3 SOURCE RECORDS HELD</li>
                  <li>1 FIELD WITHHELD</li>
                  <li>OPERATION STAGED / NOT EXECUTED</li>
                </ol>
                <strong className="indexer-result__bridge">
                  {locale === "pt-BR"
                    ? "Uma operação adicional está disponível no RECOVERED PROGRAM."
                    : "An additional operation is available in RECOVERED PROGRAM."}
                </strong>
              </div>
            ),
          },
        });
        return;
      }
      openWindow({
        id: "indexer-result",
        appType: "generic",
        title: "Miskatonic Recovery Indexer",
        props: {
          windowClassName: "corrupted",
          children: <IndexerResult locale={locale} playerName={playerName} />,
        },
      });
      return;
    }

    play("error");
    // The refusal names what is missing instead of counting it: the pending
    // observer conclusion(s) are quoted by their Casefile titles.
    const pendingConclusionNames = pendingObserverConclusions(state)
      .map((id) => `"${localized(OBSERVER_CONCLUSION_LABELS[id], locale)}"`)
      .join("; ");
    const errorMessage =
      result.commandError === "missing_references"
        ? t("missingReferences")
        : result.commandError === "wrong_order"
          ? t("wrongOrder")
          : result.commandError === "case_incomplete"
            ? incompleteRestoreCommand
              ? t("stagedOperationIncomplete")
              : `${t("caseIncompleteLead")} ${pendingConclusionNames}`
            : result.commandError === "seal_unavailable"
              ? locale === "pt-BR"
                ? "O arquivo não reconhece a si mesmo como testemunha. Seis correlações independentes são necessárias."
                : "The archive does not recognize itself as a witness. Six independent correlations are required."
          : t("invalidCommand");
    openWindow({
      appType: "generic",
      title: "Run",
      props: {
        children: (
          <div className="run-error">
            <strong>
              {result.commandError === "wrong_order"
                ? "INDEX: TIMESTAMP ORDER CONFLICT"
                : "INDEX: REFERENCE LOOKUP FAILED"}
            </strong>
            <p>{errorMessage}</p>
          </div>
        ),
      },
    });
  };

  const renderProgramEntry = (entry: ProgramEntry) => (
    <button
      key={entry.id}
      className="startMenuButton button startMenuProgram"
      onClick={() => launch(entry)}
    >
      <Image src={entry.icon} alt="" width={30} height={30} />
      <span>{entryLabel(entry)}</span>
    </button>
  );

  return (
    <>
      <button
        id="start-menu"
        className={`button ${isOpen ? "active" : ""}`}
        onClick={toggleMenu}
        aria-expanded={isOpen}
      >
        <Image
          src="/windows-logo.png"
          alt="Windows Logo"
          width={28}
          height={28}
          priority
        />
        {t("start")}
      </button>

      {isOpen && (
        <>
          <button
            className="start-menu-scrim"
            aria-label="Close Start menu"
            onClick={closeMenu}
          />
          <div className="startMenuContainer">
            <div className="startMenuBrand">
              <span>Windows 98</span>
              <strong>Recovered</strong>
            </div>
            <div className="startMenuItems">
              {view !== "root" && (
                <button
                  className="startMenuButton button startMenuBack"
                  onClick={() => setView(view === "accessories" ? "programs" : "root")}
                >
                  ‹ {t("back")}
                </button>
              )}

              {view === "root" && (
                <>
                  <button className="startMenuButton button" onClick={() => setView("programs")}>
                    <Image src="/icons/my-computer.png" alt="" width={30} height={30} />
                    <span>{t("programs")}</span><b>▶</b>
                  </button>
                  <button
                    className="startMenuButton button"
                    onClick={() =>
                      launch({
                        id: "my-documents",
                        label: "My Documents",
                        labelKey: "myDocumentsLabel",
                        icon: "/icons/my-documents.png",
                        appType: "explorer",
                        props: { folderId: "sarah" },
                      })
                    }
                  >
                    <Image src="/icons/my-documents.png" alt="" width={30} height={30} />
                    <span>{t("documents")}</span>
                  </button>
                  <button
                    className="startMenuButton button"
                    onClick={() => setView("recent")}
                  >
                    <Image src="/icons/notepad.png" alt="" width={30} height={30} />
                    <span>{locale === "pt-BR" ? "Documentos recentes" : "Recent Documents"}</span><b>▶</b>
                  </button>
                  <button
                    className="startMenuButton button"
                    onClick={() => launch({
                      id: "system-properties",
                      label: "System Properties",
                      labelKey: "systemPropertiesLabel",
                      icon: "/icons/internet-options.png",
                      appType: "system-properties",
                    })}
                  >
                    <Image src="/icons/internet-options.png" alt="" width={30} height={30} />
                    <span>{t("settings")}</span>
                  </button>
                  <button
                    className="startMenuButton button"
                    onClick={() => launch({
                      id: "help-center",
                      label: "Windows Help",
                      labelKey: "windowsHelpLabel",
                      icon: "/icons/help.png",
                      appType: "help",
                    })}
                  >
                    <Image src="/icons/help.png" alt="" width={30} height={30} />
                    <span>{t("help")}</span>
                  </button>
                  <div className="startMenuDivider" />
                  <button className="startMenuButton button" onClick={() => {
                    closeMenu();
                    setShowRun(true);
                  }}>
                    <Image src="/icons/file.png" alt="" width={30} height={30} />
                    <span>{t("run")}</span>
                  </button>
                  <button
                    className={`startMenuButton button ${endgameAvailable ? "startMenuButton--danger" : ""}`}
                    onClick={() => {
                      closeMenu();
                      if (endgameAvailable) {
                        openWindow({ id: "finale", appType: "finale", title: "RECOVERED PROGRAM" });
                      } else {
                        openWindow({
                          id: "shutdown-warning",
                          appType: "generic",
                          title: "Shut Down Windows",
                          props: {
                            children: (
                              <div className="shutdown-warning">
                                <p>Windows cannot shut down while a recovered disk image is mounted.</p>
                                <button className="button">OK</button>
                              </div>
                            ),
                          },
                        });
                      }
                    }}
                  >
                    <Image src="/icons/sound-recorder.png" alt="" width={30} height={30} />
                    <span>
                      {endgameAvailable
                        ? t("recoveredProgram")
                        : t("shutdown")}
                    </span>
                  </button>
                </>
              )}

              {view === "programs" && (
                <>
                  {PROGRAMS.map(renderProgramEntry)}
                  <button className="startMenuButton button" onClick={() => setView("accessories")}>
                    <Image src="/icons/favorites.png" alt="" width={30} height={30} />
                    <span>{t("accessoriesLabel")}</span><b>▶</b>
                  </button>
                </>
              )}

              {view === "accessories" && ACCESSORIES.map(renderProgramEntry)}
              {view === "recent" && RECENT_DOCUMENTS.map(renderProgramEntry)}
            </div>
          </div>
        </>
      )}

      {showRun && (
        <div className="runDialog">
          <Image src="/icons/file.png" alt="" width={30} height={30} />
          <div>
            <p>Type the name of a program, folder, document, or Internet resource.</p>
            <label htmlFor="run-command">Open:</label>
            <input
              id="run-command"
              className="input"
              autoFocus
              value={runInput}
              onChange={(event) => setRunInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") executeRunCommand();
                if (event.key === "Escape") {
                  setShowRun(false);
                  setRunInput("");
                }
              }}
            />
          </div>
          <div className="runDialog__buttons">
            <button className="button" onClick={executeRunCommand}>OK</button>
            <button className="button" onClick={() => setShowRun(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

export default StartMenu;
