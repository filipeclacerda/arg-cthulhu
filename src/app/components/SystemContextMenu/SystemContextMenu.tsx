"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import "./style.scss";

interface MenuState {
  x: number;
  y: number;
  selectedText: string;
  textControl: HTMLInputElement | HTMLTextAreaElement | null;
}

const selectedTextFrom = (target: EventTarget | null): string => {
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    return target.value.slice(start, end).trim();
  }
  return window.getSelection()?.toString().trim() ?? "";
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const buffer = document.createElement("textarea");
    buffer.value = text;
    buffer.style.position = "fixed";
    buffer.style.opacity = "0";
    document.body.appendChild(buffer);
    buffer.select();
    document.execCommand("copy");
    buffer.remove();
  }
};

const SystemContextMenu = () => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();
  const selectionCache = useRef<{ text: string; root: Element } | null>(null);
  const { caseNotes, setCaseNotes } = useProgress();
  const { openWindow } = useWindowManager();

  const close = useCallback(() => setMenu(null), []);

  const showNotice = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 1600);
  };

  useEffect(() => {
    const rememberSelection = () => {
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        const text = selectedTextFrom(active);
        if (text) selectionCache.current = { text, root: active };
        return;
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";
      const anchor = selection?.anchorNode;
      const root =
        anchor instanceof Element ? anchor : anchor?.parentElement ?? null;
      if (text && root) selectionCache.current = { text, root };
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      const target = event.target;
      const textControl =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
          ? target
          : null;
      const targetElement = target instanceof Element ? target : null;
      const cached = selectionCache.current;
      let selectedText = selectedTextFrom(target);
      if (
        !selectedText &&
        cached &&
        targetElement &&
        (cached.root === targetElement ||
          cached.root.contains(targetElement) ||
          targetElement.contains(cached.root))
      ) {
        selectedText = cached.text;
      }
      const width = 244;
      const height = textControl ? 158 : 134;
      setMenu({
        x: Math.max(4, Math.min(event.clientX, window.innerWidth - width - 4)),
        y: Math.max(4, Math.min(event.clientY, window.innerHeight - height - 4)),
        selectedText,
        textControl,
      });
    };
    const handlePointerDown = (event: MouseEvent) => {
      // Preserve an input selection before the browser collapses it as part
      // of the right-button default action.
      if (event.button === 2) rememberSelection();
      if (!(event.target as HTMLElement | null)?.closest(".system-context-menu")) {
        close();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "a" &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement) &&
        target.value
      ) {
        selectionCache.current = { text: target.value, root: target };
      }
      if (event.key === "Escape") close();
    };

    document.addEventListener("selectionchange", rememberSelection);
    document.addEventListener("select", rememberSelection, true);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("selectionchange", rememberSelection);
      document.removeEventListener("select", rememberSelection, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", close);
      window.removeEventListener("scroll", close, true);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [close]);

  const copySelection = async () => {
    if (!menu?.selectedText) return;
    await copyToClipboard(menu.selectedText);
    showNotice("Selection copied");
    close();
  };

  const addToNotes = () => {
    if (!menu?.selectedText) return;
    const excerpt = menu.selectedText.replace(/\s+/g, " ").trim();
    const separator = caseNotes.trim() ? "\n" : "";
    setCaseNotes(`${caseNotes}${separator}- ${excerpt}`);
    showNotice("Added to Case Notes");
    close();
  };

  const selectAll = () => {
    if (!menu?.textControl) return;
    menu.textControl.focus();
    menu.textControl.select();
    close();
  };

  const openCaseNotes = () => {
    openWindow({
      id: "case-notes",
      appType: "case-notes",
      title: "Case Notes",
    });
    close();
  };

  return (
    <>
      {menu && (
        <div
          className="system-context-menu"
          role="menu"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!menu.selectedText}
            onClick={copySelection}
          >
            <span>Copy</span>
            <kbd>Ctrl+C</kbd>
          </button>
          {menu.textControl && (
            <button type="button" role="menuitem" onClick={selectAll}>
              <span>Select All</span>
              <kbd>Ctrl+A</kbd>
            </button>
          )}
          <div className="system-context-menu__separator" role="separator" />
          <button
            type="button"
            role="menuitem"
            disabled={!menu.selectedText}
            onClick={addToNotes}
          >
            <span>Add selection to Case Notes</span>
          </button>
          <button type="button" role="menuitem" onClick={openCaseNotes}>
            <span>Open Case Notes</span>
          </button>
        </div>
      )}
      {notice && (
        <div className="system-context-notice" role="status">
          {notice}
        </div>
      )}
    </>
  );
};

export default SystemContextMenu;
