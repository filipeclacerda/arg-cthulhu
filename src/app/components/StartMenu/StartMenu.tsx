"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import "./style.scss";
import { AppType, useWindowManager } from "@/app/context/WindowManagerContext";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { useI18n, TranslationKey } from "@/app/i18n";

type MenuView = "root" | "programs" | "accessories";

interface ProgramEntry {
  label: string;
  labelKey?: TranslationKey;
  icon: string;
  appType: AppType;
  id: string;
  title?: string;
  props?: Record<string, unknown>;
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
    id: "evidence-board",
    label: "Evidence Board",
    labelKey: "evidenceBoardLabel",
    icon: "/icons/folder-special.png",
    appType: "evidence-board",
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

const INDEX_FRAGMENTS = ["E7", "A1", "C4", "B9"];

const IndexerResult = ({ locale }: { locale: "en" | "pt-BR" }) => {
  const [visible, setVisible] = useState(0);

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
          <div aria-label="The assembled name cannot be displayed">
            ᚱᛚᛇ·ᚦᛟᚾ·ᚷᚨᛏ·ᛞᛉ
          </div>
          <strong>
            {locale === "pt-BR"
              ? "O índice contém seu leitor atual."
              : "The index contains its current reader."}
          </strong>
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
  const { hasFlag, runCommand } = useProgress();
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
    });
    closeMenu();
  };

  const executeRunCommand = () => {
    const command = runInput.trim();
    setRunInput("");
    setShowRun(false);
    const result = runCommand(command);

    if (result.commandAccepted) {
      play("chime");
      openWindow({
        id: "indexer-result",
        appType: "generic",
        title: "Miskatonic Recovery Indexer",
        props: {
          windowClassName: "corrupted",
          children: <IndexerResult locale={locale} />,
        },
      });
      return;
    }

    play("error");
    const errorMessage =
      result.commandError === "missing_references"
        ? t("missingReferences")
        : result.commandError === "wrong_order"
          ? t("wrongOrder")
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
                  <button className="startMenuButton button" onClick={() => launch(ACCESSORIES[0])}>
                    <Image src="/icons/my-documents.png" alt="" width={30} height={30} />
                    <span>{t("documents")}</span>
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
