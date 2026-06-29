"use client";
import React from "react";
import "./style.scss";
import "../globals.scss";
import Image from "next/image";
import Clock from "../components/Clock/Clock";
import StartMenu from "../components/StartMenu/StartMenu";
import { useWindowManager, AppType } from "../context/WindowManagerContext";

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
    id: "inbox",
    label: "E-mail",
    appType: "email",
    icon: "/icons/inbox.png",
  },
];

const Desktop = () => {
  const { openWindow } = useWindowManager();

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
      const app = desktopApps.find((a) => a.id === icon.dataset.appId);
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
  return (
    <body>
      <div id="taskbar">
        <div>
          <StartMenu />
        </div>
        <Clock />
      </div>
      <div id="desktop-icons" onClick={(ev) => onClickOffsideIcon(ev)}>
        {desktopApps.map((app) => (
          <div
            key={app.id}
            className="desktop-icon"
            data-app-id={app.id}
            onClick={(ev) => handleClickIcon(ev)}
          >
            <Image src={app.icon} alt={app.label} width={46} height={46} />
            <p>{app.label}</p>
          </div>
        ))}
      </div>
    </body>
  );
};

export default Desktop;
