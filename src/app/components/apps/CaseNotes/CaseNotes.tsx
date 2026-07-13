"use client";

import React, { useMemo, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { PuzzleId, PUZZLE_IDS } from "@/app/game/progress";
import { localized, TOKENS_BY_ID } from "@/app/game/campaign";
import { useI18n } from "@/app/i18n";
import {
  activitySeenFlag,
  recentActivities,
  unseenRecentActivities,
  type RecentActivity,
} from "@/app/game/recentActivity";
import { activityDigestFlag } from "@/app/game/programAttention";
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
    setFlag,
  } = useProgress();
  const { openWindow } = useWindowManager();
  const { locale, t } = useI18n();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<
    "notes" | "activity" | "facts" | "names" | "dates" | "codes"
  >("notes");
  const activity = recentActivities(state).slice().reverse().slice(0, 8);
  const unseenActivity = unseenRecentActivities(state);
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
    activity: [] as string[][],
    facts: state.collectedTokens
      .map((id) => TOKENS_BY_ID[id])
      .filter(Boolean)
      .map((token) => [
        localized(token.label, state.locale),
        `Extracted ${token.type} fact.`,
      ]),
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

  const openActivity = (entry: RecentActivity) => {
    setFlag(activitySeenFlag(entry.id));
    if (entry.artifactId) {
      const audio = entry.artifactId === "counting_audio" || entry.artifactId === "voicemail_to_em";
      openWindow({
        id: `recent-${entry.artifactId}`,
        appType: audio ? "audio" : "notepad",
        title: entry.artifactId,
        props: { fileId: entry.artifactId },
      });
      return;
    }
    const appType = entry.id === "endgame" ? "finale" : entry.program;
    openWindow({
      id: `recent-${entry.id}`,
      appType,
      title: entry.title[state.locale === "pt-BR" ? "pt" : "en"],
    });
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
          {(["notes", "activity", "facts", "names", "dates", "codes"] as const).map((id) => (
            <button
              key={id}
              className={`button ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {id === "notes"
                ? "My Notes"
                : id === "activity"
                  ? state.locale === "pt-BR" ? "Recentes" : "Recent"
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
              id: "casefile",
              appType: "casefile",
              title: t("casefileLabel"),
              props: { initialLens: "deductions" },
              maximized: true,
            })
          }
        >
          {t("casefileLabel")}
        </button>
      </div>

      <div className="case-notes__workspace">
        <aside className="case-notes__guide">
          <p className="case-notes__eyebrow">INVESTIGATOR&apos;S WORKBOOK</p>
          <h2>{locale === "pt-BR" ? "Guarde o que a máquina torna fácil esquecer." : "Keep what the machine makes easy to forget."}</h2>
          <p>
            {locale === "pt-BR" ? "Registre nomes, datas, códigos e perguntas sem resposta. Selecione um texto, clique com o botão direito e escolha " : "Record names, dates, codes and unanswered questions. Select text anywhere, right-click it, then choose "}
            <strong>{locale === "pt-BR" ? "Adicionar seleção às Notas do caso" : "Add selection to Case Notes"}</strong>.
          </p>

          <div className="case-notes__progress">
            <div>
              <strong>{locale === "pt-BR" ? "Progresso do caso" : "Case progress"}</strong>
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
          <button
            className="button case-notes__digest"
            type="button"
            disabled={unseenActivity.length === 0}
            onClick={() => {
              setTab("activity");
              setFlag(activityDigestFlag(state));
            }}
          >
            {state.locale === "pt-BR"
              ? `O que mudou? (${unseenActivity.length})`
              : `What changed? (${unseenActivity.length})`}
          </button>
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
          ) : tab === "activity" ? (
            <div className="case-notes__activity" aria-live="polite">
              {activity.length === 0 ? (
                <p>{state.locale === "pt-BR" ? "Nenhuma alteração registrada." : "No changes recorded."}</p>
              ) : activity.map((entry) => {
                const key = state.locale === "pt-BR" ? "pt" : "en";
                const seen = Boolean(state.flags[activitySeenFlag(entry.id)]);
                return (
                  <button
                    className={`button case-notes__activity-entry case-notes__activity-entry--${entry.priority} ${seen ? "seen" : "new"}`}
                    key={entry.id}
                    onClick={() => openActivity(entry)}
                  >
                    <i>{seen ? "·" : "*"}</i>
                    <span><strong>{entry.title[key]}</strong><small>{entry.summary[key]}</small></span>
                    <b>{state.locale === "pt-BR" ? "ABRIR" : "OPEN"}</b>
                  </button>
                );
              })}
            </div>
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
