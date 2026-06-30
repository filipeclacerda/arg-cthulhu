import { describe, expect, it } from "vitest";
import { ChatThread } from "../data/chats";
import { createMessengerState, reduceMessenger } from "./chat";

const thread = (mode: ChatThread["mode"]): ChatThread => ({
  id: "test",
  title: "Test",
  contactId: "contact",
  mode,
  evidenceId: "test-chat",
  unlock: { type: "always" },
  participants: [],
  messages: [],
});

describe("messenger runtime", () => {
  it("refuses outgoing messages for archived read-only threads", () => {
    const threads = [thread("readonly")];
    const state = createMessengerState(threads);
    const next = reduceMessenger(
      state,
      { type: "SEND_MESSAGE", threadId: "test", body: "hello" },
      threads
    );
    expect(next).toBe(state);
  });

  it("already supports future freeform threads", () => {
    const threads = [thread("freeform")];
    const state = createMessengerState(threads);
    const next = reduceMessenger(
      state,
      { type: "SEND_MESSAGE", threadId: "test", body: "hello" },
      threads
    );
    expect(next.localMessages.test).toHaveLength(1);
    expect(next.localMessages.test[0].body).toBe("hello");
  });
});
