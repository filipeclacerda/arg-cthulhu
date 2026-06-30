"use client";

import React from "react";
import { useProgress } from "@/app/context/ProgressContext";
import "../ArgTools/style.scss";

const CaseNotes = () => {
  const { caseNotes, setCaseNotes, saveStatus, discoveredEvidenceIds } =
    useProgress();
  return (
    <div className="arg-tool">
      <div className="arg-tool__menubar">
        <span>File</span><span>Edit</span><span>Search</span><span>Help</span>
      </div>
      <div className="arg-tool__content">
        <p className="arg-tool__kicker">PERSONAL CASE NOTES — STORED WITH CASE CODE</p>
        <textarea
          aria-label="Case notes"
          className="arg-tool__textarea"
          style={{ minHeight: "390px" }}
          value={caseNotes}
          onChange={(event) => setCaseNotes(event.target.value)}
          placeholder="Dates, names, coordinates, things the machine should not know…"
        />
      </div>
      <div className="arg-tool__status">
        <span>{discoveredEvidenceIds.length} evidence objects opened</span>
        <span>{saveStatus}</span>
      </div>
    </div>
  );
};

export default CaseNotes;

