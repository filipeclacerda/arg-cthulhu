"use client";
import React, { useState } from "react";
import Image from "next/image";
import "./style.scss";
import { folders, files, isUnlocked, VFile } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { IDENTITY_REVEAL_STAGE } from "@/app/utils/narrative";

interface ExplorerProps {
  folderId?: string;
}

const DEFAULT_FOLDER_ICON = "/icons/folder.png";
const FILE_ICON = "/icons/file.png";
const EXTENSION_ICONS: Record<string, string> = {
  txt: "/icons/notepad.png",
  hlp: "/icons/help.png",
  wav: "/icons/sound-recorder.png",
};

const extensionOf = (name: string) =>
  name.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase() ?? "";

const isDocumentScan = (file: VFile) =>
  ["tif", "tiff"].includes(extensionOf(file.name));

/**
 * Windows 98 associates familiar extensions with their programs. Unknown
 * formats such as .ENC and .TMP deliberately retain the generic file icon.
 */
const fileIconFor = (file: VFile) =>
  EXTENSION_ICONS[extensionOf(file.name)] ??
  (file.kind === "audio" ? "/icons/sound-recorder.png" : FILE_ICON);

const Explorer = ({ folderId = "my-computer" }: ExplorerProps) => {
  const {
    flags,
    corruptionStage,
    playerName,
    discoveredEvidenceIds,
    state,
  } = useProgress();
  const { openWindow } = useWindowManager();
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const solvedPuzzleIds = Object.entries(state.puzzles)
    .filter(([, progress]) => Boolean(progress.solvedAt))
    .map(([id]) => id as keyof typeof state.puzzles);
  const unlockContext = { flags, discoveredEvidenceIds, solvedPuzzleIds };

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const subfolders = folders.filter(
    (f) => f.parentId === currentFolderId && isUnlocked(f.unlock, unlockContext)
  );
  const folderFiles = files.filter(
    (f) => f.folderId === currentFolderId && isUnlocked(f.unlock, unlockContext)
  );

  // Act 3: when the rot is deep enough, the user folder takes the player's name.
  const displayName = (folder: { id: string; name: string }) => {
    if (
      folder.id === "sarah" &&
      corruptionStage >= IDENTITY_REVEAL_STAGE
    ) {
      return playerName?.trim() || "NEXT USER";
    }
    return folder.name;
  };

  const getFolderPath = () => {
    const path: string[] = [];
    let cursor = currentFolder;
    while (cursor) {
      path.unshift(displayName(cursor));
      cursor = folders.find((f) => f.id === cursor?.parentId);
    }
    return path.join(" \\ ");
  };

  const goUp = () => {
    if (currentFolder?.parentId) setCurrentFolderId(currentFolder.parentId);
  };

  const openFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    const appType =
      file.kind === "image"
        ? "image"
        : file.kind === "audio"
        ? "audio"
        : "notepad";
    openWindow({
      id: `${appType}-${fileId}`,
      appType,
      title: file.name,
      props: {
        fileId,
        windowClassName:
          corruptionStage >= 1 ? "corrupted" : undefined,
      },
    });
  };

  const openProperties = () => {
    if (!selectedFileId) return;
    const file = files.find((candidate) => candidate.id === selectedFileId);
    if (!file) return;
    openWindow({
      id: `properties-${selectedFileId}`,
      appType: "properties",
      title: `${file.name} Properties`,
      props: { fileId: selectedFileId },
    });
  };

  const itemCount = subfolders.length + folderFiles.length;

  return (
    <div className="explorer">
      <div className="explorer-menubar">
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Help</span>
      </div>
      <div className="explorer-toolbar">
        <button
          type="button"
          className="explorer-tool-button"
          disabled={!currentFolder?.parentId}
          onClick={goUp}
        >
          Up
        </button>
        <button type="button" className="explorer-tool-button" disabled>
          Search
        </button>
        <button type="button" className="explorer-tool-button" disabled>
          Folders
        </button>
        <button
          type="button"
          className="explorer-tool-button"
          disabled={!selectedFileId}
          onClick={openProperties}
        >
          Properties
        </button>
        <span className="explorer-hint">Double-click to open</span>
      </div>
      <div className="explorer-address">
        <span className="explorer-address-label">Address</span>
        <div className="explorer-address-field">
          <Image src={DEFAULT_FOLDER_ICON} alt="" width={22} height={22} />
          <span>{currentFolder ? getFolderPath() : currentFolderId}</span>
        </div>
      </div>
      <div className="explorer-view">
        <div className="explorer-grid">
          {currentFolder?.parentId && (
            <div
              className="explorer-item"
              onDoubleClick={() => setCurrentFolderId(currentFolder.parentId!)}
            >
              <Image className="explorer-icon" src={DEFAULT_FOLDER_ICON} alt="" width={44} height={44} />
              <p>..</p>
            </div>
          )}
          {subfolders.map((folder) => (
            <div
              key={folder.id}
              className="explorer-item"
              onDoubleClick={() => {
                setSelectedFileId(null);
                setCurrentFolderId(folder.id);
              }}
              title="Double-click to open"
            >
              <Image
                className="explorer-icon"
                src={folder.icon ?? DEFAULT_FOLDER_ICON}
                alt=""
                width={32}
                height={32}
              />
              <p>{displayName(folder)}</p>
            </div>
          ))}
          {folderFiles.map((file) => (
            <div
              key={file.id}
              className={`explorer-item ${
                selectedFileId === file.id ? "selected" : ""
              }`}
              onClick={() => setSelectedFileId(file.id)}
              onDoubleClick={() => openFile(file.id)}
              title="Double-click to open"
            >
              {file.kind === "image" ? (
                <span
                  className={`explorer-photo-thumbnail ${
                    isDocumentScan(file)
                      ? "explorer-photo-thumbnail--document"
                      : ""
                  }`}
                >
                  <Image
                    src={file.content}
                    alt=""
                    width={58}
                    height={44}
                  />
                </span>
              ) : (
                <Image
                  className="explorer-icon"
                  src={fileIconFor(file)}
                  alt=""
                  width={44}
                  height={44}
                />
              )}
              <p>{file.name}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="explorer-statusbar">
        <span>{itemCount} object(s)</span>
        <span>
          {selectedFileId
            ? "File selected. Properties may contain information not shown in the filename."
            : "Read-only forensic image"}
        </span>
      </div>
    </div>
  );
};

export default Explorer;
