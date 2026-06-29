"use client";
import React, { useEffect } from "react";
import "./style.scss";
import "../globals.scss";
import Image from "next/image";
import Clock from "../components/Clock/Clock";
import StartMenu from "../components/StartMenu/StartMenu";
import { useWindowManager, AppType } from "../context/WindowManagerContext";
import { useProgress } from "../context/ProgressContext";

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
  const { playerName, flags, isHydrated, setFlag } = useProgress();

  useEffect(() => {
    document.body.classList.add("desktop-mode");
    return () => document.body.classList.remove("desktop-mode");
  }, []);

  // Open the diegetic registration dialog on first visit (playerName not yet set).
  // We use null as the sentinel — a player who explicitly skipped is also null,
  // but the flag "registration_shown" prevents us from asking twice.
  useEffect(() => {
    if (!isHydrated) return;
    if (playerName === null && !flags.registration_shown) {
      // Small delay so the desktop renders before the dialog pops.
      const t = setTimeout(() => {
        openWindow({
          id: "registration",
          appType: "registration",
          title: "Researcher Visitor Log",
        });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [flags.registration_shown, isHydrated, openWindow, playerName]);

  // After the visitor log is handled, give the player a diegetic nudge instead
  // of a tutorial overlay. This makes the first goal legible without breaking
  // the "old computer" fantasy.
  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.registration_shown || flags.desktop_intro_shown) return;

    const t = setTimeout(() => {
      setFlag("desktop_intro_shown");
      openWindow({
        id: "mount-briefing",
        appType: "generic",
        title: "Mount Complete",
        props: {
          children: (
            <div className="briefing-window">
              <p className="briefing-kicker">READ-ONLY DISK IMAGE</p>
              <h2>Sarah Bishop&apos;s workstation is mounted.</h2>
              <p>
                Two useful places survived the transfer: her Inbox and her user
                folder. The newest message explains how this copy reached you.
              </p>
              <div className="briefing-actions">
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
                <button
                  className="button"
                  type="button"
                  onClick={() =>
                    openWindow({
                      id: "sarah-files",
                      appType: "explorer",
                      title: "Sarah Bishop",
                      props: { folderId: "sarah" },
                    })
                  }
                >
                  Sarah&apos;s Files
                </button>
              </div>
              <p className="briefing-footnote">
                Tip: double-click desktop icons and files. If a date looks
                wrong, write it down anyway.
              </p>
            </div>
          ),
        },
      });
    }, 650);

    return () => clearTimeout(t);
  }, [
    flags.desktop_intro_shown,
    flags.registration_shown,
    isHydrated,
    openWindow,
    setFlag,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.sarah_email_arrived || flags.sarah_email_notice_shown) return;

    const t = setTimeout(() => {
      setFlag("sarah_email_notice_shown");
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
    setFlag,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!flags.endgame_available || flags.endgame_notice_shown) return;

    const t = setTimeout(() => {
      setFlag("endgame_notice_shown");
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

  return (
    <main id="desktop-root">
      <div className="desktop-atmosphere" aria-hidden="true" />
      <div className="desktop-case-label" aria-hidden="true">
        <span>MISKATONIC DISK IMAGE</span>
        <span>READ ONLY / VOL_114</span>
      </div>
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
            title="Double-click to open"
            onClick={(ev) => handleClickIcon(ev)}
          >
            <Image src={app.icon} alt={app.label} width={46} height={46} />
            <p>{app.label}</p>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Desktop;
