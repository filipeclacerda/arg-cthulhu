"use client";

import React, { useEffect } from "react";
import { files } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";
import { resolveTokens } from "@/app/utils/narrative";
import "../ArgTools/style.scss";

const FileProperties = ({ fileId }: { fileId: string }) => {
  const file = files.find((candidate) => candidate.id === fileId);
  const { isPuzzleSolved, collectReference } = useProgress();
  const referenceVisible = isPuzzleSolved("future_log") && Boolean(file?.reference);

  useEffect(() => {
    if (referenceVisible && file?.reference) collectReference(file.reference);
  }, [collectReference, file, referenceVisible]);

  if (!file) return <div className="arg-tool">Object not found.</div>;

  return (
    <div className="arg-tool" style={{ width: 420, height: 390 }}>
      <div className="arg-tool__content">
        <h2>{file.name}</h2>
        <dl className="arg-tool__properties">
          <dt>Type</dt><dd>{file.kind}</dd>
          <dt>DOS alias</dt><dd>{file.alias ?? file.name.toUpperCase()}</dd>
          <dt>Size</dt><dd>{file.size ?? `${Math.max(1, file.content.length / 1024).toFixed(1)} KB`}</dd>
          <dt>Modified</dt><dd>{resolveTokens(file.modified ?? "2026-03-16 03:14")}</dd>
          <dt>Evidence ID</dt><dd>{file.evidenceId ?? "none"}</dd>
        </dl>
        {referenceVisible && (
          <div className="arg-tool__reference">OBJECT REF: {file.reference}</div>
        )}
      </div>
      <div className="arg-tool__status"><span>Read-only</span><span>Archive properties</span></div>
    </div>
  );
};

export default FileProperties;

