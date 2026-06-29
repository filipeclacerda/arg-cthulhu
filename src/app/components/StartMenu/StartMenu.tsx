"use client";
import React, { useState } from "react";
import "./style.scss";
import Image from "next/image";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { useProgress } from "@/app/context/ProgressContext";

const StartMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [runInput, setRunInput] = useState("");
  const { openWindow } = useWindowManager();
  const { hasFlag, raiseCorruption, reset } = useProgress();

  const endgameAvailable = hasFlag("endgame_available");

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    const startMenu = document.getElementById("start-menu");
    if (startMenu) {
      startMenu.classList.toggle("active");
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    const startMenu = document.getElementById("start-menu");
    if (startMenu) startMenu.classList.remove("active");
  };

  const onClickOutside = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = ev.target as HTMLDivElement;
    if (target.closest(".startMenuContainer")) return;
    if (isOpen) toggleMenu();
  };

  const handleShutDown = () => {
    closeMenu();
    if (endgameAvailable) {
      openWindow({
        id: "finale",
        appType: "finale",
        title: "RECOVERED PROGRAM",
      });
    }
  };

  const handleRun = () => {
    closeMenu();
    setShowRun(true);
  };

  const executeRunCommand = () => {
    const cmd = runInput.trim().toLowerCase();
    setRunInput("");
    setShowRun(false);

    if (cmd.startsWith("corrupt ")) {
      const n = parseInt(cmd.replace("corrupt ", ""), 10);
      if (!isNaN(n)) raiseCorruption(n);
    } else if (cmd === "reset") {
      reset();
      window.location.href = "/";
    } else if (cmd === "finale") {
      openWindow({ id: "finale", appType: "finale", title: "RECOVERED PROGRAM" });
    }
    // Unknown commands are silently ignored — it's a Win98 machine, it just blinks.
  };

  return (
    <>
      <button id="start-menu" className="button" onClick={toggleMenu}>
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
        <div className="startMenuContainer" onClick={(e) => onClickOutside(e)}>
          <div className="startMenuBrand">
            <span>Windows 98</span>
            <strong>Recovered</strong>
          </div>
          <div className="startMenuItems">
            <button className="startMenuButton button">Programs</button>
            <button className="startMenuButton button">Documents</button>
            <button className="startMenuButton button">Settings</button>
            <button className="startMenuButton button">Help</button>
            <button className="startMenuButton button" onClick={handleRun}>
              Run...
            </button>
            <button
              className={`startMenuButton button ${
                endgameAvailable ? "startMenuButton--danger" : ""
              }`}
              onClick={handleShutDown}
            >
              {endgameAvailable ? "RECOVERED PROGRAM" : "Shut Down..."}
            </button>
          </div>
        </div>
      )}
      {showRun && (
        <div className="runDialog">
          <label>Run:</label>
          <input
            className="input"
            autoFocus
            value={runInput}
            onChange={(e) => setRunInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") executeRunCommand();
              if (e.key === "Escape") {
                setShowRun(false);
                setRunInput("");
              }
            }}
          />
          <button
            className="button"
            onClick={executeRunCommand}
          >
            OK
          </button>
        </div>
      )}
    </>
  );
};

export default StartMenu;
