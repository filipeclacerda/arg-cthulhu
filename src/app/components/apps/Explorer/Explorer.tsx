"use client";
import React, { useState } from "react";
import Image from "next/image";
import "./style.scss";
import { folders, files, isUnlocked } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";

interface ExplorerProps {
  folderId?: string;
}

const DEFAULT_FOLDER_ICON = "/icons/folder.png";
const FILE_ICON = "/icons/file.png";

const Explorer = ({ folderId = "my-computer" }: ExplorerProps) => {
  const { flags } = useProgress();
  const { openWindow } = useWindowManager();
  const [currentFolderId, setCurrentFolderId] = useState(folderId);

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const subfolders = folders.filter(
    (f) => f.parentId === currentFolderId && isUnlocked(f.unlock, flags)
  );
  const folderFiles = files.filter(
    (f) => f.folderId === currentFolderId && isUnlocked(f.unlock, flags)
  );

  const openFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    openWindow({
      id: `notepad-${fileId}`,
      appType: "notepad",
      title: file.name,
      props: {
        fileId,
        windowClassName: file.triggersCorruption ? "corrupted" : undefined,
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
      <div className="explorer-address">
        <span className="explorer-address-label">Address</span>
        <div className="explorer-address-field">
          <Image src={DEFAULT_FOLDER_ICON} alt="" width={22} height={22} />
          <span>{currentFolder?.name ?? currentFolderId}</span>
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
              onDoubleClick={() => setCurrentFolderId(folder.id)}
            >
              <Image
                className="explorer-icon"
                src={folder.icon ?? DEFAULT_FOLDER_ICON}
                alt=""
                width={32}
                height={32}
              />
              <p>{folder.name}</p>
            </div>
          ))}
          {folderFiles.map((file) => (
            <div
              key={file.id}
              className="explorer-item"
              onDoubleClick={() => openFile(file.id)}
            >
              <Image className="explorer-icon" src={FILE_ICON} alt="" width={44} height={44} />
              <p>{file.name}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="explorer-statusbar">
        <span>{itemCount} object(s)</span>
      </div>
    </div>
  );
};

export default Explorer;
