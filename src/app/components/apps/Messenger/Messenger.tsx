"use client";

import Image from "next/image";
import React, { FormEvent, useEffect, useReducer } from "react";
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

const Messenger = () => {
  const {
    flags,
    discoveredEvidenceIds,
    state: progress,
    discoverEvidence,
  } = useProgress();
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

  if (!selected) {
    return <div className="messenger">No archived conversations.</div>;
  }

  const contact = selected.participants.find(
    (participant) => participant.id === selected.contactId
  );
  const messages = [
    ...selected.messages,
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
        <span>File</span><span>Actions</span><span>Tools</span><span>Help</span>
      </div>
      <div className="messenger__identity">
        <Image src="/icons/msn-messenger.png" alt="" width={38} height={38} />
        <div>
          <strong>Sarah Bishop (Away)</strong>
          <span>sarah.bishop@miskatonic-research.org</span>
        </div>
        <button className="button" disabled>My Status</button>
      </div>

      <div className="messenger__workspace">
        <aside className="messenger__contacts">
          <div className="messenger__contact-heading">
            Archived Conversations ({visibleThreads.length})
          </div>
          {visibleThreads.map((thread) => {
            const threadContact = thread.participants.find(
              (participant) => participant.id === thread.contactId
            );
            return (
              <button
                key={thread.id}
                className={thread.id === selected.id ? "selected" : ""}
                onClick={() =>
                  dispatch({ type: "OPEN_THREAD", threadId: thread.id })
                }
              >
                <i className={`presence presence--${threadContact?.presence ?? "offline"}`} />
                <span>
                  <strong>{thread.title}</strong>
                  <small>{threadContact?.presence ?? "offline"}</small>
                </span>
              </button>
            );
          })}
          <div className="messenger__contact-note">
            Buddy list restored from local cache.
            Presence data may be stale.
          </div>
        </aside>

        <section className="messenger__conversation">
          <header>
            <div className="messenger__avatar" aria-hidden="true">
              {contact?.displayName.slice(0, 1) ?? "?"}
            </div>
            <div>
              <strong>Conversation with {selected.title}</strong>
              <span>{contact?.address}</span>
            </div>
            <small>{contact?.presence ?? "offline"}</small>
          </header>

          <div className="messenger__history">
            <div className="messenger__archive-banner">
              This conversation was recovered from Sarah Bishop&apos;s local
              message history. Messages cannot currently be delivered.
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
                  ? "Archive mode"
                  : selected.mode === "choices"
                    ? "Suggested replies"
                    : "Live composer"}
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
                  ? "This recovered conversation is read-only."
                  : "Type a message..."
              }
            />
            <button
              className="button"
              type="submit"
              disabled={selected.mode !== "freeform" || !draft.trim()}
            >
              Send
            </button>
          </form>
        </section>
      </div>

      <div className="messenger__statusbar">
        <span>Offline — local archive only</span>
        <span>{messages.length} messages recovered</span>
      </div>
    </div>
  );
};

export default Messenger;
