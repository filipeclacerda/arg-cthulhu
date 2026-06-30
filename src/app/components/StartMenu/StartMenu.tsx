"use client";

import Image from "next/image";
import React, { useState } from "react";
import "./style.scss";
import { AppType, useWindowManager } from "@/app/context/WindowManagerContext";
import { useProgress } from "@/app/context/ProgressContext";

type MenuView = "root" | "programs" | "accessories";

interface ProgramEntry {
  label: string;
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
    icon: "/icons/notepad.png",
    appType: "case-notes",
  },
  {
    id: "cipher-lab",
    label: "Cipher Lab",
    icon: "/icons/internet-options.png",
    appType: "cipher-lab",
  },
  {
    id: "calculator",
    label: "Calculator",
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

const StartMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<MenuView>("root");
  const [showRun, setShowRun] = useState(false);
  const [runInput, setRunInput] = useState("");
  const { openWindow } = useWindowManager();
  const { hasFlag, runCommand } = useProgress();

  const endgameAvailable = hasFlag("endgame_available");

  const closeMenu = () => {
    setIsOpen(false);
    setView("root");
  };

  const toggleMenu = () => {
    setIsOpen((value) => !value);
    setView("root");
  };

  const launch = (entry: ProgramEntry) => {
    openWindow({
      id: entry.id,
      appType: entry.appType,
      title: entry.title ?? entry.label,
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
      openWindow({
        id: "indexer-result",
        appType: "generic",
        title: "Miskatonic Recovery Indexer",
        props: {
          windowClassName: "corrupted",
          children: (
            <div className="indexer-result">
              <p>JOIN COMPLETE / 4 OBJECT REFERENCES</p>
              <div aria-label="The assembled name cannot be displayed">
                ᚷᛚᛁ·ᚦᛟᚱ·ᚾᚨᛗ·ᛖᛋ
              </div>
              <strong>The index contains its current reader.</strong>
            </div>
          ),
        },
      });
      return;
    }

    openWindow({
      appType: "generic",
      title: "Run",
      props: {
        children: (
          <div className="run-error">
            <strong>Cannot find the file (or one of its components).</strong>
            <p>Check that the path and filename are correct.</p>
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
      <span>{entry.label}</span>
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
        Start
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
                  ‹ Back
                </button>
              )}

              {view === "root" && (
                <>
                  <button className="startMenuButton button" onClick={() => setView("programs")}>
                    <Image src="/icons/my-computer.png" alt="" width={30} height={30} />
                    <span>Programs</span><b>▶</b>
                  </button>
                  <button className="startMenuButton button" onClick={() => launch(ACCESSORIES[0])}>
                    <Image src="/icons/my-documents.png" alt="" width={30} height={30} />
                    <span>Documents</span>
                  </button>
                  <button
                    className="startMenuButton button"
                    onClick={() => launch({
                      id: "system-properties",
                      label: "System Properties",
                      title: "System Properties",
                      icon: "/icons/internet-options.png",
                      appType: "system-properties",
                    })}
                  >
                    <Image src="/icons/internet-options.png" alt="" width={30} height={30} />
                    <span>Settings</span>
                  </button>
                  <button
                    className="startMenuButton button"
                    onClick={() => launch({
                      id: "help-center",
                      label: "Windows Help",
                      icon: "/icons/help.png",
                      appType: "help",
                    })}
                  >
                    <Image src="/icons/help.png" alt="" width={30} height={30} />
                    <span>Help</span>
                  </button>
                  <div className="startMenuDivider" />
                  <button className="startMenuButton button" onClick={() => {
                    closeMenu();
                    setShowRun(true);
                  }}>
                    <Image src="/icons/file.png" alt="" width={30} height={30} />
                    <span>Run...</span>
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
                    <span>{endgameAvailable ? "RECOVERED PROGRAM" : "Shut Down..."}</span>
                  </button>
                </>
              )}

              {view === "programs" && (
                <>
                  {PROGRAMS.map(renderProgramEntry)}
                  <button className="startMenuButton button" onClick={() => setView("accessories")}>
                    <Image src="/icons/favorites.png" alt="" width={30} height={30} />
                    <span>Accessories</span><b>▶</b>
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
