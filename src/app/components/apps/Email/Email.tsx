"use client";
import React, { useEffect, useState } from "react";
import "./style.scss";
import { emails } from "@/app/data/emails";
import { isUnlocked } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";
import { resolveTokens } from "@/app/utils/narrative";

const Email = () => {
  const {
    markEmailRead,
    readEmailIds,
    flags,
    playerName,
    absenceMs,
    discoveredEvidenceIds,
    state,
    discoverEvidence,
    isPuzzleSolved,
    collectReference,
  } = useProgress();

  const solvedPuzzleIds = Object.entries(state.puzzles)
    .filter(([, progress]) => Boolean(progress.solvedAt))
    .map(([id]) => id as keyof typeof state.puzzles);
  const visibleEmails = emails.filter((e) =>
    isUnlocked(e.unlock, { flags, discoveredEvidenceIds, solvedPuzzleIds })
  );
  const visibleEmailIds = visibleEmails.map((email) => email.id).join("|");

  const [selectedId, setSelectedId] = useState<string | null>(
    visibleEmails[0]?.id ?? null
  );

  // Re-select the first visible email whenever the list grows (e.g. after a
  // flag fires mid-session and Sarah's live email appears).
  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && visibleEmails.some((e) => e.id === prev)) return prev;
      return visibleEmails[0]?.id ?? null;
    });
  }, [visibleEmailIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = visibleEmails.find((e) => e.id === selectedId);

  useEffect(() => {
    if (selectedId) {
      markEmailRead(selectedId);
      const email = visibleEmails.find((candidate) => candidate.id === selectedId);
      if (email?.evidenceId) discoverEvidence(email.evidenceId, email.id);
      if (email?.reference && isPuzzleSolved("future_log")) {
        collectReference(email.reference);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const ctx = {
    playerName,
    absenceHours: absenceMs > 0 ? absenceMs / (1000 * 60 * 60) : undefined,
  };
  const unreadCount = visibleEmails.filter(
    (email) => !readEmailIds.includes(email.id)
  ).length;

  return (
    <div className="email">
      <div className="email-menubar">
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Tools</span>
        <span>Help</span>
      </div>
      <div className="email-toolbar">
        <button className="email-toolbar-button">New</button>
        <button className="email-toolbar-button">Reply</button>
        <button className="email-toolbar-button">Forward</button>
        <button className="email-toolbar-button">Delete</button>
        <span className="email-toolbar-status">
          {unreadCount} unread / {visibleEmails.length} total
        </span>
      </div>
      <div className="email-panes">
        <div className="email-list">
          {visibleEmails.length === 0 && (
            <div className="email-empty">No messages recovered.</div>
          )}
          {visibleEmails.map((email) => (
            <div
              key={email.id}
              className={`email-list-item ${
                email.id === selectedId ? "selected" : ""
              } ${readEmailIds.includes(email.id) ? "read" : "unread"}`}
              onClick={() => setSelectedId(email.id)}
            >
              <div className="email-list-row">
                <p className="email-sender">{email.sender}</p>
                {!readEmailIds.includes(email.id) && (
                  <span className="email-new-badge">NEW</span>
                )}
              </div>
              <p className="email-subject">{email.subject}</p>
              <p className="email-date">{resolveTokens(email.date, ctx)}</p>
            </div>
          ))}
        </div>
        <div className="email-detail">
          {selected ? (
            <>
              <div className="email-detail-header">
                <p>
                  <strong>From:</strong> {selected.sender}
                </p>
                <p>
                  <strong>Date:</strong> {resolveTokens(selected.date, ctx)}
                </p>
                <p>
                  <strong>Subject:</strong> {selected.subject}
                </p>
                {selected.messageId && isPuzzleSolved("future_log") && (
                  <p className="email-message-id">
                    <strong>Message-ID:</strong> {selected.messageId}
                  </p>
                )}
              </div>
              <pre className="email-body">
                {resolveTokens(selected.body, ctx)}
              </pre>
            </>
          ) : (
            <p className="email-empty-detail">
              Select a recovered message from the list.
            </p>
          )}
        </div>
      </div>
      <div className="email-statusbar">
        <span>Outlook Express</span>
        <span>
          {selected
            ? `Recovered message: ${selected.id}`
            : "No message selected"}
        </span>
      </div>
    </div>
  );
};

export default Email;
