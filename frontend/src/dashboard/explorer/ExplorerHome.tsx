import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Compass, Lightbulb, MessageCircle, Rocket, Search, Sparkles, Users, CalendarDays, Ticket,
  TrendingUp, Building2, FolderKanban, ArrowRight, ShieldCheck, Zap, Award, Globe
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ExplorerLayout } from "./layout/ExplorerLayout";

const destinations = [
  { href: "/feed", label: "Personalized Feed", icon: Compass, description: "See ideas, people, startups, and conversations relevant to you.", category: "Community" },
  { href: "/feed/discover", label: "Discover Directory", icon: Search, description: "Explore founders, collaborators, investors, organizations, and projects.", category: "Network" },
  { href: "/feed/messages", label: "Messages & Direct Chat", icon: MessageCircle, description: "Continue conversations where TechIT enables direct collaboration.", category: "Connect" },
  { href: "/support", label: "Support & Help Desk", icon: Ticket, description: "Open and track customer support tickets or ask for platform help.", category: "Help" },
  { href: "/demos", label: "Events & Hackathons", icon: CalendarDays, description: "Join challenges and meet teams building solutions to real-world problems.", category: "Events" },
  { href: "/matches", label: "Opportunity Matching", icon: Users, description: "Find build opportunities where your skills and interests add real value.", category: "Growth" },
  { href: "/workspaces", label: "AI Guide & Learning", icon: Sparkles, description: "Learn the ecosystem architecture and receive contextual guidance.", category: "AI Tools" },
];

const STATS = [
  { label: "Active Startups", value: "128+", change: "+14 this week", icon: Building2, color: "from-[#20C997] to-[#1db587]" },
  { label: "Live Projects", value: "340+", change: "28 recruiting", icon: FolderKanban, color: "from-[#20C997] to-teal-500" },
  { label: "Open Gigs & Roles", value: "85", change: "40% cash + equity", icon: Zap, color: "from-[#20C997] to-emerald-400" },
  { label: "Upcoming Events", value: "12", change: "2 hackathons today", icon: CalendarDays, color: "from-[#20C997] to-teal-400" },
];

export default function ExplorerHome() {
  const navigate = useNavigate();
  const { profile, activateRole } = useAuth();
  const firstName = profile?.firstName || "Explorer";

  return (
    <ExplorerLayout>
      <div className="space-y-8 font-bricolage max-w-7xl mx-auto">
        {/* Hero Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/10 bg-gradient-to-br from-white/90 via-slate-50/80 to-[#20C997]/5 dark:from-[#111111]/90 dark:via-[#0a0a0a]/90 dark:to-[#20C997]/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          {/* Ambient Glow Orbs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#20C997]/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-[#20C997]/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#20C997]/20 bg-[#20C997]/10 px-3 py-1 text-xs font-bold text-[#20C997]">
              <Compass className="h-3.5 w-3.5" />
              <span>Ecosystem Gateway</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome back, <span className="bg-gradient-to-r from-[#20C997] via-[#1db587] to-teal-400 bg-clip-text text-transparent">{firstName}</span>.
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Explore the people, ideas, startups, build projects, hackathons, and opportunities across the TechIT ecosystem. Activate specialized modes whenever you are ready to participate.
            </p>

            {/* Quick Action Pills */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/feed/discover")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-[#20C997]/25 transition-all"
              >
                <Search className="h-4 w-4" />
                <span>Discover Ecosystem</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/feed")}
                className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <Compass className="h-4 w-4" />
                <span>Personalized Feed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ecosystem Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-4 sm:p-5 backdrop-blur-xl shadow-sm hover:border-[#20C997]/30 dark:hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="mt-1 text-[11px] font-semibold text-[#20C997] flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{stat.change}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Explore Destinations Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Explore Pathways</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct shortcuts to all network features and resources</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map(({ href, label, icon: Icon, description, category }) => (
              <Link
                key={href}
                to={href}
                className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#20C997]/40 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20C997]/10 text-[#20C997] group-hover:bg-[#20C997] group-hover:text-slate-950 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      {category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-[#20C997] transition-colors">
                    {label}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#20C997]">
                  <span>Explore module</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Ready to Participate Role Activation Surface */}
        <div className="rounded-3xl border border-[#20C997]/20 bg-gradient-to-r from-[#20C997]/10 via-[#20C997]/5 to-transparent p-6 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[#20C997]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready to Participate actively?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Activate a specialized operational mode whenever you are ready to post a startup build or join a team as a contributor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void activateRole("founder")}
                className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-white/10 border border-black/[0.08] dark:border-white/10 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white hover:border-[#20C997] hover:bg-slate-50 dark:hover:bg-white/20 transition-all shadow-sm"
              >
                <Rocket className="h-4 w-4 text-[#20C997]" />
                <span>Founder Mode</span>
              </button>

              <button
                type="button"
                onClick={() => void activateRole("collaborator")}
                className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-white/10 border border-black/[0.08] dark:border-white/10 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white hover:border-[#20C997] hover:bg-slate-50 dark:hover:bg-white/20 transition-all shadow-sm"
              >
                <Users className="h-4 w-4 text-[#20C997]" />
                <span>Collaborator Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ExplorerLayout>
  );
}
