"use client";

import React, { useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { useI18n } from "@/app/i18n";
import "../ArgTools/style.scss";
import "./style.scss";

const ROWS = [
  {
    offset: "0000:07A0",
    name: "EXPEDI~1.TMP",
    status: "DELETED",
    fileId: "expedition_tmp",
    evidence: "deleted_expedition_fragment",
    gate: "always",
  },
  {
    offset: "0014:0000",
    name: "2014RE~1.DAT",
    status: "ORPHAN",
    fileId: "record_2014",
    evidence: "record_2014",
    gate: "future",
  },
  {
    offset: "0316:0007",
    name: "LOOPBA~1.TXT",
    status: "DOWNLOAD",
    fileId: "containment_utility",
    evidence: "containment_utility",
    gate: "future",
  },
];

const ArchiveViewer = () => {
  const { state, discoverEvidence } = useProgress();
  const { openWindow } = useWindowManager();
  const { locale } = useI18n();
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState<"table" | "hex">("table");
  const visibleRows = ROWS.filter(
    (row) => row.gate === "always" || state.puzzles.future_log.solvedAt
  );
  const row = visibleRows[Math.min(selected, visibleRows.length - 1)];

  const open = () => {
    discoverEvidence(row.evidence, row.fileId);
    openWindow({
      id: `archive-${row.fileId}`,
      appType: "notepad",
      title: `${row.name} - Recovered`,
      props: { fileId: row.fileId },
    });
  };

  return (
    <div className="arg-tool archive-viewer">
      <div className="arg-tool__menubar">
        <span>File</span><span>Disk</span><span>Search</span><span>Tools</span><span>Help</span>
      </div>
      <div className="arg-tool__toolbar">
        <button className={`button ${view === "table" ? "active" : ""}`} onClick={() => setView("table")}>Directory</button>
        <button className={`button ${view === "hex" ? "active" : ""}`} onClick={() => setView("hex")}>Hex</button>
        <button className="button" onClick={open}>Recover</button>
        <span>VOL_114 / FAT32 / READ ONLY</span>
      </div>
      {view === "table" ? (
        <div className="archive-viewer__table">
          <div className="archive-viewer__head"><span>Offset</span><span>DOS name</span><span>State</span><span>Reader</span></div>
          {visibleRows.map((candidate, index) => (
            <button
              key={candidate.name}
              className={selected === index ? "selected" : ""}
              onClick={() => setSelected(index)}
              onDoubleClick={open}
            >
              <span>{candidate.offset}</span>
              <strong>{candidate.name}</strong>
              <span>{candidate.status}</span>
              <span>{candidate.gate === "future" ? state.playerName || "NEXT USER" : "UNKNOWN"}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="archive-viewer__hex">
          <aside>
            {Array.from({ length: 13 }, (_, index) => (
              <span key={index}>{(index * 16).toString(16).padStart(8, "0")}</span>
            ))}
          </aside>
          <pre>{`52 45 43 4F 56 45 52 59 20 49 4E 44 45 58 00 07
53 4F 55 52 43 45 3D 3F 00 4F 57 4E 45 52 3D 3F
57 49 54 4E 45 53 53 3D 41 52 43 48 49 56 45 00
32 30 31 34 00 52 45 43 4F 52 44 5F 53 45 4C 46
00 00 FF 07 52 45 4C 41 59 2D 30 37 00 00 00 00
4E 45 58 54 5F 52 45 41 44 3D 54 4F 4D 4F 52 52
4F 57 00 ${state.puzzles.future_log.solvedAt ? "57 49 54 4E 45 53 53" : "?? ?? ?? ?? ?? ?? ??"}

${locale === "pt-BR" ? "; a sequência ASCII repete o próprio endereço" : "; the ASCII sequence repeats its own address"}`}</pre>
          <div className="archive-viewer__ascii">
            RECOVERY INDEX<br />
            SOURCE=?<br />
            OWNER=?<br />
            WITNESS=ARCHIVE<br />
            2014<br />
            RECORD_SELF<br />
            RELAY-07<br />
            NEXT_READ=TOMORROW
          </div>
        </div>
      )}
      <div className="archive-viewer__detail">
        <strong>{row.name}</strong>
        <span>
          {locale === "pt-BR"
            ? "O cabeçalho sobreviveu sem caminho original. A tabela de arquivos aponta para si mesma."
            : "The header survived without an original path. Its file table points back to itself."}
        </span>
      </div>
      <div className="arg-tool__status">
        <span>{visibleRows.length} recoverable entries</span>
        <span>CRC warnings ignored</span>
      </div>
    </div>
  );
};

export default ArchiveViewer;
