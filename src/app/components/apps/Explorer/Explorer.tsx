"use client";
import React, { useState } from "react";
import Image from "next/image";
import "./style.scss";
import { folders, files, VFile } from "@/app/data/filesystem";
import { isUnlocked } from "@/app/game/unlock";
import {
  ProjectedFile,
  projectFilesystem,
  suppressedFiles,
} from "@/app/game/desktopManifestations";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { IDENTITY_REVEAL_STAGE } from "@/app/utils/narrative";
import { TranslationKey, useI18n } from "@/app/i18n";
import { ChapterId } from "@/app/game/progress";
import { useNameDegradation } from "@/app/hooks/useNameDegradation";
import { shouldActivateDesktopItem } from "@/app/game/comfort";

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
const CHAPTER_TITLE_KEYS: Record<ChapterId, TranslationKey> = {
  chapter_1: "chapter1Title",
  chapter_2: "chapter2Title",
  chapter_3: "chapter3Title",
  chapter_4: "chapter4Title",
  chapter_5: "chapter5Title",
  chapter_6: "chapter6Title",
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
    currentChapter,
    dispatchGameEvent,
  } = useProgress();
  const { openWindow } = useWindowManager();
  const { t } = useI18n();
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  // Stage 3 only: at IDENTITY_REVEAL_STAGE the folder is already renamed to
  // the player, and RESTORE already put "Sarah Bishop" back — degrading the
  // name in either of those states would fight the manifestation it's part of.
  const sarahNameDegrading =
    corruptionStage >= 3 &&
    corruptionStage < IDENTITY_REVEAL_STAGE &&
    !flags.ending_restore;
  const degradedSarahName = useNameDegradation(
    "Sarah Bishop",
    sarahNameDegrading,
    () => dispatchGameEvent({ type: "TRIGGER_WORLD_REACTION", reactionId: "name_degraded" })
  );

  const solvedPuzzleIds = Object.entries(state.puzzles)
    .filter(([, progress]) => Boolean(progress.solvedAt))
    .map(([id]) => id as keyof typeof state.puzzles);
  const unlockContext = {
    flags,
    discoveredEvidenceIds,
    solvedPuzzleIds,
    insightsUnlocked: state.insightsUnlocked,
  };

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const subfolders = folders.filter(
    (f) => f.parentId === currentFolderId && isUnlocked(f.unlock, unlockContext)
  );
  // "The computer remembers": files the machine has moved out of this folder
  // are hidden here (they surface as a projection in their new location).
  const suppressions = suppressedFiles(state);
  const isSuppressedHere = (fileId: string) =>
    suppressions.some(
      (s) => s.sourceFileId === fileId && s.folderId === currentFolderId
    );
  const folderFiles = files.filter(
    (f) =>
      f.folderId === currentFolderId &&
      isUnlocked(f.unlock, unlockContext) &&
      !isSuppressedHere(f.id)
  );
  // Projected duplicates/moves the archive has filed into this folder. Each
  // opens its canonical source file — a projection never mints new evidence.
  const projectedFiles = projectFilesystem(state).filter(
    (projection) => projection.folderId === currentFolderId
  );
  const sourceFileOf = (projection: ProjectedFile) =>
    files.find((f) => f.id === projection.sourceFileId);

  // Act 3: when the rot is deep enough, the user folder takes the player's name.
  const displayName = (folder: { id: string; name: string }) => {
    if (folder.id === "observer-cache") {
      return playerName?.trim() || "NEXT USER";
    }
    // RESTORE is only meaningful if the desktop itself accepts Sarah's account
    // again after the terminal reboots.
    if (folder.id === "sarah" && flags.ending_restore) {
      return "Sarah Bishop";
    }
    if (
      folder.id === "sarah" &&
      corruptionStage >= IDENTITY_REVEAL_STAGE
    ) {
      return playerName?.trim() || "NEXT USER";
    }
    if (folder.id === "sarah" && sarahNameDegrading) {
      return degradedSarahName;
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

  const itemCount = subfolders.length + folderFiles.length + projectedFiles.length;
  const activateWithKeyboard = (event: React.KeyboardEvent, action: () => void) => {
    if (!shouldActivateDesktopItem(event.key)) return;
    event.preventDefault();
    action();
  };

  return (
    <div className="explorer">
      <div className="explorer-menubar">
        <span>{t("menuFile")}</span>
        <span>{t("menuEdit")}</span>
        <span>{t("menuView")}</span>
        <span>{t("help")}</span>
      </div>
      <div className="explorer-toolbar">
        <button
          type="button"
          className="explorer-tool-button"
          disabled={!currentFolder?.parentId}
          onClick={goUp}
        >
          {t("upLabel")}
        </button>
        <button type="button" className="explorer-tool-button" disabled>
          {t("menuSearch")}
        </button>
        <button type="button" className="explorer-tool-button" disabled>
          {t("foldersLabel")}
        </button>
        <button
          type="button"
          className="explorer-tool-button"
          disabled={!selectedFileId}
          onClick={openProperties}
        >
          {t("propertiesLabel")}
        </button>
        <span className="explorer-hint">{t("doubleClickToOpen")}</span>
        <span className="explorer-chapter">
          {t("chapterLabel")} {currentChapter.replace("chapter_", "")}:{" "}
          {t(CHAPTER_TITLE_KEYS[currentChapter])}
        </span>
      </div>
      <div className="explorer-address">
        <span className="explorer-address-label">{t("addressLabel")}</span>
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
              role="button"
              tabIndex={0}
              aria-label={t("upLabel")}
              onDoubleClick={() => setCurrentFolderId(currentFolder.parentId!)}
              onKeyDown={(event) => activateWithKeyboard(event, () => setCurrentFolderId(currentFolder.parentId!))}
            >
              <Image className="explorer-icon" src={DEFAULT_FOLDER_ICON} alt="" width={44} height={44} />
              <p>..</p>
            </div>
          )}
          {subfolders.map((folder) => (
            <div
              key={folder.id}
              className="explorer-item"
              role="button"
              tabIndex={0}
              aria-label={displayName(folder)}
              onDoubleClick={() => {
                setSelectedFileId(null);
                setCurrentFolderId(folder.id);
              }}
              onKeyDown={(event) => activateWithKeyboard(event, () => {
                setSelectedFileId(null);
                setCurrentFolderId(folder.id);
              })}
              title={t("doubleClickToOpen")}
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
              role="button"
              tabIndex={0}
              aria-label={file.name}
              onKeyDown={(event) => activateWithKeyboard(event, () => openFile(file.id))}
              title={t("doubleClickToOpen")}
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
          {projectedFiles.map((projection) => {
            const source = sourceFileOf(projection);
            return (
              <div
                key={projection.instanceId}
                className="explorer-item"
                onDoubleClick={() => openFile(projection.sourceFileId)}
                role="button"
                tabIndex={0}
                aria-label={projection.displayName}
                onKeyDown={(event) => activateWithKeyboard(event, () => openFile(projection.sourceFileId))}
                title={t("doubleClickToOpen")}
              >
                {source?.kind === "image" ? (
                  <span className="explorer-photo-thumbnail">
                    <Image src={source.content} alt="" width={58} height={44} />
                  </span>
                ) : (
                  <Image
                    className="explorer-icon"
                    src={
                      source
                        ? fileIconFor(source)
                        : FILE_ICON
                    }
                    alt=""
                    width={44}
                    height={44}
                  />
                )}
                <p>{projection.displayName}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="explorer-statusbar">
        <span>{itemCount} {t("objectsSuffix")}</span>
        <span>
          {selectedFileId
            ? t("fileSelectedHint")
            : t("readOnlyForensicImage")}
        </span>
      </div>
    </div>
  );
};

export default Explorer;
