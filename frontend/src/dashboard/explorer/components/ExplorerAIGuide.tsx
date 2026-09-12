import { useState } from "react";
import { Sparkles, Bot, Lightbulb, Rocket, Users, Building2, HelpCircle, Send, ArrowRight, CheckCircle2 } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

const SUGGESTED_PROMPTS = [
  "How do I transition from Explorer to Collaborator mode?",
  "What are CBS (Collaboration Trust) scores and how are they computed?",
  "How does equity vesting work for early-stage startup builds?",
  "How do I find a technical co-founder for my AI idea?",
  "What hackathons or bounties can I join right now?"
];

export function ExplorerAIGuide() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "havi"; text: string }>>([
    {
      sender: "havi",
      text: "Hello! I am Havi, your TechIT AI Ecosystem Guide. I can help you navigate startup discovery, understand collaboration contracts, or choose the right operational mode for your goals. Ask me anything!"
    }
  ]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    const newMessages = [...messages, { sender: "user" as const, text }];
    setMessages(newMessages);
    setQuery("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "havi" as const,
          text: `Here is what I found regarding "${text}": TechIT provides automated smart contracts for equity vesting, live match indicators, and direct developer tools integration. You can switch to Founder or Collaborator mode anytime from your TopBar menu or Explorer settings.`
        }
      ]);
    }, 600);
  };

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-5xl mx-auto font-bricolage">
        {/* Header Banner */}
        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent p-6 dark:border-purple-400/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">AI Ecosystem Guide</h1>
              <p className="text-xs text-slate-600 dark:text-slate-300">Contextual advisor powered by Havi AI to help you explore and navigate TechIT.</p>
            </div>
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Suggested Questions</span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#0066ff] hover:text-[#0066ff] dark:hover:text-[#58a6ff] transition-all shadow-sm text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Thread Container */}
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4 min-h-[380px] flex flex-col justify-between">
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white shrink-0 ${
                    m.sender === "user" ? "bg-gradient-to-br from-[#0066ff] to-[#58a6ff]" : "bg-gradient-to-br from-purple-500 to-indigo-600"
                  }`}
                >
                  {m.sender === "user" ? "YOU" : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#0066ff] text-white font-medium"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 border border-black/[0.04] dark:border-white/10"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-3 border-t border-black/[0.06] dark:border-white/10"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Havi anything about the ecosystem..."
              className="h-11 flex-1 rounded-xl border border-black/[0.08] bg-slate-50 pl-4 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#58a6ff] dark:focus:bg-white/10"
            />
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-xs font-bold text-white shadow-md hover:opacity-95 flex items-center gap-1.5 shrink-0"
            >
              <span>Ask</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </ExplorerLayout>
  );
}
