import { describe, expect, it } from "vitest";
import { SessionWriteLock } from "./sessionLock";

type MessageHandler = (event: MessageEvent) => void;

class FakeChannel {
  static channels = new Map<string, Set<FakeChannel>>();
  onmessage: MessageHandler | null = null;
  constructor(readonly name: string) {
    const peers = FakeChannel.channels.get(name) ?? new Set();
    peers.add(this);
    FakeChannel.channels.set(name, peers);
  }
  postMessage(data: unknown) {
    for (const peer of FakeChannel.channels.get(this.name) ?? []) {
      if (peer !== this) peer.onmessage?.({ data } as MessageEvent);
    }
  }
  close() {
    FakeChannel.channels.get(this.name)?.delete(this);
  }
}

describe("SessionWriteLock", () => {
  it("allows a read-only tab to recover when the owner releases its lock", () => {
    let now = 100;
    const owner = new SessionWriteLock({ caseId: "case", tabId: "owner", now: () => now, Channel: FakeChannel, heartbeatMs: 0 });
    const follower = new SessionWriteLock({ caseId: "case", tabId: "follower", now: () => now, Channel: FakeChannel, heartbeatMs: 0 });
    owner.start();
    now += 1;
    follower.start();
    expect(follower.isWritable()).toBe(false);
    owner.stop();
    expect(follower.isWritable()).toBe(true);
    follower.stop();
  });

  it("recovers ownership after a silent owner lease expires", () => {
    let now = 100;
    const owner = new SessionWriteLock({ caseId: "case", tabId: "owner", now: () => now, Channel: FakeChannel, leaseMs: 20, heartbeatMs: 0 });
    const follower = new SessionWriteLock({ caseId: "case", tabId: "follower", now: () => now, Channel: FakeChannel, leaseMs: 20, heartbeatMs: 0 });
    owner.start();
    now += 1;
    follower.start();
    expect(follower.isWritable()).toBe(false);
    // Simulate a crashed/suspended tab: no RELEASE reaches the follower.
    (owner as unknown as { channel: FakeChannel }).channel.close();
    now += 21;
    follower.checkLease();
    expect(follower.isWritable()).toBe(true);
    owner.stop();
    follower.stop();
  });
});
