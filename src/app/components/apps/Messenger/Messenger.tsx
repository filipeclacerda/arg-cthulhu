"use client";

import Image from "next/image";
import React, { FormEvent, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { useFocalSetPieceActive } from "@/app/context/diegeticFocus";
import { ChatMessage, ChatThread, chats, MessengerPresence } from "@/app/data/chats";
import { isUnlocked } from "@/app/game/unlock";
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
import { useNameDegradation } from "@/app/hooks/useNameDegradation";
import {
  LIVE_CONTACT_PERSIST_INTERVAL_MS,
  LIVE_CONTACT_TICK_MS,
  shouldAdvanceLiveContact,
} from "@/app/game/liveContact";

const PRESENCE_LABELS = {
  online: "presenceOnline",
  away: "presenceAway",
  offline: "presenceOffline",
  busy: "presenceBusy",
} as const;

const LIVE_WINDOW_MS = 120_000;
// How long the "is typing..." ghost lingers after Sarah's reply is fully
// delivered before presence drops to offline (no further message ever
// arrives during this stretch).
const LIVE_GHOST_TYPING_DELAY_MS = 4_000;
const LIVE_GHOST_TYPING_DURATION_MS = 30_000;

type LiveQuestionId = "alive" | "restore" | "break" | "fourth";

const LIVE_REPLY_RESPONSES: Record<LiveQuestionId, { en: string; pt: string }[]> = {
  alive: [
    {
      en: "I remember making this choice. I do not know which side of it counts as alive.",
      pt: "Eu lembro de fazer esta escolha. Não sei qual lado dela conta como estar vivo.",
    },
  ],
  restore: [
    {
      en: "It copies a user into the next empty record. I found my own designation there.",
      pt: "Ele copia um usuário para o próximo registro vazio. Encontrei minha própria designação lá.",
    },
  ],
  break: [
    {
      en: "Leave the next field blank. Do not give it a name, even if the name is yours.",
      pt: "Deixe o próximo campo em branco. Não dê um nome a ele, mesmo que seja o seu.",
    },
  ],
  // The centerpiece reveal: three short messages, typed fast enough that the
  // last one loses its capital letter. She bites on the follow-up question —
  // the player did write a designation into the relay, back in the prologue.
  fourth: [
    {
      en: "I thought you created it.",
      pt: "Eu achei que você o tinha criado.",
    },
    {
      en: "Then I found the terminal in 1998.",
      pt: "Então encontrei o terminal em 1998.",
    },
    {
      en: "the fourth is whichever one of us answers next",
      pt: "o quarto é qualquer um de nós que responder depois",
    },
  ],
};

// Delay (ms) from the previous point (question sent, or previous message
// delivered) to each message's arrival. Kept deterministic — not randomized —
// so the schedule can be re-derived the same way after a reload, with the
// "is typing..." ghost filling every gap.
const LIVE_REPLY_DELAYS: Record<LiveQuestionId, number[]> = {
  alive: [900],
  restore: [950],
  break: [900],
  fourth: [1100, 2300, 2700],
};

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
  const { play } = useSound();
  const { windows } = useWindowManager();
  const focalSetPieceActive = useFocalSetPieceActive();
  const presenceLabel = (presence: keyof typeof PRESENCE_LABELS | undefined) =>
    t(PRESENCE_LABELS[presence ?? "offline"]);
  const [presencePulse, setPresencePulse] = useState(false);
  const [ghostTyping, setGhostTyping] = useState(false);
  const [hesitating, setHesitating] = useState(false);
  const ghostTypingShown = useRef(false);
  // Ticking clock driving the live thread's derived state (window countdown,
  // staged message delivery, the post-answer typing ghost). Everything about
  // the live conversation is computed from timestamps stored in
  // playerChoices, never from local-only timers, so a reload mid-window or
  // mid-reply reconstructs the exact same state instead of losing it.
  const [now, setNow] = useState(() => Date.now());
  const liveElapsedPendingRef = useRef(0);
  const liveTickAtRef = useRef<number | null>(null);
  // Kept out of the timer effect dependencies: committing elapsed time changes
  // this value, and rerunning the effect would immediately force-flush again.
  const liveContactActiveMsRef = useRef(progress.liveContact.activeMs);
  // `null` until the first delivery effect runs, so a reload that lands after
  // messages already arrived (or a reopen of an old thread) does not replay a
  // "ding" for history that was never actually new.
  const deliveredCountRef = useRef<number | null>(null);
  // The record loses integrity once the pattern is deep enough (future_log
  // solved / stage 3+). Never shown anywhere the player must act on it.
  const identityName = useNameDegradation("Sarah Bishop", corruptionStage >= 3, () =>
    dispatchGameEvent({ type: "TRIGGER_WORLD_REACTION", reactionId: "name_degraded" })
  );
  const solvedPuzzleIds = Object.entries(progress.puzzles)
    .filter(([, puzzle]) => Boolean(puzzle.solvedAt))
    .map(([id]) => id as keyof typeof progress.puzzles);
  const liveThread = useMemo<ChatThread | null>(
    () =>
      flags.sarah_msn_live
        ? {
            id: "chat-sarah-live",
            title: "NEXT_USER",
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
                displayName: "NEXT_USER",
                address: "next_user@relay.invalid",
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
                    ? "Não feche. Eu só consigo ver esta janela depois que você a abre."
                    : "Don't close this. I can only see this window after you open it.",
              },
              {
                id: "sarah-live-2",
                senderId: "future-sarah",
                timestamp: resolveTokens("{TOMORROW} 03:14"),
                body:
                  progress.locale === "pt-BR"
                    ? "Escolha uma frase. Eu preciso saber qual delas chegou primeiro."
                    : "Choose one line. I need to know which of them arrived first.",
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
              {
                id: "fourth",
                label:
                  progress.locale === "pt-BR"
                    ? "Você criou o quarto destinatário?"
                    : "Did you create the fourth recipient?",
                body:
                  progress.locale === "pt-BR"
                    ? "Você criou o quarto destinatário?"
                    : "Did you create the fourth recipient?",
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
      insightsUnlocked: progress.insightsUnlocked,
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

  const liveWindowOpenedAt =
    progress.playerChoices.find((choice) => choice.choiceId === "sarah_live_seen")
      ?.chosenAt ?? null;
  const liveQuestionChoice = progress.playerChoices.find(
    (choice) => choice.choiceId === "sarah_live_question"
  );
  const liveMissed = liveQuestionChoice?.optionId === "missed";
  const liveAnsweredId: LiveQuestionId | null =
    liveQuestionChoice && !liveMissed
      ? (liveQuestionChoice.optionId as LiveQuestionId)
      : null;
  const liveWindowExpired =
    progress.liveContact.status === "closed" && (!liveQuestionChoice || liveMissed);
  const liveWindowOpen =
    Boolean(liveThread) &&
    progress.liveContact.status === "active" &&
    !liveQuestionChoice;

  const liveResponses = liveAnsweredId ? LIVE_REPLY_RESPONSES[liveAnsweredId] : null;
  const liveDelays = liveAnsweredId ? LIVE_REPLY_DELAYS[liveAnsweredId] : null;
  let liveArrivalOffsets: number[] = [];
  if (liveDelays) {
    let cumulative = 0;
    liveArrivalOffsets = liveDelays.map((delay) => (cumulative += delay));
  }
  const liveChosenAt = liveQuestionChoice?.chosenAt ?? 0;
  const liveElapsedSinceAnswer = liveAnsweredId ? now - liveChosenAt : 0;
  const liveDeliveredCount = liveResponses
    ? liveArrivalOffsets.filter((offset) => liveElapsedSinceAnswer >= offset).length
    : 0;
  const liveTyping = Boolean(
    liveResponses && liveDeliveredCount < liveResponses.length
  );
  const liveAllDelivered = Boolean(
    liveResponses && liveDeliveredCount === liveResponses.length && liveResponses.length > 0
  );
  const liveLastArrivalOffset = liveArrivalOffsets[liveArrivalOffsets.length - 1] ?? 0;
  const liveSinceLastMessage = liveAllDelivered
    ? liveElapsedSinceAnswer - liveLastArrivalOffset
    : 0;
  const liveGhostTypingAfterAnswer =
    liveAllDelivered &&
    liveSinceLastMessage >= LIVE_GHOST_TYPING_DELAY_MS &&
    liveSinceLastMessage < LIVE_GHOST_TYPING_DELAY_MS + LIVE_GHOST_TYPING_DURATION_MS;
  const liveOfflineAfterAnswer =
    liveAllDelivered &&
    liveSinceLastMessage >= LIVE_GHOST_TYPING_DELAY_MS + LIVE_GHOST_TYPING_DURATION_MS;
  // Presence drops offline either once the post-answer typing ghost has run
  // its course, or — if no question was ever asked — once the two-minute
  // window itself elapses. Whichever applies, it never comes back online.
  const liveOffline = liveWindowExpired || liveOfflineAfterAnswer;

  const liveQaMessages: ChatMessage[] = [];
  if (liveThread && liveAnsweredId) {
    const chosenReply = liveThread.suggestedReplies?.find(
      (reply) => reply.id === liveAnsweredId
    );
    if (chosenReply) {
      liveQaMessages.push({
        id: `sarah-live-question-${liveAnsweredId}`,
        senderId: "sarah",
        timestamp: resolveTokens("{TOMORROW} 03:14"),
        body: chosenReply.body,
      });
    }
    liveResponses?.slice(0, liveDeliveredCount).forEach((response, index) => {
      liveQaMessages.push({
        id: `sarah-live-response-${liveAnsweredId}-${index}`,
        senderId: "future-sarah",
        timestamp: resolveTokens("{TOMORROW} 03:15"),
        body: progress.locale === "pt-BR" ? response.pt : response.en,
      });
    });
  }

  useEffect(() => {
    if (liveThread && !progress.playerChoices.some((choice) => choice.choiceId === "sarah_live_seen")) {
      dispatch({ type: "OPEN_THREAD", threadId: liveThread.id });
      dispatchGameEvent({
        type: "RECORD_CHOICE",
        choiceId: "sarah_live_seen",
        optionId: "opened",
      });
      play("chime");
    }
  }, [dispatchGameEvent, liveThread, progress.playerChoices, play]);

  const messengerWindow = windows.find((window) => window.id === "msn-messenger");
  const topVisibleZIndex = Math.max(
    -Infinity,
    ...windows.filter((window) => !window.minimized).map((window) => window.zIndex)
  );
  const messengerFocused = Boolean(
    messengerWindow &&
      !messengerWindow.minimized &&
      messengerWindow.zIndex === topVisibleZIndex
  );
  const [documentHidden, setDocumentHidden] = useState(
    () => typeof document !== "undefined" && document.hidden
  );

  useEffect(() => {
    const onVisibilityChange = () => setDocumentHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const canAdvanceLiveContact = shouldAdvanceLiveContact({
    status: progress.liveContact.status,
    documentHidden,
    messengerFocused,
    focalSetPieceActive,
  });

  useEffect(() => {
    liveContactActiveMsRef.current = progress.liveContact.activeMs;
  }, [progress.liveContact.activeMs]);

  // Sarah's window measures only the time the player can actually inhabit it.
  // The accumulated value is persisted every five seconds and also flushed on
  // visibility changes, focus loss and unmount, so reloads cannot restore
  // spent time or consume hidden-tab time.
  useEffect(() => {
    if (!liveThread || !canAdvanceLiveContact) {
      liveTickAtRef.current = null;
      return;
    }

    liveTickAtRef.current = Date.now();
    const flushElapsed = (force = false) => {
      const previousTick = liveTickAtRef.current;
      if (previousTick == null) return;
      const currentTick = Date.now();
      liveElapsedPendingRef.current += Math.max(0, currentTick - previousTick);
      liveTickAtRef.current = currentTick;
      const remaining = LIVE_WINDOW_MS - liveContactActiveMsRef.current;
      if (
        force ||
        liveElapsedPendingRef.current >= LIVE_CONTACT_PERSIST_INTERVAL_MS ||
        liveElapsedPendingRef.current >= remaining
      ) {
        const elapsedMs = Math.min(liveElapsedPendingRef.current, Math.max(0, remaining));
        liveElapsedPendingRef.current = 0;
        if (elapsedMs > 0) {
          dispatchGameEvent({ type: "ADVANCE_LIVE_CONTACT", elapsedMs });
        }
      }
    };
    const interval = window.setInterval(flushElapsed, LIVE_CONTACT_TICK_MS);
    const onVisibilityChange = () => {
      if (document.hidden) flushElapsed(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      flushElapsed(true);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [canAdvanceLiveContact, dispatchGameEvent, liveThread]);

  // Drives every derived timestamp above. Only ticks while the live thread
  // exists, since nothing else in the component needs sub-second updates.
  useEffect(() => {
    if (!liveThread) return;
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [liveThread]);

  useEffect(() => {
    if (
      deliveredCountRef.current !== null &&
      liveDeliveredCount > deliveredCountRef.current
    ) {
      play("chime");
    }
    deliveredCountRef.current = liveDeliveredCount;
  }, [liveDeliveredCount, play]);

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
    // Rare and irregular on purpose: a metronome becomes wallpaper, but a
    // status that flicks Online once while you happen to be looking is the
    // thing Tom described. First blip 20–60s in, then every 3–7 minutes.
    let pulseTimer: ReturnType<typeof setTimeout> | null = null;
    let scheduleTimer: ReturnType<typeof setTimeout> | null = null;
    const pulse = () => {
      setPresencePulse(true);
      pulseTimer = setTimeout(() => setPresencePulse(false), 1100);
      scheduleTimer = setTimeout(pulse, 180_000 + Math.random() * 240_000);
    };
    scheduleTimer = setTimeout(pulse, 20_000 + Math.random() * 40_000);
    return () => {
      if (scheduleTimer) clearTimeout(scheduleTimer);
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
    ...(progress.puzzles.future_log.solvedAt && selected.id === "chat-library"
      ? [
          {
            id: "dynamic-miriam-session",
            senderId: "staff",
            timestamp: resolveTokens("{TOMORROW} 03:14"),
            body: t("sysMiriamSession"),
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
    ...(liveThread && selected.id === liveThread.id ? liveQaMessages : []),
    ...(runtime.localMessages[selected.id] ?? []),
  ];
  const draft = runtime.drafts[selected.id] ?? "";
  const send = (event: FormEvent) => {
    event.preventDefault();
    dispatch({ type: "SEND_MESSAGE", threadId: selected.id });
  };

  // The question itself and every reply are derived from the persisted
  // playerChoice (see liveQaMessages above), so this only has to record the
  // choice — the message bubbles and their staged arrival are computed from
  // that single timestamp on every render, reload included.
  const chooseLiveReply = (replyId: string) => {
    if (!liveWindowOpen) return;
    // The pointer visibly stalls before the click registers — the one moment the
    // interface admits something is reading the choice before it is made.
    setHesitating(true);
    window.setTimeout(() => setHesitating(false), 550);
    play("chime");
    dispatchGameEvent({
      type: "RECORD_CHOICE",
      choiceId: "sarah_live_question",
      optionId: replyId,
    });
    dispatchGameEvent({ type: "SET_FLAG", flag: "next_user_handshake_sent" });
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
            {identityName} ({presencePulse ? t("presenceOnline") : t("presenceAway")})
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
            const isLive = liveThread != null && thread.id === liveThread.id;
            const isPulsingOnline =
              presencePulse &&
              corruptionStage >= 3 &&
              thread.id === "chat-tom";
            const rowPresence: MessengerPresence | undefined = isLive
              ? liveOffline
                ? "offline"
                : "online"
              : threadContact?.presence;
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
                    isPulsingOnline ? "online" : rowPresence ?? "offline"
                  }`}
                />
                <span>
                  <strong>{thread.title}</strong>
                  <small>
                    {isPulsingOnline ? t("presenceOnline") : presenceLabel(rowPresence)}
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
            <small>
              {presenceLabel(
                liveThread && selected.id === liveThread.id
                  ? liveOffline
                    ? "offline"
                    : "online"
                  : contact?.presence
              )}
            </small>
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
            {liveThread &&
              selected.id === liveThread.id &&
              (liveTyping || liveGhostTypingAfterAnswer) && (
                <div className="messenger__message messenger__message--ghost-typing">
                  <div>
                    <strong>NEXT_USER</strong>
                    <time>{presenceLabel("online")}</time>
                  </div>
                  <p>
                    <i>{t("isTypingLabel")}</i>
                  </p>
                </div>
              )}
          </div>

          {selected.mode === "choices" && liveWindowOpen && (
            <div
              className={`messenger__suggested-replies ${
                hesitating ? "messenger__suggested-replies--hesitating" : ""
              }`}
            >
              {selected.suggestedReplies?.map((reply) => (
                <button
                  key={reply.id}
                  className="button"
                  onClick={() => chooseLiveReply(reply.id)}
                >
                  {reply.label}
                </button>
              ))}
            </div>
          )}
          {selected.mode === "choices" && !liveWindowOpen && liveWindowOpenedAt != null && (
            <div className="messenger__suggested-replies messenger__suggested-replies--closed">
              <p>
                {progress.locale === "pt-BR"
                  ? liveMissed
                    ? "A janela fechou. Nenhuma pergunta foi feita a tempo."
                    : "A janela se fechou depois da resposta."
                  : liveMissed
                    ? "The window closed. No question was asked in time."
                    : "The window closed after the reply."}
              </p>
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
