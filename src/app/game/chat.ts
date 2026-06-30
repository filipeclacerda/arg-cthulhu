import {
  ChatMessage,
  ChatThread,
  MessengerThreadMode,
} from "../data/chats";

export interface MessengerRuntimeState {
  selectedThreadId: string;
  drafts: Record<string, string>;
  localMessages: Record<string, ChatMessage[]>;
}

export type MessengerEvent =
  | { type: "OPEN_THREAD"; threadId: string }
  | { type: "SET_DRAFT"; threadId: string; value: string }
  | { type: "SEND_MESSAGE"; threadId: string; body?: string }
  | { type: "RECEIVE_MESSAGE"; threadId: string; message: ChatMessage };

export const createMessengerState = (
  threads: ChatThread[]
): MessengerRuntimeState => ({
  selectedThreadId: threads[0]?.id ?? "",
  drafts: {},
  localMessages: {},
});

const threadMode = (
  threads: ChatThread[],
  threadId: string
): MessengerThreadMode =>
  threads.find((thread) => thread.id === threadId)?.mode ?? "readonly";

export const reduceMessenger = (
  state: MessengerRuntimeState,
  event: MessengerEvent,
  threads: ChatThread[]
): MessengerRuntimeState => {
  switch (event.type) {
    case "OPEN_THREAD":
      return { ...state, selectedThreadId: event.threadId };
    case "SET_DRAFT":
      return {
        ...state,
        drafts: { ...state.drafts, [event.threadId]: event.value },
      };
    case "SEND_MESSAGE": {
      const mode = threadMode(threads, event.threadId);
      if (mode === "readonly") return state;
      const body = (event.body ?? state.drafts[event.threadId] ?? "").trim();
      if (!body) return state;
      const message: ChatMessage = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        senderId: "sarah",
        timestamp: new Date().toLocaleString(),
        body,
      };
      return {
        ...state,
        drafts: { ...state.drafts, [event.threadId]: "" },
        localMessages: {
          ...state.localMessages,
          [event.threadId]: [
            ...(state.localMessages[event.threadId] ?? []),
            message,
          ],
        },
      };
    }
    case "RECEIVE_MESSAGE":
      return {
        ...state,
        localMessages: {
          ...state.localMessages,
          [event.threadId]: [
            ...(state.localMessages[event.threadId] ?? []),
            event.message,
          ],
        },
      };
  }
};

