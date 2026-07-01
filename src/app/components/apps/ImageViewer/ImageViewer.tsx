"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { files } from "@/app/data/filesystem";
import { resolveTokens } from "@/app/utils/narrative";
import "../ArgTools/style.scss";
import "./style.scss";
import { puzzleHintsFor } from "@/app/game/puzzles";
import { useI18n } from "@/app/i18n";

const ImageViewer = ({ fileId }: { fileId: string }) => {
  const [currentFileId, setCurrentFileId] = useState(fileId);
  const file = files.find((candidate) => candidate.id === currentFileId);
  const {
    discoverEvidence,
    solvePuzzle,
    isPuzzleSolved,
    state: progress,
    recordSequenceAction,
    collectReference,
    recordNearMiss,
    dispatchGameEvent,
  } = useProgress();
  const [mirrored, setMirrored] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [contrast, setContrast] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [properties, setProperties] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const partialRecorded = useRef(false);
  const { t } = useI18n();

  const gallery = useMemo(
    () =>
      file?.folderId === "pictures"
        ? files.filter(
            (candidate) =>
              candidate.kind === "image" &&
              candidate.folderId === file.folderId
          )
        : file
          ? [file]
          : [],
    [file]
  );
  const galleryIndex = gallery.findIndex(
    (candidate) => candidate.id === currentFileId
  );
  const isPalimpsest = file?.id === "lot_114_scan";
  const recovered =
    Boolean(isPalimpsest) && mirrored && inverted && contrast >= 90;
  const palimpsestSolved = Boolean(progress.puzzles.palimpsest.solvedAt);
  const correctParts = isPalimpsest
    ? [mirrored, inverted, contrast >= 90].filter(Boolean).length
    : 0;

  useEffect(() => {
    setCurrentFileId(fileId);
  }, [fileId]);

  useEffect(() => {
    if (file?.evidenceId) discoverEvidence(file.evidenceId, file.id);
    if (
      file?.id === "office_after_photo" &&
      progress.puzzles.future_log.solvedAt
    ) {
      dispatchGameEvent({
        type: "TRIGGER_WORLD_REACTION",
        reactionId: "photo_changed",
      });
      dispatchGameEvent({
        type: "SEE_ASSET_VARIANT",
        variantId: "office-after-reflection-shift",
      });
    }
  }, [
    discoverEvidence,
    dispatchGameEvent,
    file,
    progress.puzzles.future_log.solvedAt,
  ]);

  useEffect(() => {
    setMirrored(false);
    setInverted(false);
    setContrast(50);
    setZoom(100);
    setProperties(false);
    setCompareMode(false);
  }, [currentFileId]);

  useEffect(() => {
    if (!recovered || !isPalimpsest || palimpsestSolved) return;
    solvePuzzle("palimpsest");
  }, [isPalimpsest, palimpsestSolved, recovered, solvePuzzle]);

  useEffect(() => {
    if (!isPalimpsest || palimpsestSolved) return;
    if (correctParts === 2 && !partialRecorded.current) {
      partialRecorded.current = true;
      recordNearMiss("palimpsest", "palimpsest_partial");
    } else if (correctParts < 2) {
      partialRecorded.current = false;
    }
  }, [correctParts, isPalimpsest, palimpsestSolved, recordNearMiss]);

  if (!file) return <div className="arg-tool">{t("imageNotFound")}</div>;

  const mirror = () => {
    const next = !mirrored;
    setMirrored(next);
    if (next && isPalimpsest && isPuzzleSolved("lineage")) {
      recordSequenceAction("image:mirror");
    }
  };

  const showProperties = () => {
    setProperties((value) => !value);
    if (isPuzzleSolved("future_log") && file.reference) {
      collectReference(file.reference);
    }
  };

  const browse = (direction: -1 | 1) => {
    if (gallery.length < 2) return;
    const nextIndex =
      (galleryIndex + direction + gallery.length) % gallery.length;
    setCurrentFileId(gallery[nextIndex].id);
  };
  const canCompare =
    file.id === "office_after_photo" || file.id === "office_frames";
  const comparisonFile = files.find((candidate) =>
    file.id === "office_after_photo"
      ? candidate.id === "office_frames"
      : candidate.id === "office_after_photo"
  );
  const displayedSource =
    file.id === "office_after_photo" &&
    progress.assetVariantsSeen.includes("office-after-reflection-shift")
      ? "/photos/office_after_changed_2026.png"
      : file.id === "photo_bishop_birthday" &&
          progress.puzzles.lineage.solvedAt
        ? "/photos/bishop_birthday_empty_chair_2025.png"
        : file.content;

  return (
    <div className="arg-tool image-viewer">
      <div className="arg-tool__menubar">
        <span>{t("menuFile")}</span><span>{t("menuEdit")}</span><span>{t("menuView")}</span><span>{t("menuImage")}</span><span>{t("help")}</span>
      </div>

      {isPalimpsest ? (
        <div className="arg-tool__toolbar">
          <button className={`button ${mirrored ? "active" : ""}`} onClick={mirror}>Mirror</button>
          <button className={`button ${inverted ? "active" : ""}`} onClick={() => setInverted(!inverted)}>Invert</button>
          <label>Contrast</label>
          <input
            aria-label="Contrast"
            type="range"
            min="0"
            max="100"
            value={contrast}
            onChange={(event) => setContrast(Number(event.target.value))}
          />
          <button className="button" onClick={showProperties}>{t("propertiesLabel")}</button>
        </div>
      ) : (
        <div className="arg-tool__toolbar image-viewer__photo-toolbar">
          <button className="button" disabled={gallery.length < 2} onClick={() => browse(-1)}>◀ Previous</button>
          <button className="button" disabled={gallery.length < 2} onClick={() => browse(1)}>Next ▶</button>
          <span className="image-viewer__separator" />
          <button className="button" onClick={() => setZoom((value) => Math.max(50, value - 25))}>−</button>
          <span>{zoom}%</span>
          <button className="button" onClick={() => setZoom((value) => Math.min(200, value + 25))}>+</button>
          <button className="button" onClick={() => setZoom(100)}>Actual Size</button>
          {canCompare && (
            <button
              className={`button ${compareMode ? "active" : ""}`}
              onClick={() => setCompareMode((value) => !value)}
            >
              Compare frames
            </button>
          )}
          <button className="button" onClick={showProperties}>{t("propertiesLabel")}</button>
        </div>
      )}

      {isPalimpsest &&
        progress.puzzles.palimpsest.hintsUnlocked > 0 && (
          <div className="image-viewer__calibration-note">
            SCANNER CALIBRATION RECOVERED:{" "}
            {
              puzzleHintsFor(progress.locale, "palimpsest")[
                progress.puzzles.palimpsest.hintsUnlocked - 1
              ]
            }
          </div>
        )}

      {isPalimpsest && !recovered && !palimpsestSolved && correctParts === 2 && (
        <div className="arg-tool__result arg-tool__warning">
          {progress.locale === "pt-BR"
            ? "Dois ajustes já revelam alguma coisa por baixo. Um terceiro ainda resiste."
            : "Two adjustments already reveal something underneath. A third still resists."}
        </div>
      )}

      <div
        className={`arg-tool__content image-viewer__stage ${
          isPalimpsest ? "" : "image-viewer__stage--photo"
        }`}
      >
        <div
          className={`image-viewer__canvas ${
            isPalimpsest ? "" : `image-viewer__canvas--photo ${
              compareMode ? "image-viewer__canvas--compare" : ""
            }`
          }`}
          style={
            isPalimpsest
              ? {
                  transform: mirrored ? "scaleX(-1)" : undefined,
                  filter: `contrast(${0.45 + contrast / 48}) ${
                    inverted ? "invert(1)" : ""
                  }`,
                }
              : {
                  width: `${(90 * zoom) / 100}%`,
                }
          }
        >
          <Image
            src={displayedSource}
            alt={file.caption ?? file.name}
            fill
            sizes="900px"
            priority
          />
          {compareMode && comparisonFile && (
            <div className="image-viewer__comparison">
              <Image
                src={comparisonFile.content}
                alt={comparisonFile.caption ?? comparisonFile.name}
                fill
                sizes="450px"
              />
              <span>{comparisonFile.name}</span>
            </div>
          )}
          {recovered && (
            <div className="image-viewer__reveal">
              <strong>BELLASO</strong>
              <span>the key belongs to her first cataloguer</span>
            </div>
          )}
        </div>

        {!isPalimpsest && (
          <div className="image-viewer__caption">
            <strong>{file.name}</strong>
            <span>{file.caption}</span>
          </div>
        )}

        {properties && (
          <div className="image-viewer__properties">
            <h3>{file.name} Properties</h3>
            <dl className="arg-tool__properties">
              <dt>DOS alias</dt><dd>{file.alias}</dd>
              <dt>Size</dt><dd>{file.size}</dd>
              <dt>Modified</dt>
              <dd>
                {recovered
                  ? resolveTokens("{TOMORROW} 03:12")
                  : resolveTokens(file.modified ?? "")}
              </dd>
              {isPalimpsest ? (
                <>
                  <dt>Orientation</dt><dd>back-facing / tonal range rejected</dd>
                  <dt>Accession</dt><dd>MS-WHA-1998-114/II</dd>
                </>
              ) : (
                <>
                  <dt>Taken</dt><dd>{file.taken}</dd>
                  <dt>Dimensions</dt><dd>{file.dimensions}</dd>
                  <dt>Camera</dt><dd>{file.camera}</dd>
                  <dt>Location</dt><dd>{file.location}</dd>
                  <dt>Comment</dt><dd>{file.comment}</dd>
                </>
              )}
            </dl>
            {isPuzzleSolved("future_log") && file.reference && (
              <div className="arg-tool__reference">OBJECT REF: {file.reference}</div>
            )}
          </div>
        )}
      </div>

      <div className="arg-tool__status">
        {isPalimpsest ? (
          <>
            <span>{mirrored ? "mirrored" : "original"} / {inverted ? "negative" : "positive"}</span>
            <span>contrast {contrast}%</span>
          </>
        ) : (
          <>
            <span>{galleryIndex + 1} of {gallery.length} — {file.dimensions}</span>
            <span>{file.taken}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;
