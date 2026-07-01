"use client";

import Image from "next/image";
import React, { FormEvent, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { ChatThread, chats } from "@/app/data/chats";
import { isUnlocked } from "@/app/data/filesystem";
import {
  createMessengerState,
  MessengerEvent,
  MessengerRuntimeState,
  reduceMessenger,
} from "@/app/game/chat";
import "./style.scss";
import { resolveTokens } from "@/app/utils/narrative";
import ClueText from "@/app/components/ClueText/ClueText";
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
    dispatchGameEvent,
  } = useProgress();
  const { t } = useI18n();
  const presenceLabel = (presence: keyof typeof PRESENCE_LABELS | undefined) =>
    t(PRESENCE_LABELS[presence ?? "offline"]);
  const [presencePulse, setPresencePulse] = useState(false);
  const [ghostTyping, setGhostTyping] = useState(false);
  const [hesitating, setHesitating] = useState(false);
  const ghostTypingShown = useRef(false);
  const solvedPuzzleIds = Object.entries(progress.puzzles)
    .filter(([, puzzle]) => Boolean(puzzle.solvedAt))
    .map(([id]) => id as keyof typeof progress.puzzles);
  const liveThread = useMemo<ChatThread | null>(
    () =>
      flags.sarah_msn_live
        ? {
            id: "chat-sarah-live",
            title: "Sarah Bishop (tomorrow)",
            contactId: "future-sarah",
            mode: "choices",
            unlock: { type: "flag", flag: "sarah_msn_live" },
            evidenceId: "sarah_live_chat",
            participants: [
              {
                id: "sarah",
                displayName: progress.playerName || "Observer",
                address: "relay07@local",
                presence: "online",
              },
              {
                id: "future-sarah",
                displayName: "Sarah Bishop",
                address: "sarah.bishop@tomorrow",
                presence: "online",
              },
            ],
            messages: [
              {
                id: "sarah-live-1",
                senderId: "future-sarah",
                timestamp: resolveTokens("{TOMORROW} 03:14"),
                body:
                  progress.locale === "pt-BR"
                    ? "Não feche ainda. Quando a janela some, eu continuo vendo o lugar onde ela estava."
                    : "Don't close this yet. When the window disappears, I can still see where it was.",
              },
              {
                id: "sarah-live-2",
                senderId: "future-sarah",
                timestamp: resolveTokens("{TOMORROW} 03:14"),
                body:
                  progress.locale === "pt-BR"
                    ? "Faça uma pergunta. Acho que ele só permite uma."
                    : "Ask one question. I think it only allows one.",
              },
            ],
            suggestedReplies: [
              {
                id: "alive",
                label: progress.locale === "pt-BR" ? "Você está viva?" : "Are you alive?",
                body: progress.locale === "pt-BR" ? "Você está viva?" : "Are you alive?",
              },
              {
                id: "restore",
                label: progress.locale === "pt-BR" ? "O que RESTORE faz?" : "What does RESTORE do?",
                body: progress.locale === "pt-BR" ? "O que RESTORE faz?" : "What does RESTORE do?",
              },
              {
                id: "break",
                label: progress.locale === "pt-BR" ? "Como quebramos isso?" : "How do we break it?",
                body: progress.locale === "pt-BR" ? "Como quebramos isso?" : "How do we break it?",
              },
            ],
          }
        : null,
    [flags.sarah_msn_live, progress.locale, progress.playerName]
  );
  const allThreads = useMemo(
    () => (liveThread ? [...chats, liveThread] : chats),
    [liveThread]
  );
  const visibleThreads = allThreads.filter((thread) =>
    isUnlocked(thread.unlock, {
      flags,
      discoveredEvidenceIds,
      solvedPuzzleIds,
    })
  );
  const [runtime, dispatch] = useReducer(
    (state: MessengerRuntimeState, event: MessengerEvent) =>
      reduceMessenger(state, event, allThreads),
    createMessengerState(allThreads)
  );
  const selected =
    visibleThreads.find((thread) => thread.id === runtime.selectedThreadId) ??
    visibleThreads[0];

  useEffect(() => {
    if (liveThread && !progress.playerChoices.some((choice) => choice.choiceId === "sarah_live_seen")) {
      dispatch({ type: "OPEN_THREAD", threadId: liveThread.id });
      dispatchGameEvent({
        type: "RECORD_CHOICE",
        choiceId: "sarah_live_seen",
        optionId: "opened",
      });
    }
  }, [dispatchGameEvent, liveThread, progress.playerChoices]);

  useEffect(() => {
    if (selected?.evidenceId) {
      discoverEvidence(selected.evidenceId, selected.id);
    }
  }, [discoverEvidence, selected]);

  // Tom's account was disabled in-fiction, so this "typing" flicker never resolves
  // into a message — it happens once, the first time the archived thread is opened
  // after the pattern is named, and then never again.
  useEffect(() => {
    if (
      selected?.id !== "chat-tom" ||
      !progress.puzzles.lineage.solvedAt ||
      ghostTypingShown.current
    ) {
      return;
    }
    ghostTypingShown.current = true;
    dispatchGameEvent({ type: "TRIGGER_WORLD_REACTION", reactionId: "contact_typing" });
    const showTimer = window.setTimeout(() => setGhostTyping(true), 700);
    const hideTimer = window.setTimeout(() => setGhostTyping(false), 4200);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [dispatchGameEvent, progress.puzzles.lineage.solvedAt, selected]);

  useEffect(() => {
    if (!liveThread || selected?.id !== liveThread.id) return;
    dispatchGameEvent({ type: "TRIGGER_WORLD_REACTION", reactionId: "cursor_hesitation" });
  }, [dispatchGameEvent, liveThread, selected]);

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

  const chooseLiveReply = (replyId: string, body: string) => {
    if (
      progress.playerChoices.some(
        (choice) => choice.choiceId === "sarah_live_question"
      )
    ) {
      return;
    }
    // The pointer visibly stalls before the click registers — the one moment the
    // interface admits something is reading the choice before it is made.
    setHesitating(true);
    window.setTimeout(() => setHesitating(false), 550);
    dispatch({
      type: "SEND_MESSAGE",
      threadId: selected.id,
      body,
    });
    dispatchGameEvent({
      type: "RECORD_CHOICE",
      choiceId: "sarah_live_question",
      optionId: replyId,
    });
    const response: Record<string, { en: string; pt: string }> = {
      alive: {
        en: "Not in the same tense as you. I still remember having a body.",
        pt: "Não no mesmo tempo verbal que você. Ainda lembro de ter um corpo.",
      },
      restore: {
        en: "It changes which name is in SOURCE and which one is in ARCHIVE. I did not understand that until your field appeared.",
        pt: "Ele troca qual nome fica em SOURCE e qual fica em ARCHIVE. Eu não entendi isso até seu campo aparecer.",
      },
      break: {
        en: "Mom tried leaving a blank. Tom tried stopping the copy. Maybe the archive has to become the thing that watches.",
        pt: "Mamãe tentou deixar um espaço vazio. Tom tentou parar a cópia. Talvez o arquivo precise se tornar aquilo que observa.",
      },
    };
    window.setTimeout(() => {
      dispatch({
        type: "RECEIVE_MESSAGE",
        threadId: selected.id,
        message: {
          id: `sarah-live-response-${replyId}`,
          senderId: "future-sarah",
          timestamp: resolveTokens("{TOMORROW} 03:15"),
          body:
            progress.locale === "pt-BR"
              ? response[replyId].pt
              : response[replyId].en,
        },
      });
    }, 850);
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
                  <ClueText
                    as="p"
                    text={message.body}
                    clues={"clues" in message ? message.clues : undefined}
                  />
                </div>
              );
            })}
            {ghostTyping && selected.id === "chat-tom" && (
              <div className="messenger__message messenger__message--ghost-typing">
                <div>
                  <strong>{contact?.displayName ?? "Tom Alvarez"}</strong>
                  <time>{presenceLabel("offline")}</time>
                </div>
                <p>
                  <i>{t("isTypingLabel")}</i>
                </p>
              </div>
            )}
          </div>

          {selected.mode === "choices" && (
            <div
              className={`messenger__suggested-replies ${
                hesitating ? "messenger__suggested-replies--hesitating" : ""
              }`}
            >
              {selected.suggestedReplies?.map((reply) => (
                <button
                  key={reply.id}
                  className="button"
                  disabled={progress.playerChoices.some(
                    (choice) => choice.choiceId === "sarah_live_question"
                  )}
                  onClick={() => chooseLiveReply(reply.id, reply.body)}
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
