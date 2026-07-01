"use client";

import Image from "next/image";
import React, { FormEvent, useEffect, useReducer, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { chats } from "@/app/data/chats";
import { isUnlocked } from "@/app/data/filesystem";
import {
  createMessengerState,
  MessengerEvent,
  MessengerRuntimeState,
  reduceMessenger,
} from "@/app/game/chat";
import "./style.scss";
import { resolveTokens } from "@/app/utils/narrative";
import { useI18n } from "@/app/i18n";
import { localizedChatMessage } from "@/app/data/localizedNarrative";

const PRESENCE_LABELS = {
  online: "presenceOnline",
  away: "presenceAway",
  offline: "presenceOffline",
  busy: "presenceBusy",
} as const;

const Messenger = () => {
  const {
    flags,
    discoveredEvidenceIds,
    state: progress,
    discoverEvidence,
    corruptionStage,
  } = useProgress();
  const { t } = useI18n();
  const presenceLabel = (presence: keyof typeof PRESENCE_LABELS | undefined) =>
    t(PRESENCE_LABELS[presence ?? "offline"]);
  const [presencePulse, setPresencePulse] = useState(false);
  const solvedPuzzleIds = Object.entries(progress.puzzles)
    .filter(([, puzzle]) => Boolean(puzzle.solvedAt))
    .map(([id]) => id as keyof typeof progress.puzzles);
  const visibleThreads = chats.filter((thread) =>
    isUnlocked(thread.unlock, {
      flags,
      discoveredEvidenceIds,
      solvedPuzzleIds,
    })
  );
  const [runtime, dispatch] = useReducer(
    (state: MessengerRuntimeState, event: MessengerEvent) =>
      reduceMessenger(state, event, chats),
    createMessengerState(chats)
  );
  const selected =
    visibleThreads.find((thread) => thread.id === runtime.selectedThreadId) ??
    visibleThreads[0];

  useEffect(() => {
    if (selected?.evidenceId) {
      discoverEvidence(selected.evidenceId, selected.id);
    }
  }, [discoverEvidence, selected]);

  useEffect(() => {
    if (corruptionStage < 2) {
      setPresencePulse(false);
      return;
    }
    let pulseTimer: ReturnType<typeof setTimeout> | null = null;
    const pulse = () => {
      setPresencePulse(true);
      pulseTimer = setTimeout(() => setPresencePulse(false), 1100);
    };
    pulse();
    const interval = setInterval(pulse, 11_000);
    return () => {
      clearInterval(interval);
      if (pulseTimer) clearTimeout(pulseTimer);
    };
  }, [corruptionStage]);

  if (!selected) {
    return <div className="messenger">{t("noArchivedConversations")}</div>;
  }

  const contact = selected.participants.find(
    (participant) => participant.id === selected.contactId
  );
  const derivedMessages = [
    ...(progress.puzzles.palimpsest.solvedAt && selected.id === "chat-tom"
      ? [
          {
            id: "dynamic-sarah-presence",
            senderId: "tom",
            timestamp: resolveTokens("{TOMORROW} 03:12"),
            body: t("sysSarahOnlineBlip"),
            kind: "system" as const,
          },
        ]
      : []),
    ...(progress.puzzles.lineage.solvedAt && selected.id === "chat-library"
      ? [
          {
            id: "dynamic-miriam-receipt",
            senderId: "staff",
            timestamp: resolveTokens("{TOMORROW} 03:13"),
            body: t("sysMiriamReceipt"),
            kind: "system" as const,
          },
        ]
      : []),
    ...(progress.puzzles.future_log.solvedAt && selected.id === "chat-tom"
      ? [
          {
            id: "dynamic-tom-receipt",
            senderId: "tom",
            timestamp: resolveTokens("{TOMORROW} 03:14"),
            body: t("sysTomReceipt"),
            kind: "system" as const,
          },
        ]
      : []),
  ];
  const messages = [
    ...selected.messages.map((message) => ({
      ...message,
      body: localizedChatMessage(message.id, message.body, progress.locale),
    })),
    ...derivedMessages,
    ...(runtime.localMessages[selected.id] ?? []),
  ];
  const draft = runtime.drafts[selected.id] ?? "";
  const send = (event: FormEvent) => {
    event.preventDefault();
    dispatch({ type: "SEND_MESSAGE", threadId: selected.id });
  };

  return (
    <div className="messenger">
      <div className="messenger__menubar">
        <span>{t("menuFile")}</span><span>{t("menuActions")}</span><span>{t("menuTools")}</span><span>{t("help")}</span>
      </div>
      <div className="messenger__identity">
        <Image src="/icons/msn-messenger.png" alt="" width={38} height={38} />
        <div>
          <strong>
            Sarah Bishop ({presencePulse ? t("presenceOnline") : t("presenceAway")})
          </strong>
          <span>sarah.bishop@miskatonic-research.org</span>
        </div>
        <button className="button" disabled>{t("myStatus")}</button>
      </div>

      <div className="messenger__workspace">
        <aside className="messenger__contacts">
          <div className="messenger__contact-heading">
            {t("archivedConversations")} ({visibleThreads.length})
          </div>
          {visibleThreads.map((thread) => {
            const threadContact = thread.participants.find(
              (participant) => participant.id === thread.contactId
            );
            const isPulsingOnline =
              presencePulse &&
              corruptionStage >= 3 &&
              thread.id === "chat-tom";
            return (
              <button
                key={thread.id}
                className={thread.id === selected.id ? "selected" : ""}
                onClick={() =>
                  dispatch({ type: "OPEN_THREAD", threadId: thread.id })
                }
              >
                <i
                  className={`presence presence--${
                    isPulsingOnline
                      ? "online"
                      : threadContact?.presence ?? "offline"
                  }`}
                />
                <span>
                  <strong>{thread.title}</strong>
                  <small>
                    {isPulsingOnline
                      ? t("presenceOnline")
                      : presenceLabel(threadContact?.presence)}
                  </small>
                </span>
              </button>
            );
          })}
          <div className="messenger__contact-note">
            {t("buddyListNote")}
          </div>
        </aside>

        <section className="messenger__conversation">
          <header>
            <div className="messenger__avatar" aria-hidden="true">
              {contact?.displayName.slice(0, 1) ?? "?"}
            </div>
            <div>
              <strong>{t("conversationWith")} {selected.title}</strong>
              <span>{contact?.address}</span>
            </div>
            <small>{presenceLabel(contact?.presence)}</small>
          </header>

          <div className="messenger__history">
            <div className="messenger__archive-banner">
              {t("archiveBanner")}
            </div>
            {messages.map((message) => {
              const sender = selected.participants.find(
                (participant) => participant.id === message.senderId
              );
              return (
                <div
                  key={message.id}
                  className={`messenger__message ${
                    message.kind === "system"
                      ? "messenger__message--system"
                      : ""
                  }`}
                >
                  <div>
                    <strong>{sender?.displayName ?? message.senderId}</strong>
                    <time>{message.timestamp}</time>
                  </div>
                  <p>{message.body}</p>
                </div>
              );
            })}
          </div>

          {selected.mode === "choices" && (
            <div className="messenger__suggested-replies">
              {selected.suggestedReplies?.map((reply) => (
                <button
                  key={reply.id}
                  className="button"
                  onClick={() =>
                    dispatch({
                      type: "SEND_MESSAGE",
                      threadId: selected.id,
                      body: reply.body,
                    })
                  }
                >
                  {reply.label}
                </button>
              ))}
            </div>
          )}

          <form className="messenger__composer" onSubmit={send}>
            <div className="messenger__formatbar">
              <button type="button" disabled>B</button>
              <button type="button" disabled>I</button>
              <button type="button" disabled>☺</button>
              <span>
                {selected.mode === "readonly"
                  ? t("archiveModeLabel")
                  : selected.mode === "choices"
                    ? t("suggestedRepliesLabel")
                    : t("liveComposerLabel")}
              </span>
            </div>
            <textarea
              aria-label="Message"
              disabled={selected.mode !== "freeform"}
              value={draft}
              onChange={(event) =>
                dispatch({
                  type: "SET_DRAFT",
                  threadId: selected.id,
                  value: event.target.value,
                })
              }
              placeholder={
                selected.mode === "readonly"
                  ? t("readonlyComposerPlaceholder")
                  : t("typeMessagePlaceholder")
              }
            />
            <button
              className="button"
              type="submit"
              disabled={selected.mode !== "freeform" || !draft.trim()}
            >
              {t("sendLabel")}
            </button>
          </form>
        </section>
      </div>

      <div className="messenger__statusbar">
        <span>{t("offlineArchiveOnly")}</span>
        <span>{messages.length} {t("messagesRecoveredSuffix")}</span>
      </div>
    </div>
  );
};

export default Messenger;
