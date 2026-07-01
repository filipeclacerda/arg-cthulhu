"use client";

import React, { useMemo, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { PuzzleId, PUZZLE_IDS } from "@/app/game/progress";
import "../ArgTools/style.scss";
import "./style.scss";

const PUZZLE_LABELS: Record<PuzzleId, string> = {
  lot_114: "Identify Lot 114",
  palimpsest: "Recover the verso",
  margin_cipher: "Decode the margin",
  counting_audio: "Interpret the recording",
  lineage: "Continue the lineage",
  future_log: "Reproduce the future log",
  index_name: "Join the references",
};

const NOTE_TEMPLATE = `=== ACTIVE LEADS ===
-

=== NAMES & RELATIONSHIPS ===
-

=== DATES & TIMES ===
-

=== CODES / COORDINATES ===
-

=== QUESTIONS ===
-`;

const NOTE_SECTIONS = [
  ["Lead", "=== ACTIVE LEADS ===\n- "],
  ["Name", "=== NAMES & RELATIONSHIPS ===\n- "],
  ["Date", "=== DATES & TIMES ===\n- "],
  ["Code", "=== CODES / COORDINATES ===\n- "],
  ["Question", "=== QUESTIONS ===\n- "],
] as const;

const CaseNotes = () => {
  const {
    caseNotes,
    setCaseNotes,
    saveStatus,
    discoveredEvidenceIds,
    state,
    activePuzzle,
  } = useProgress();
  const { openWindow } = useWindowManager();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"notes" | "names" | "dates" | "codes">("notes");
  const solvedCount = PUZZLE_IDS.filter(
    (id) => Boolean(state.puzzles[id].solvedAt)
  ).length;
  const visiblePuzzleIds = PUZZLE_IDS.filter(
    (id) => state.puzzles[id].availableAt !== null
  );
  const wordCount = useMemo(
    () => caseNotes.trim().split(/\s+/).filter(Boolean).length,
    [caseNotes]
  );

  const insertAtCursor = (text: string) => {
    const editor = editorRef.current;
    if (!editor) {
      setCaseNotes(`${caseNotes}${caseNotes.trim() ? "\n\n" : ""}${text}`);
      return;
    }
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const before = caseNotes.slice(0, start);
    const after = caseNotes.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n\n" : "";
    const inserted = `${prefix}${text}${suffix}`;
    setCaseNotes(`${before}${inserted}${after}`);
    requestAnimationFrame(() => {
      const caret = start + inserted.length;
      editor.focus();
      editor.setSelectionRange(caret, caret);
    });
  };

  const useTemplate = () => {
    setCaseNotes(NOTE_TEMPLATE);
    requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(23, 23);
    });
  };

  const autoEntries = {
    notes: [] as string[][],
    names: [
      ["Sarah Bishop", "Special Collections cataloguer; missing 2026-03-16."],
      ["Miriam Bishop", "First cataloguer; missing 1998-09-14."],
      ["Tom Alvarez", "Created and opened the forensic image."],
      ["Em Bishop", "Sarah's sister; preserved the last ordinary messages."],
      ["Robert Armitage", "Reviewed the 1998 accession with Miriam."],
    ],
    dates: [
      ["1998-09-03", "Miriam's final accession note."],
      ["1998-09-14", "Miriam reported missing."],
      ["2026-03-14", "counting.wav recorded."],
      ["2026-03-16", "Sarah disappears."],
      ["2026-03-23", "Tom mounts Relay 07 image."],
      ["{TOMORROW}", "Moving timestamp attached to the observer."],
    ],
    codes: [
      ["MS-WHA-1998-114/II", "Restricted shelfmark."],
      ["YHANTHLEI", "Name extracted from surname coordinates."],
      ...state.collectedReferences.map((reference) => [
        reference,
        "Recovered object reference.",
      ]),
      ["RELAY-07", "External delivery relay."],
    ],
  };

  return (
    <div className="arg-tool case-notes">
      <div className="arg-tool__menubar">
        <span>File</span><span>Edit</span><span>Organize</span><span>Help</span>
      </div>
      <div className="case-notes__toolbar">
        <button
          className="button"
          type="button"
          disabled={Boolean(caseNotes.trim())}
          onClick={useTemplate}
          title="Create a structured investigation notebook"
        >
          Investigation Template
        </button>
        <div className="case-notes__toolbar-separator" />
        <div className="case-notes__tabs">
          {(["notes", "names", "dates", "codes"] as const).map((id) => (
            <button
              key={id}
              className={`button ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {id === "notes"
                ? "My Notes"
                : id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
        <div className="case-notes__toolbar-separator" />
        <span>Add section:</span>
        {NOTE_SECTIONS.map(([label, block]) => (
          <button
            className="button"
            type="button"
            key={label}
            onClick={() => insertAtCursor(block)}
          >
            + {label}
          </button>
        ))}
        <button
          className="button case-notes__board-link"
          type="button"
          onClick={() =>
            openWindow({
              id: "evidence-board",
              appType: "evidence-board",
              title: "Evidence Board",
              maximized: true,
            })
          }
        >
          Evidence Board
        </button>
      </div>

      <div className="case-notes__workspace">
        <aside className="case-notes__guide">
          <p className="case-notes__eyebrow">INVESTIGATOR&apos;S WORKBOOK</p>
          <h2>Keep what the machine makes easy to forget.</h2>
          <p>
            Record names, dates, codes and unanswered questions. Select text
            anywhere, right-click it, then choose{" "}
            <strong>Add selection to Case Notes</strong>.
          </p>

          <div className="case-notes__progress">
            <div>
              <strong>Case progress</strong>
              <span>{solvedCount} solved</span>
            </div>
            <ol>
              {visiblePuzzleIds.map((id) => {
                const solved = Boolean(state.puzzles[id].solvedAt);
                const active = activePuzzle === id;
                return (
                  <li
                    key={id}
                    className={`${solved ? "solved" : ""} ${
                      active ? "active" : ""
                    }`}
                  >
                    <i>{solved ? "✓" : active ? ">" : "·"}</i>
                    <span>{PUZZLE_LABELS[id]}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="case-notes__retention">
            <strong>Saved with this case</strong>
            <span>Notes are included in exported Case Codes.</span>
          </div>
        </aside>

        <section className="case-notes__editor">
          <header>
            <div>
              <strong>{tab === "notes" ? "Working Notes" : `Recovered ${tab}`}</strong>
              <span>{tab === "notes" ? "Plain text · autosaved" : "Automatic index · read only"}</span>
            </div>
            <small>{tab === "notes" ? `${wordCount} words` : "from opened evidence"}</small>
          </header>
          {tab === "notes" ? (
            <textarea
              ref={editorRef}
              aria-label="Case notes"
              value={caseNotes}
              onChange={(event) => setCaseNotes(event.target.value)}
              placeholder={`Start with the investigation template, or write freely.\n\nUseful things to track:\n- people and relationships\n- dates that repeat or converge\n- filenames, aliases and coordinates\n- theories you have not proved yet`}
              spellCheck={false}
            />
          ) : (
            <div className="case-notes__auto-index">
              {autoEntries[tab].map(([label, description]) => (
                <button
                  className="button"
                  key={`${label}-${description}`}
                  onClick={() => {
                    setTab("notes");
                    requestAnimationFrame(() =>
                      insertAtCursor(`- ${label}: ${description}`)
                    );
                  }}
                >
                  <strong>{label}</strong>
                  <span>{description}</span>
                  <i>+ note</i>
                </button>
              ))}
            </div>
          )}
          <footer>
            <span>
              {tab === "notes"
                ? "Tip: right-click selected evidence to send it here."
                : "Click an indexed item to copy it into your own notes."}
            </span>
            <span>{caseNotes.length} characters</span>
          </footer>
        </section>
      </div>

      <div className="arg-tool__status">
        <span>{discoveredEvidenceIds.length} evidence objects opened</span>
        <span className={`case-notes__save case-notes__save--${saveStatus}`}>
          {saveStatus}
        </span>
      </div>
    </div>
  );
};

export default CaseNotes;
