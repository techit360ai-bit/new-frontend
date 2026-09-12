import { useState } from "react";
import { UserCircle, Compass, Sparkles, Building2, Bookmark, Clock, ShieldCheck, Edit, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ExplorerLayout } from "../layout/ExplorerLayout";

export function ExplorerProfile() {
  const { profile } = useAuth();

  const name = profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}` : "Explorer User";
  const bio = profile?.bio || "Exploring innovative early-stage startups, AI agent tools, and open build projects across the TechIT ecosystem.";

  const INTERESTS = ["AI Agents", "Developer Tools", "Web3 Infrastructure", "Biotech", "Fintech", "Open Source"];

  const SAVED_ITEMS = [
    { title: "AuraAI", type: "Startup", tagline: "Autonomous Code Review Sentinel", icon: "⚡" },
    { title: "AI Agentic Hackathon 2026", type: "Event", tagline: "Sep 15 - Sep 18 • $25k Prize Pool", icon: "🏆" },
    { title: "Lead AI Engineer & Co-Founder", type: "Opportunity", tagline: "$4,500/mo + 15% Equity", icon: "💼" },
  ];

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-5xl mx-auto font-bricolage">
        {/* Profile Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/10 bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/50 dark:from-[#18181b]/90 dark:via-[#121212]/90 dark:to-[#0066ff]/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-2xl font-black text-white shadow-lg">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{name}</h1>
                <p className="text-xs font-semibold text-[#0066ff] dark:text-[#58a6ff] flex items-center gap-1.5 mt-0.5">
                  <Compass className="h-3.5 w-3.5" />
                  <span>Explorer Mode Active</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert("Redirecting to profile edit settings...")}
              className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
            {bio}
          </p>
        </div>

        {/* Interests & Activity Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Interests Card */}
          <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Exploration Interests</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <span
                  key={interest}
                  className="rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066ff] dark:text-[#58a6ff] border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-bold"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Saved Items */}
          <div className="rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-purple-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Bookmarks & Saved Items</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{SAVED_ITEMS.length} Saved</span>
            </div>

            <div className="space-y-2">
              {SAVED_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] text-xs border border-black/[0.04] dark:border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{item.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.tagline}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{item.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ExplorerLayout>
  );
}
