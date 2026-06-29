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

const renderAppContent = (win: WindowInstance) => {
  switch (win.appType) {
    case "explorer":
      return <Explorer folderId={win.props.folderId} />;
    case "notepad":
      return <Notepad fileId={win.props.fileId} />;
    case "email":
      return <Email />;
    case "generic":
      return win.props.children ?? null;
    default:
      return null;
  }
};

const WindowFrame = ({ win }: { win: WindowInstance }) => {
  const { closeWindow, focusWindow, moveWindow } = useWindowManager();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
    focusWindow(win.id);
    const target = ev.target as HTMLElement;
    if (!target.closest(".title") || !containerRef.current) return;

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

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: win.position.x,
        top: win.position.y,
        zIndex: win.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      <WindowComponent
        title={win.title}
        onClose={() => closeWindow(win.id)}
        className={win.props.windowClassName}
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
