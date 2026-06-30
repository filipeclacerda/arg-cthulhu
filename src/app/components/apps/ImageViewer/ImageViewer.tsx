"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { files } from "@/app/data/filesystem";
import { resolveTokens } from "@/app/utils/narrative";
import "../ArgTools/style.scss";
import "./style.scss";

const ImageViewer = ({ fileId }: { fileId: string }) => {
  const [currentFileId, setCurrentFileId] = useState(fileId);
  const file = files.find((candidate) => candidate.id === currentFileId);
  const {
    discoverEvidence,
    solvePuzzle,
    isPuzzleSolved,
    recordSequenceAction,
    collectReference,
  } = useProgress();
  const [mirrored, setMirrored] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [contrast, setContrast] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [properties, setProperties] = useState(false);

  const gallery = useMemo(
    () =>
      file
        ? files.filter(
            (candidate) =>
              candidate.kind === "image" &&
              candidate.folderId === file.folderId
          )
        : [],
    [file]
  );
  const galleryIndex = gallery.findIndex(
    (candidate) => candidate.id === currentFileId
  );
  const isPalimpsest = file?.id === "lot_114_scan";
  const recovered =
    Boolean(isPalimpsest) && mirrored && inverted && contrast >= 90;

  useEffect(() => {
    setCurrentFileId(fileId);
  }, [fileId]);

  useEffect(() => {
    if (file?.evidenceId) discoverEvidence(file.evidenceId, file.id);
  }, [discoverEvidence, file]);

  useEffect(() => {
    setMirrored(false);
    setInverted(false);
    setContrast(50);
    setZoom(100);
    setProperties(false);
  }, [currentFileId]);

  useEffect(() => {
    if (!recovered || !isPalimpsest) return;
    if (!isPuzzleSolved("palimpsest")) solvePuzzle("palimpsest");
  }, [isPalimpsest, isPuzzleSolved, recovered, solvePuzzle]);

  if (!file) return <div className="arg-tool">Image not found.</div>;

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

  return (
    <div className="arg-tool image-viewer">
      <div className="arg-tool__menubar">
        <span>File</span><span>Edit</span><span>View</span><span>Image</span><span>Help</span>
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
          <button className="button" onClick={showProperties}>Properties</button>
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
          <button className="button" onClick={showProperties}>Properties</button>
        </div>
      )}

      <div
        className={`arg-tool__content image-viewer__stage ${
          isPalimpsest ? "" : "image-viewer__stage--photo"
        }`}
      >
        <div
          className={`image-viewer__canvas ${
            isPalimpsest ? "" : "image-viewer__canvas--photo"
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
            src={file.content}
            alt={file.caption ?? file.name}
            fill
            sizes="900px"
            priority
          />
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
              <dt>Modified</dt><dd>{resolveTokens(file.modified ?? "")}</dd>
              {isPalimpsest ? (
                <>
                  <dt>Orientation</dt><dd>back-facing / tonal range rejected</dd>
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
