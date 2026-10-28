import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MessagingSocket } from "@/lib/messaging/ws";
import type { MsgStore } from "@/lib/messaging/wsReducer";
import { emptyStore } from "@/lib/messaging/wsReducer";

interface MessagingCtx {
  store: MsgStore;
  socket: MessagingSocket | null;
}
const Ctx = createContext<MessagingCtx>({ store: emptyStore(), socket: null });

// currentUserId is read from AuthContext localStorage to avoid a hard dependency.
function currentUserId(): string {
  try {
    const u = localStorage.getItem("techit_user");
    if (u) return (JSON.parse(u) as { id?: string }).id ?? "";
  } catch {
    /* ignore */
  }
  return "";
}

export function MessagingProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<MsgStore>(emptyStore());
  const socketRef = useRef<MessagingSocket | null>(null);

  useEffect(() => {
    const me = currentUserId();
    const socket = new MessagingSocket(me);
    socketRef.current = socket;
    const unsub = socket.subscribe(setStore);
    socket.connect();
    return () => {
      unsub();
      socket.close();
    };
  }, []);

  return <Ctx.Provider value={{ store, socket: socketRef.current }}>{children}</Ctx.Provider>;
}

export function useMessaging(): MessagingCtx {
  return useContext(Ctx);
}
