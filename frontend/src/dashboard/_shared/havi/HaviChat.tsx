import { Bot, Send } from "lucide-react";
import { useState } from "react";
import type { HaviRole } from "./haviData";
import { converseWithHavi } from "@/lib/api/tourGuide";

export function HaviChat({ role, route, profile }: { role: HaviRole; route?: string; profile: Record<string, unknown> }) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [pending, setPending] = useState(false);

  const send = async () => {
    const content = message.trim();
    if (!content || pending) return;
    setMessage("");
    const next = [...history, { role: "user" as const, content }];
    setHistory(next);
    setPending(true);
    try {
      const response = await converseWithHavi({ source: "havi", role, route, profile, conversation: history, message: content });
      setHistory(current => [...current, {
        role: "assistant",
        content: response?.message || "Havi is temporarily unavailable. Your work is unchanged; try again shortly.",
      }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[420px] flex-col rounded-xl border border-[#0066ff]/20 bg-[#0066ff]/5 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0066ff]/10"><Bot className="h-5 w-5 text-[#0066ff]" /></div>
        <div><h3 className="font-semibold text-[#171330]">Ask Havi</h3><p className="text-xs text-[#171330]/70">Answers use your current TechIT context.</p></div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-white p-3">
        {history.length === 0 && <p className="text-sm text-[#171330]/60">Ask about your next step, TechIT tools, or how to move this project forward.</p>}
        {history.map((item, index) => <div key={`${item.role}-${index}`} className={`rounded-lg p-2 text-sm ${item.role === "user" ? "ml-8 bg-[#0066ff]/15 text-[#171330]" : "mr-8 bg-white border border-[#0066ff]/10 text-[#171330]/80"}`}>{item.content}</div>)}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <input value={message} onChange={event => setMessage(event.target.value)} placeholder="Ask Havi..." className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" disabled={pending} />
        <button type="submit" aria-label="Send to Havi" disabled={pending || !message.trim()} className="rounded-lg bg-[#0066ff] px-3 py-2 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
