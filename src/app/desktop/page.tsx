"use client";
import React, { useState } from "react";
import "./style.scss";
import "../globals.scss";
import Image from "next/image";
import { create } from "domain";
import { createPopUp } from "../components/PopUp/PopUp";

const Desktop = () => {
  const [windows, setWindows] = useState([]);
  const [startMenu, setStartMenu] = useState(false);
  const [startMenuItems, setStartMenuItems] = useState([]);
  const [desktopIcons, setDesktopIcons] = useState([]);
  const [desktopBackground, setDesktopBackground] = useState("");
  const [taskbar, setTaskbar] = useState([]);
  const [taskbarIcons, setTaskbarIcons] = useState([]);
  const [clickCount, setClickCount] = useState(0);

  const handleClickStart = () => {
    setStartMenu(!startMenu);
  };

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
    const icon = target.closest(".desktop-icon");
    console.log(icon?.classList)
    console.log(icon?.classList);
    if (!icon) return;
    if (icon.classList.contains("selected")) {
      createPopUp("My Computer", <div>My Computer</div>);
      deselectIcons();
    } else {
      icon?.classList.toggle("selected");
    }
  };
  return (
    <body>
      <div id="taskbar">
        <button id="start-button" className="button">
          <Image
            src="/windows-logo.png"
            alt="Windows Logo"
            width={28}
            height={28}
          />
          Start
        </button>
      </div>
      <div id="desktop-icons" onClick={(ev) => onClickOffsideIcon(ev)}>
        <div className="desktop-icon" onClick={(ev) => handleClickIcon(ev)}>
          <Image
            src="/windows-98-logo.png"
            alt="Windows 98 Logo"
            width={100}
            height={80}
          />
          <p>My Computer</p>
        </div>
      </div>
    </body>
  );
};

export default Desktop;
