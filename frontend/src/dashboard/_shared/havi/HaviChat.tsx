import { Send } from "lucide-react";
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
    <div className="flex min-h-[440px] flex-col rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-4.5 backdrop-blur-md">
      <div className="mb-3.5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20">
          <img src="/bot-icon.png" alt="Bot Icon" className="h-6 w-6 object-contain drop-shadow-sm" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Ask Havi</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Answers use your current TechIT context.</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06] p-3.5">
        {history.length === 0 && (
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 text-center py-8">
            Ask about your next step, TechIT tools, or how to move this project forward.
          </p>
        )}
        {history.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            className={`rounded-2xl p-3 text-sm leading-relaxed ${
              item.role === "user"
                ? "ml-6 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white rounded-tr-none shadow-sm"
                : "mr-6 bg-white dark:bg-[#1a1a1a] border border-black/[0.06] dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm"
            }`}
          >
            {item.content}
          </div>
        ))}
      </div>
      <form className="mt-3.5 flex gap-2" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask Havi..."
          className="min-w-0 flex-1 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
          disabled={pending}
        />
        <button
          type="submit"
          aria-label="Send to Havi"
          disabled={pending || !message.trim()}
          className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-4 py-2.5 text-white font-bold shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
