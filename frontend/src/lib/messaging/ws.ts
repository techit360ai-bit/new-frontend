import { MESSAGING_WS_URL, messagingToken } from "./config";
import { applyEnvelope, emptyStore, type Envelope, type MsgStore } from "./wsReducer";

type Listener = (store: MsgStore) => void;

// MessagingSocket owns one WebSocket, applies inbound envelopes through the pure
// reducer, and notifies listeners. Auto-reconnects with exponential backoff.
export class MessagingSocket {
  private ws: WebSocket | null = null;
  private store: MsgStore = emptyStore();
  private listeners = new Set<Listener>();
  private backoff = 1000;
  private closedByUs = false;
  private me: string;

  constructor(me: string) {
    this.me = me;
  }

  getStore(): MsgStore {
    return this.store;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  connect(): void {
    const token = messagingToken();
    if (!token) return; // no identity yet; caller retries after login
    this.closedByUs = false;
    const url = `${MESSAGING_WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onmessage = (e) => {
      try {
        const env = JSON.parse(e.data) as Envelope;
        this.store = applyEnvelope(this.store, env, this.me);
        this.listeners.forEach((l) => l(this.store));
      } catch {
        /* ignore malformed frame */
      }
    };
    ws.onopen = () => {
      this.backoff = 1000;
    };
    ws.onclose = () => {
      if (this.closedByUs) return;
      const jitter = Math.floor(Math.random() * 400);
      setTimeout(() => this.connect(), this.backoff + jitter);
      this.backoff = Math.min(this.backoff * 2, 30000);
    };
  }

  send(env: { type: string; data: Record<string, unknown> }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ...env, id: cryptoRandomId(), ts: new Date().toISOString() }));
    }
  }

  close(): void {
    this.closedByUs = true;
    this.ws?.close();
    this.ws = null;
  }
}

function cryptoRandomId(): string {
  // Best-effort client id for envelope.id; server generates the authoritative msg id.
  const a = new Uint8Array(8);
  (globalThis.crypto ?? ({ getRandomValues: (x: Uint8Array) => x } as Crypto)).getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
