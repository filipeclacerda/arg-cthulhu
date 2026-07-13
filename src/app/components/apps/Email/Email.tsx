"use client";
import React, { useEffect, useState } from "react";
import "./style.scss";
import { emails } from "@/app/data/emails";
import { isUnlocked } from "@/app/game/unlock";
import { useProgress } from "@/app/context/ProgressContext";
import { resolveTokens } from "@/app/utils/narrative";
import ClueText from "@/app/components/ClueText/ClueText";
import { localizedEmail } from "@/app/data/localizedNarrative";

const formatEmailDate = (value: string) =>
  value.replace(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/,
    (_match: string, month: string, day: string, year: string, rest: string) =>
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}${rest}`
  );

const formatEmailListDate = (value: string) =>
  formatEmailDate(value).replace(/^(\d{4}-\d{2}-\d{2}).*$/, "$1");

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
  const visibleEmails = emails
    .filter((e) =>
      isUnlocked(e.unlock, {
        flags,
        discoveredEvidenceIds,
        solvedPuzzleIds,
        insightsUnlocked: state.insightsUnlocked,
      })
    )
    .map((email) => ({
      ...email,
      ...localizedEmail(
        email.id,
        { subject: email.subject, body: email.body },
        state.locale
      ),
    }));
  const visibleEmailIds = visibleEmails.map((email) => email.id).join("|");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Re-select the first visible email whenever the list grows (e.g. after a
  // flag fires mid-session and Sarah's live email appears).
  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && visibleEmails.some((e) => e.id === prev)) return prev;
      return null;
    });
  }, [visibleEmailIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = visibleEmails.find((e) => e.id === selectedId);
  const selectedBody = selected
    ? selected.id === "email-tom-loop" &&
      state.optionalDiscoveries.includes("tom_held_block")
      ? `${selected.body}\n\nATTACHMENT: HOLD_04.CHK — 0 bytes`
      : selected.body
    : "";

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
  const resolvedEmailDate = (date: string) => resolveTokens(date, ctx);
  const displayEmailDate = (date: string) => formatEmailDate(resolvedEmailDate(date));
  const displayEmailListDate = (date: string) =>
    formatEmailListDate(resolvedEmailDate(date));
  const unreadCount = visibleEmails.filter(
    (email) => !readEmailIds.includes(email.id)
  ).length;

  return (
    <div className="email">
      <div className="email-menubar">
        <span>{state.locale === "pt-BR" ? "Arquivo" : "File"}</span>
        <span>{state.locale === "pt-BR" ? "Editar" : "Edit"}</span>
        <span>{state.locale === "pt-BR" ? "Exibir" : "View"}</span>
        <span>{state.locale === "pt-BR" ? "Ferramentas" : "Tools"}</span>
        <span>{state.locale === "pt-BR" ? "Ajuda" : "Help"}</span>
      </div>
      <div className="email-toolbar">
        <button className="email-toolbar-button">{state.locale === "pt-BR" ? "Novo" : "New"}</button>
        <button className="email-toolbar-button">{state.locale === "pt-BR" ? "Responder" : "Reply"}</button>
        <button className="email-toolbar-button">{state.locale === "pt-BR" ? "Encaminhar" : "Forward"}</button>
        <button className="email-toolbar-button">{state.locale === "pt-BR" ? "Excluir" : "Delete"}</button>
        <span className="email-toolbar-status">
          {unreadCount} {state.locale === "pt-BR" ? "não lidas" : "unread"} / {visibleEmails.length} total
        </span>
      </div>
      <div className="email-panes">
        <div className="email-list">
          {visibleEmails.length === 0 && (
            <div className="email-empty">
              {state.locale === "pt-BR" ? "Nenhuma mensagem recuperada." : "No messages recovered."}
            </div>
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
              <p className="email-date">{displayEmailListDate(email.date)}</p>
            </div>
          ))}
        </div>
        <div className="email-detail">
          {selected ? (
            <>
              <div className="email-detail-header">
                <p>
                  <strong>{state.locale === "pt-BR" ? "De:" : "From:"}</strong> {selected.sender}
                </p>
                <p>
                  <strong>{state.locale === "pt-BR" ? "Data:" : "Date:"}</strong> {displayEmailDate(selected.date)}
                </p>
                <p>
                  <strong>{state.locale === "pt-BR" ? "Assunto:" : "Subject:"}</strong> {selected.subject}
                </p>
                {selected.messageId && isPuzzleSolved("future_log") && (
                  <p className="email-message-id">
                    <strong>Message-ID:</strong> {selected.messageId}
                  </p>
                )}
              </div>
              <ClueText
                as="pre"
                className="email-body"
                text={formatEmailDate(resolveTokens(selectedBody, ctx))}
                clues={selected.clues}
              />
            </>
          ) : (
            <p className="email-empty-detail">
              {state.locale === "pt-BR"
                ? "Selecione uma mensagem recuperada da lista."
                : "Select a recovered message from the list."}
            </p>
          )}
        </div>
      </div>
      <div className="email-statusbar">
        <span>Outlook Express</span>
        <span>
          {selected
            ? `${state.locale === "pt-BR" ? "Mensagem recuperada" : "Recovered message"}: ${selected.id}`
            : state.locale === "pt-BR"
              ? "Nenhuma mensagem selecionada"
              : "No message selected"}
        </span>
      </div>
    </div>
  );
};

export default Email;
