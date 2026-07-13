type LockMessage = {
  type: "HELLO" | "ACTIVE" | "RELEASE";
  caseId: string;
  tabId: string;
  claimedAt?: number;
  leaseUntil?: number;
};

type Channel = {
  onmessage: ((event: MessageEvent<LockMessage>) => void) | null;
  postMessage(message: LockMessage): void;
  close(): void;
};

type ChannelConstructor = new (name: string) => Channel;

export interface SessionWriteLockOptions {
  caseId: string;
  tabId: string;
  now?: () => number;
  leaseMs?: number;
  heartbeatMs?: number;
  Channel?: ChannelConstructor;
  onChange?: (writable: boolean) => void;
}

/**
 * A small lease-based, per-case write owner. BroadcastChannel has no close
 * notification, so RELEASE makes normal tab closure immediate while the lease
 * lets another tab recover after crashes or suspended owners.
 */
export class SessionWriteLock {
  private readonly now: () => number;
  private readonly leaseMs: number;
  private readonly heartbeatMs: number;
  private readonly Channel?: ChannelConstructor;
  private channel: Channel | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private writable = true;
  private owner: { tabId: string; claimedAt: number; leaseUntil: number } | null = null;
  private claimedAt = 0;

  constructor(private readonly options: SessionWriteLockOptions) {
    this.now = options.now ?? Date.now;
    this.leaseMs = options.leaseMs ?? 15_000;
    this.heartbeatMs = options.heartbeatMs ?? 5_000;
    this.Channel = options.Channel ??
      (typeof BroadcastChannel === "undefined"
        ? undefined
        : (BroadcastChannel as unknown as ChannelConstructor));
  }

  isWritable = () => this.writable;

  start = () => {
    if (!this.Channel || this.channel) return;
    this.claimedAt = this.now();
    this.channel = new this.Channel("miskatonic-case-session");
    this.channel.onmessage = (event) => this.receive(event.data);
    this.channel.postMessage({ type: "HELLO", caseId: this.options.caseId, tabId: this.options.tabId });
    this.announce();
    if (this.heartbeatMs > 0) {
      this.timer = setInterval(() => this.checkLease(), this.heartbeatMs);
    }
  };

  stop = () => {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const channel = this.channel;
    // Detach before announcing release: a follower may immediately claim and
    // broadcast ACTIVE while this tab is still in the channel's peer list.
    this.channel = null;
    if (channel && this.writable) {
      channel.postMessage({ type: "RELEASE", caseId: this.options.caseId, tabId: this.options.tabId });
    }
    channel?.close();
  };

  checkLease = () => {
    if (this.writable) {
      this.announce();
      return;
    }
    if (!this.owner || this.owner.leaseUntil <= this.now()) {
      this.claimedAt = this.now();
      this.setWritable(true);
      this.announce();
    }
  };

  private announce = () => {
    if (!this.channel || !this.writable) return;
    this.channel.postMessage({
      type: "ACTIVE",
      caseId: this.options.caseId,
      tabId: this.options.tabId,
      claimedAt: this.claimedAt,
      leaseUntil: this.now() + this.leaseMs,
    });
  };

  private receive = (message: LockMessage) => {
    if (!message || message.caseId !== this.options.caseId || message.tabId === this.options.tabId) return;
    if (message.type === "HELLO") {
      this.announce();
      return;
    }
    if (message.type === "RELEASE") {
      if (this.owner?.tabId === message.tabId) {
        this.owner = null;
        this.claimedAt = this.now();
        this.setWritable(true);
        this.announce();
      }
      return;
    }
    if (message.type !== "ACTIVE" || !message.leaseUntil || message.leaseUntil <= this.now()) return;
    const incoming = { tabId: message.tabId, claimedAt: message.claimedAt ?? this.now(), leaseUntil: message.leaseUntil };
    const mineWins =
      this.writable &&
      (this.claimedAt < incoming.claimedAt ||
        (this.claimedAt === incoming.claimedAt && this.options.tabId < incoming.tabId));
    if (mineWins) {
      this.announce();
      return;
    }
    this.owner = incoming;
    this.setWritable(false);
  };

  private setWritable = (writable: boolean) => {
    if (this.writable === writable) return;
    this.writable = writable;
    this.options.onChange?.(writable);
  };
}
