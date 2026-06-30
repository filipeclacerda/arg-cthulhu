"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { files } from "@/app/data/filesystem";
import "../ArgTools/style.scss";
import "./style.scss";

const ImageViewer = ({ fileId }: { fileId: string }) => {
  const file = files.find((candidate) => candidate.id === fileId);
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
  const [properties, setProperties] = useState(false);
  const recovered = mirrored && inverted && contrast >= 90;

  useEffect(() => {
    if (file?.evidenceId) discoverEvidence(file.evidenceId, file.id);
  }, [discoverEvidence, file]);

  useEffect(() => {
    if (!recovered) return;
    if (!isPuzzleSolved("palimpsest")) solvePuzzle("palimpsest");
  }, [isPuzzleSolved, recovered, solvePuzzle]);

  if (!file) return <div className="arg-tool">Image not found.</div>;

  const mirror = () => {
    const next = !mirrored;
    setMirrored(next);
    if (next && isPuzzleSolved("lineage")) {
      recordSequenceAction("image:mirror");
    }
  };

  const showProperties = () => {
    setProperties((value) => !value);
    if (isPuzzleSolved("future_log") && file.reference) {
      collectReference(file.reference);
    }
  };

  return (
    <div className="arg-tool image-viewer">
      <div className="arg-tool__menubar">
        <span>File</span><span>Edit</span><span>Image</span><span>Help</span>
      </div>
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
      <div className="arg-tool__content image-viewer__stage">
        <div
          className="image-viewer__canvas"
          style={{
            transform: mirrored ? "scaleX(-1)" : undefined,
            filter: `contrast(${0.45 + contrast / 48}) ${inverted ? "invert(1)" : ""}`,
          }}
        >
          <Image src={file.content} alt="Scanned verso of manuscript page" fill sizes="700px" />
          {recovered && (
            <div className="image-viewer__reveal">
              <strong>BELLASO</strong>
              <span>the key belongs to her first cataloguer</span>
            </div>
          )}
        </div>
        {properties && (
          <div className="image-viewer__properties">
            <h3>{file.name} Properties</h3>
            <dl className="arg-tool__properties">
              <dt>DOS alias</dt><dd>{file.alias}</dd>
              <dt>Size</dt><dd>{file.size}</dd>
              <dt>Modified</dt><dd>{file.modified}</dd>
              <dt>Orientation</dt><dd>back-facing / tonal range rejected</dd>
            </dl>
            {isPuzzleSolved("future_log") && (
              <div className="arg-tool__reference">OBJECT REF: {file.reference}</div>
            )}
          </div>
        )}
      </div>
      <div className="arg-tool__status">
        <span>{mirrored ? "mirrored" : "original"} / {inverted ? "negative" : "positive"}</span>
        <span>contrast {contrast}%</span>
      </div>
    </div>
  );
};

export default ImageViewer;

