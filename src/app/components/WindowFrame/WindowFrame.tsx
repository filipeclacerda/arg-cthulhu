"use client";
import React, { useRef } from "react";
import WindowComponent from "../WindowComponent/WindowComponent";
import {
  useWindowManager,
  WindowInstance,
} from "../../context/WindowManagerContext";
import Explorer from "../apps/Explorer/Explorer";
import Notepad from "../apps/Notepad/Notepad";
import Email from "../apps/Email/Email";
import Registration from "../apps/Registration/Registration";
import Finale from "../apps/Finale/Finale";
import RecoveredBrowser from "../apps/RecoveredBrowser/RecoveredBrowser";
import ImageViewer from "../apps/ImageViewer/ImageViewer";
import MediaPlayer from "../apps/MediaPlayer/MediaPlayer";
import CipherLab from "../apps/CipherLab/CipherLab";
import CaseNotes from "../apps/CaseNotes/CaseNotes";
import FileProperties from "../apps/FileProperties/FileProperties";
import HelpCenter from "../apps/HelpCenter/HelpCenter";
import {
  Calculator,
  Paint,
  RecycleBin,
  SystemProperties,
} from "../apps/RetroPrograms/RetroPrograms";

const renderAppContent = (win: WindowInstance) => {
  switch (win.appType) {
    case "explorer":
      return <Explorer folderId={win.props.folderId} />;
    case "notepad":
      return <Notepad fileId={win.props.fileId} />;
    case "email":
      return <Email />;
    case "registration":
      return <Registration />;
    case "finale":
      return <Finale />;
    case "browser":
      return <RecoveredBrowser initialAddress={win.props.initialAddress} />;
    case "image":
      return <ImageViewer fileId={win.props.fileId} />;
    case "audio":
      return <MediaPlayer fileId={win.props.fileId} />;
    case "cipher-lab":
      return <CipherLab />;
    case "case-notes":
      return <CaseNotes />;
    case "properties":
      return <FileProperties fileId={win.props.fileId} />;
    case "help":
      return <HelpCenter />;
    case "calculator":
      return <Calculator />;
    case "paint":
      return <Paint />;
    case "system-properties":
      return <SystemProperties />;
    case "recycle-bin":
      return <RecycleBin />;
    case "generic":
      return win.props.children ?? null;
    default:
      return null;
  }
};

const WindowFrame = ({ win }: { win: WindowInstance }) => {
  const {
    closeWindow,
    focusWindow,
    moveWindow,
    toggleMinimize,
    toggleMaximize,
  } = useWindowManager();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
    focusWindow(win.id);
    const target = ev.target as HTMLElement;
    if (
      win.maximized ||
      target.closest(".windowButtons") ||
      !target.closest(".title") ||
      !containerRef.current
    ) return;

    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragOffset.current || !containerRef.current) return;
      containerRef.current.style.left = `${e.clientX - dragOffset.current.x}px`;
      containerRef.current.style.top = `${e.clientY - dragOffset.current.y}px`;
    };

    const handleMouseUp = () => {
      if (containerRef.current) {
        moveWindow(
          win.id,
          parseInt(containerRef.current.style.left, 10),
          parseInt(containerRef.current.style.top, 10)
        );
      }
      dragOffset.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (win.minimized) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: win.maximized ? 0 : win.position.x,
        top: win.maximized ? 0 : win.position.y,
        zIndex: win.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      <WindowComponent
        title={win.title}
        onClose={() => closeWindow(win.id)}
        onMinimize={() => toggleMinimize(win.id)}
        onMaximize={() => toggleMaximize(win.id)}
        className={`${win.props.windowClassName ?? ""} ${
          win.maximized ? "maximized" : ""
        }`.trim()}
      >
        {renderAppContent(win)}
      </WindowComponent>
    </div>
  );
};

export const WindowLayer = () => {
  const { windows } = useWindowManager();
  return (
    <>
      {windows.map((win) => (
        <WindowFrame key={win.id} win={win} />
      ))}
    </>
  );
};

export default WindowFrame;
