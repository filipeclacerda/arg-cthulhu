"use client";
import React, { useState } from "react";
import Image from "next/image";
import "./style.scss";
import { folders, files, isUnlocked } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { IDENTITY_REVEAL_STAGE } from "@/app/utils/narrative";

interface ExplorerProps {
  folderId?: string;
}

const DEFAULT_FOLDER_ICON = "/icons/folder.png";
const FILE_ICON = "/icons/file.png";

const Explorer = ({ folderId = "my-computer" }: ExplorerProps) => {
  const { flags, corruptionStage, playerName } = useProgress();
  const { openWindow } = useWindowManager();
  const [currentFolderId, setCurrentFolderId] = useState(folderId);

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const subfolders = folders.filter(
    (f) => f.parentId === currentFolderId && isUnlocked(f.unlock, flags)
  );
  const folderFiles = files.filter(
    (f) => f.folderId === currentFolderId && isUnlocked(f.unlock, flags)
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
    openWindow({
      id: `notepad-${fileId}`,
      appType: "notepad",
      title: file.name,
      props: {
        fileId,
        // Stage 1+: every window in a corrupted session gets the glitch class.
        windowClassName:
          file.raisesCorruptionTo != null || corruptionStage >= 1
            ? "corrupted"
            : undefined,
      },
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
              className={`explorer-item ${
                folder.icon?.includes("special") ? "explorer-item--special" : ""
              }`}
              onDoubleClick={() => setCurrentFolderId(folder.id)}
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
                file.raisesCorruptionTo != null ? "explorer-item--unstable" : ""
              }`}
              onDoubleClick={() => openFile(file.id)}
              title="Double-click to open"
            >
              <Image className="explorer-icon" src={FILE_ICON} alt="" width={44} height={44} />
              <p>{file.name}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="explorer-statusbar">
        <span>{itemCount} object(s)</span>
        <span>
          {currentFolder?.id === "sarah"
            ? "Start with diary.txt, field_notes.txt, and what_i_found.txt."
            : "Items may unlock after decoded files are submitted."}
        </span>
      </div>
    </div>
  );
};

export default Explorer;
