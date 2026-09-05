import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { AlertTriangle, ArrowRight, CheckCircle, TrendingUp, Plus, Building2, Sparkles, Activity, Briefcase, Zap, Globe, Target, Calendar, Rocket } from "lucide-react";
import { useFounderProfile, type FounderStage } from "@/contexts/UserContext";
import {
  computeGsisV2,
  fetchDashboardIntelligence,
  type DashboardIntelligence,
  type GsisMetricInput,
  type GsisV2Scorecard,
} from "@/lib/api/gsis";
import { fetchAudioBriefing } from "@/lib/api/audio";
import { runAnomalyScan, type RiskFlag } from "@/lib/api/alerts";
import type { Hackathon } from "@/dashboard/_shared/opportunities/types";
import { fetchFounderOpportunityCatalog } from "@/lib/api/opportunities";
import { computeMomentum, momentumColor } from "@/dashboard/_shared/hackathon/momentum";
import { WelcomeBack } from "@/components/WelcomeBack";

interface Signal { id: string; message: string; href: string; }
interface FounderTask { id: string; title: string; detail: string; priority: "overdue" | "due-soon" | "this-week"; href: string; done: boolean; }
interface JourneyStage { id: string; label: string; status: "complete" | "active" | "upcoming"; progress: number; detail: string; }
interface Build { id: string; name: string; logoEmoji: string; stage: FounderStage; oneLiner: string; progress: number; isPrimary: boolean; }

const NOW_MS = Date.now();

const stageStyles: Record<string, string> = {
  Idea:    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white dark:border-white/20",
  MVP:     "bg-[#0066ff]/10 text-[#0066ff] border-[#0066ff]/20 dark:bg-[#0066ff]/20 dark:text-[#58a6ff] dark:border-[#0066ff]/30",
  Beta:    "bg-[#0066ff]/10 text-[#0066ff] border-[#0066ff]/20 dark:bg-[#0066ff]/20 dark:text-[#58a6ff] dark:border-[#0066ff]/30",
  Launch:  "bg-[#20c937]/10 text-[#20c937] border-[#20c937]/20 dark:bg-[#20c937]/20 dark:text-[#20c937] dark:border-[#20c937]/30",
  Growth:  "bg-[#20c937]/10 text-[#20c937] border-[#20c937]/20 dark:bg-[#20c937]/20 dark:text-[#20c937] dark:border-[#20c937]/30",
};

function normalizedStage(stage: string | undefined): FounderStage {
  const lower = String(stage ?? "").toLowerCase();
  if (lower === "mvp") return "MVP";
  if (lower === "beta") return "Beta";
  if (lower === "launch") return "Launch";
  if (lower === "growth") return "Growth";
  return "Idea";
}

function displayScore(value: number | null | undefined) {
  return value == null ? "Unknown" : Math.round(value).toString();
}

function metricLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function IntelligenceMetric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="min-w-0 bg-[#0066ff]/[0.04] dark:bg-white/[0.04] rounded-xl p-4 border border-[#0066ff]/10 dark:border-white/10 shadow-sm hover:bg-[#0066ff]/10 dark:hover:bg-white/[0.08] transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-[#171330]/50 dark:text-[#58a6ff]" />
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#171330]/50 dark:text-white/50">{label}</p>
      </div>
      <p className="truncate text-2xl font-black text-[#171330] dark:text-white tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { founderProfile: p } = useFounderProfile();

  const [intel, setIntel] = useState<DashboardIntelligence | null>(null);
  useEffect(() => {
    let alive = true;
    fetchDashboardIntelligence().then((d) => { if (alive) setIntel(d); });
    return () => { alive = false; };
  }, []);

  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  useEffect(() => {
    let alive = true;
    runAnomalyScan([{ kind: "founder_execution", source: "dashboard" }])
      .then((r) => { if (alive) setRiskFlags(r.risk_flags ?? []); });
    return () => { alive = false; };
  }, []);

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const firstName = (p.name || "Founder").split(" ")[0];

  useEffect(() => {
    let alive = true;
    fetchFounderOpportunityCatalog()
      .then((rows) => {
        if (alive) setHackathons(rows.filter((row): row is Hackathon => row.type === "hackathon"));
      })
      .catch(() => { if (alive) setHackathons([]); });
    return () => { alive = false; };
  }, []);

  const ventures = p.founderProjects;
  const builds: Build[] = useMemo(
    () => ventures.map((v) => ({
      id: v.id,
      name: v.title,
      logoEmoji: p.logoEmoji || "",
      stage: normalizedStage(v.stage),
      oneLiner: v.tagline,
      progress: Math.max(0, Math.min(100, Math.round(v.gsisScore || 0))),
      isPrimary: v.isPrimary,
    })),
    [ventures, p.logoEmoji],
  );
  
  const [activeVentureId, setActiveVentureId] = useState<string | null>(null);
  useEffect(() => {
    setActiveVentureId((cur) => cur ?? (ventures.find((v) => v.isPrimary) ?? ventures[0])?.id ?? null);
  }, [ventures]);
  
  const activeVenture = ventures.find((v) => v.id === activeVentureId) ?? ventures[0] ?? null;

  const [scorecard, setScorecard] = useState<GsisV2Scorecard | null>(null);
  useEffect(() => {
    if (!activeVenture && !p.startupName) {
      setScorecard(null);
      return;
    }
    let alive = true;
    const observedAt = activeVenture?.updatedAt ?? new Date().toISOString();
    const users = activeVenture?.users ?? p.users;
    const revenue = activeVenture?.revenueMonthly ?? p.revenueMonthly;
    const metrics: Record<string, GsisMetricInput> = {
      team_size: { value: p.currentTeamSize, status: "observed", evidence_level: 2, source: "founder_profile", observed_at: observedAt },
      product_available: {
        value: p.launchStatus !== "pre-launch" || ["launch", "growth"].includes(String(activeVenture?.stage ?? p.stage).toLowerCase()),
        status: "derived",
        evidence_level: 2,
        source: "founder_profile",
        observed_at: observedAt,
      },
    };
    if (users > 0) metrics.active_users = { value: users, status: "observed", evidence_level: 3, source: "founder_profile", observed_at: observedAt };
    if (revenue > 0) metrics.revenue = { value: revenue, status: "observed", evidence_level: 4, source: "founder_profile", observed_at: observedAt };
    if ((activeVenture?.progress ?? 0) > 0) {
      metrics.product = { score: activeVenture?.progress, status: "derived", evidence_level: 2, source: "project_progress", observed_at: observedAt };
    }
    computeGsisV2({
      startup_id: activeVenture?.id,
      declared_stage: activeVenture?.stage ?? p.stage,
      geography: p.location,
      last_activity_at: activeVenture?.updatedAt,
      legacy_gsis: activeVenture?.gsisScore,
      metrics,
    }).then((result) => { if (alive) setScorecard(result); });
    return () => { alive = false; };
  }, [activeVenture, p.currentTeamSize, p.launchStatus, p.location, p.revenueMonthly, p.stage, p.startupName, p.users]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const weeksBuilding = useMemo(
    () => Math.max(1, Math.floor((NOW_MS - new Date(`${p.foundingYear}-01-01`).getTime()) / (7 * 86_400_000))),
    [p.foundingYear],
  );

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-[1400px] mx-auto font-bricolage space-y-6">
      
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
        
        {/* ======================================================== */}
        {/* NEW GROUPED HEADER & VENTURES COMPONENT */}
        {/* ======================================================== */}
        <motion.div 
          variants={itemVariant} 
          className="rounded-[32px] bg-gradient-to-br from-[#58a6ff] to-[#58a6ff] p-6 md:p-8 relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,102,255,0.4)]"
        >
          {/* Subtle noise/glass overlay */}
          <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent blur-3xl -z-0" />
          
          <div className="relative z-10 flex flex-col gap-8">
            
            {/* Greeting Header */}
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm">Good morning, {firstName}.</h1>
              <p className="text-sm font-bold text-white/80 uppercase tracking-widest">{today} &middot; Week {weeksBuilding} of building</p>
            </div>

            {/* Welcome Back Audio Briefing component - sits nicely in the header now */}
            <div className="w-full">
              <WelcomeBack />
            </div>

            {/* Your ventures - Multi-project portfolio (Glassmorphism #0066ff) */}
            <div className="mt-4 bg-[#0066ff]/15 backdrop-blur-2xl border border-[#0066ff]/30 rounded-[28px] p-6 md:p-8 shadow-[0_15px_40px_rgba(0,102,255,0.2)]">
              <div className="flex items-center justify-between mb-6 border-b border-[#0066ff]/20 pb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-white shadow-sm" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-white drop-shadow-sm">Your ventures</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/incubation-hub")}
                  className="text-xs font-bold text-white hover:text-white transition-colors flex items-center gap-1 bg-[#0066ff]/30 border border-[#0066ff]/40 hover:bg-[#0066ff]/50 px-4 py-2 rounded-full shadow-[0_4px_15px_rgba(0,102,255,0.2)] backdrop-blur-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Analyze a new idea
                </button>
              </div>
              
              {ventures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ventures.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVentureId(v.id)}
                      className={`text-left rounded-2xl border p-5 transition-all duration-300 group backdrop-blur-md shadow-[0_4px_20px_rgba(0,102,255,0.1)] ${
                        activeVentureId === v.id
                          ? "border-[#0066ff]/60 bg-[#0066ff]/40 text-white"
                          : "border-[#0066ff]/30 bg-[#0066ff]/10 hover:border-[#0066ff]/50 hover:bg-[#0066ff]/30 text-white/90"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          activeVentureId === v.id ? "bg-white text-[#0066ff] shadow-md" : "bg-[#0066ff]/30 border border-[#0066ff]/40 text-white group-hover:bg-[#0066ff]/50"
                        }`}>
                           <Building2 className="h-5 w-5" aria-hidden="true" />
                        </div>
                        {v.isPrimary && <span className="text-[9px] uppercase font-bold tracking-widest text-white bg-[#0066ff]/60 border border-[#0066ff]/40 px-2 py-1 rounded-lg">Primary</span>}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-lg font-black text-white tracking-tight truncate mb-1">{v.title}</p>
                        {v.tagline && <p className="text-xs font-medium text-white/80 line-clamp-2">{v.tagline}</p>}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border-t border-[#0066ff]/30 pt-3">
                        <span className={`px-2 py-0.5 rounded-md border ${
                          activeVentureId === v.id ? "bg-[#0066ff]/50 text-white border-[#0066ff]/40" : "bg-[#0066ff]/20 text-white/90 border-[#0066ff]/30"
                        }`}>{v.stage || "idea"}</span>
                        <span className="text-white/90">GSIS {Math.round(v.gsisScore || 0)}</span>
                        <span className={`flex items-center gap-1 ${v.hasWorkspace ? "text-white" : "text-white/60"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${v.hasWorkspace ? "bg-[#20c937] shadow-[0_0_8px_#20c937]" : "bg-white/50"}`} />
                          {v.hasWorkspace ? "Ready" : "Setup"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-[#0066ff]/10 backdrop-blur-md rounded-2xl border border-[#0066ff]/20">
                  <p className="text-white/90 font-medium mb-4">You haven't added any ventures yet.</p>
                  <button onClick={() => navigate("/incubation-hub")} className="px-5 py-2.5 bg-[#0066ff] text-white font-bold rounded-xl hover:bg-[#0052cc] transition-all shadow-[0_4px_15px_rgba(0,102,255,0.4)]">
                    Start your first venture
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Startup hero */}
        {(p.startupName || activeVenture) && (
        <motion.div variants={itemVariant}>
          <Link to="/incubation-hub" className="block group border border-[#0066ff]/15 dark:border-white/10 shadow-[0_15px_40px_rgba(0,102,255,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-[#0066ff]/[0.02] dark:bg-[#121212]/90 backdrop-blur-3xl rounded-[32px] p-6 md:p-10 hover:border-[#0066ff]/30 hover:dark:border-[#0066ff]/40 hover:shadow-[0_20px_50px_rgba(0,102,255,0.15)] transition-all duration-300 relative overflow-hidden text-[#171330] dark:text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0066ff]/10 to-[#58a6ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#0066ff]/10 to-[#58a6ff]/5 dark:from-[#0066ff]/20 dark:to-[#58a6ff]/10 flex items-center justify-center shrink-0 border border-[#0066ff]/20 dark:border-[#0066ff]/30 shadow-sm group-hover:scale-110 transition-transform duration-500">
                 <Rocket className="h-7 w-7 text-[#0066ff] dark:text-[#58a6ff]" aria-hidden="true" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-black text-[#171330] dark:text-white tracking-tight">{activeVenture?.title ?? p.startupName}</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest border ${stageStyles[activeVenture ? normalizedStage(activeVenture.stage) : p.stage] ?? stageStyles.Idea}`}>
                    {activeVenture ? normalizedStage(activeVenture.stage) : p.stage}
                  </span>
                </div>
                
                <p className="text-sm md:text-base font-medium text-[#171330]/70 dark:text-white/70 mb-8 max-w-2xl">{activeVenture?.tagline ?? p.oneLiner}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm bg-[#0066ff]/[0.04] dark:bg-white/[0.03] rounded-2xl p-5 border border-[#0066ff]/10 dark:border-white/10">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#171330]/50 dark:text-white/50 uppercase tracking-widest"><Globe className="w-3 h-3 text-[#0066ff] dark:text-[#58a6ff]" /> Active users</div>
                    <p className="text-3xl md:text-4xl font-black text-[#171330] dark:text-white tabular-nums tracking-tight">{p.users.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-[#0066ff]/10 dark:border-white/10 pl-4 md:pl-6">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#171330]/50 dark:text-white/50 uppercase tracking-widest"><Activity className="w-3 h-3 text-[#0066ff] dark:text-[#58a6ff]" /> Revenue</div>
                    <p className="text-3xl md:text-4xl font-black text-[#171330] dark:text-white tabular-nums tracking-tight">${p.revenueMonthly.toLocaleString()}<span className="text-sm md:text-base text-[#171330]/40 dark:text-white/40 font-bold ml-1">/mo</span></p>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-[#0066ff]/10 dark:border-white/10 pl-4 md:pl-6">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#171330]/50 dark:text-white/50 uppercase tracking-widest"><Target className="w-3 h-3 text-[#0066ff] dark:text-[#58a6ff]" /> Open roles</div>
                    <p className="text-3xl md:text-4xl font-black text-[#171330] dark:text-white tabular-nums tracking-tight">{p.openRoles.length} <span className="text-sm md:text-base text-[#171330]/40 dark:text-white/40 font-bold ml-1">of 5</span></p>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-[#0066ff]/10 dark:border-white/10 pl-4 md:pl-6">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#171330]/50 dark:text-white/50 uppercase tracking-widest"><Sparkles className="w-3 h-3 text-[#0066ff] dark:text-[#58a6ff]" /> Investor fit</div>
                    <p className="text-3xl md:text-4xl font-black text-[#171330]/40 dark:text-white/40 tabular-nums tracking-tight">—</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-[#0066ff]/10 dark:border-white/10 text-sm relative z-10">
              <button type="button" onClick={(e) => { e.preventDefault(); navigate("/founder/settings#startup"); }} className="text-[#0066ff] dark:text-[#58a6ff] font-bold hover:text-[#0052cc] dark:hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest text-[10px]">
                Edit details <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); navigate("/founder/profile"); }} className="text-[#0066ff] dark:text-[#58a6ff] font-bold hover:text-[#0052cc] dark:hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest text-[10px]">
                Public profile <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Link>
        </motion.div>
        )}

        {/* GSIS v2 Dashboard Card */}
        {scorecard && (
          <motion.div variants={itemVariant} className="border border-[#0066ff]/15 dark:border-white/10 shadow-[0_20px_60px_rgba(0,102,255,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] bg-[#0066ff]/[0.03] dark:bg-[#121212]/90 backdrop-blur-3xl rounded-[32px] p-6 md:p-10 relative overflow-hidden text-[#171330] dark:text-white">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0066ff]/10 via-transparent to-transparent opacity-80 pointer-events-none" />
            
            <div className="flex flex-wrap items-start justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 border border-[#0066ff]/20 dark:border-[#0066ff]/30 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#0066ff] dark:text-[#58a6ff]" />
                  </div>
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-[#171330] dark:text-white">Startup Intelligence</h2>
                  <span className="rounded-lg bg-[#0066ff]/5 dark:bg-white/5 border border-[#0066ff]/20 dark:border-white/10 px-2 py-1 text-[10px] font-black tracking-widest text-[#171330]/60 dark:text-white/60 uppercase">{scorecard.model.version}</span>
                </div>
                <p className="text-sm font-semibold text-[#171330]/70 dark:text-white/70 max-w-lg leading-relaxed mt-4">{scorecard.stage.reason}</p>
              </div>
              
              <div className="text-right bg-[#0066ff]/5 dark:bg-white/[0.04] rounded-2xl p-5 border border-[#0066ff]/10 dark:border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#171330]/50 dark:text-white/50 mb-1">Global Startup Intelligence Score</p>
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#0066ff] to-[#58a6ff] tabular-nums tracking-tighter leading-none [text-shadow:0_0_30px_rgba(0,102,255,0.2)]">
                  {displayScore(scorecard.gsis)}<span className="text-2xl text-[#171330]/30 dark:text-white/30 font-bold ml-1">/100</span>
                </p>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
              <IntelligenceMetric label="Stage" value={scorecard.stage.detected_stage} icon={Target} />
              <IntelligenceMetric label="Stage health" value={displayScore(scorecard.stage_health)} icon={Activity} />
              <IntelligenceMetric label="Momentum" value={`${scorecard.momentum.score > 0 ? "+" : ""}${scorecard.momentum.score}`} icon={TrendingUp} />
              <IntelligenceMetric label="PMF" value={scorecard.pmf.score == null ? "N/A" : displayScore(scorecard.pmf.score)} icon={Sparkles} />
              <IntelligenceMetric label="Risk" value={scorecard.risk.level} icon={AlertTriangle} />
              <IntelligenceMetric label={`${metricLabel(scorecard.readiness.next_stage)}`} value={displayScore(scorecard.readiness.score)} icon={Zap} />
            </div>
            
            <div className="mt-8 grid gap-6 lg:grid-cols-2 relative z-10">
              <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle className="w-24 h-24 text-red-500" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2 flex items-center gap-1.5 relative z-10"><AlertTriangle className="w-3.5 h-3.5" /> Primary bottleneck</p>
                <p className="text-xl font-black text-red-600 capitalize relative z-10">{metricLabel(scorecard.bottleneck.category)}</p>
                <p className="mt-3 text-sm font-medium text-red-500/80 relative z-10">
                  {scorecard.bottleneck.score == null ? "More evidence is required to quantify this constraint." : `Current component score: ${Math.round(scorecard.bottleneck.score)}/100.`}
                </p>
              </div>
              
              {scorecard.recommendation && (
                <div className="bg-gradient-to-br from-[#0066ff]/10 to-[#58a6ff]/5 dark:from-[#0066ff]/20 dark:to-[#58a6ff]/10 rounded-2xl p-6 border border-[#0066ff]/20 dark:border-[#0066ff]/30 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp className="w-24 h-24 text-[#0066ff] dark:text-[#58a6ff]" /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#58a6ff] mb-2 flex items-center gap-1.5 relative z-10"><TrendingUp className="w-3.5 h-3.5" /> Next best action</p>
                  <p className="text-xl font-black text-[#171330] dark:text-white relative z-10">{scorecard.recommendation.action}</p>
                  <p className="mt-3 text-sm font-medium text-[#0066ff] dark:text-[#58a6ff] relative z-10">{scorecard.recommendation.next_milestone}</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 border-t border-[#0066ff]/10 dark:border-white/10 pt-6 relative z-10 bg-[#0066ff]/[0.05] dark:bg-white/[0.02] -mx-6 md:-mx-10 -mb-6 md:-mb-10 p-6 md:p-10 rounded-b-[32px]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${scorecard.readiness.status === 'READY' ? 'bg-[#20c937] text-[#20c937]' : 'bg-amber-400 text-amber-400 animate-pulse'}`} />
                  <p className="text-sm font-bold text-[#171330] dark:text-white">
                    <span className="capitalize">{metricLabel(scorecard.readiness.next_stage)}</span> gate: <span className={scorecard.readiness.status === 'READY' ? 'text-[#20c937]' : 'text-amber-500'}>{metricLabel(scorecard.readiness.status)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-[#0066ff]/[0.04] dark:bg-white/[0.04] rounded-xl px-4 py-2 border border-[#0066ff]/10 dark:border-white/10 shadow-sm">
                  <p className="text-[10px] font-bold text-[#171330]/60 dark:text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#0066ff] dark:text-[#58a6ff]" /> {Math.round(scorecard.data_coverage * 100)}% coverage
                  </p>
                  <div className="w-px h-3 bg-[#0066ff]/20 dark:bg-white/10" />
                  <p className="text-[10px] font-bold text-[#171330]/60 dark:text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0066ff] dark:text-[#58a6ff]" /> {Math.round(scorecard.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hackathon Momentum */}
        {(() => {
          const regs = p.hackathonRegistrations;
          if (regs.length === 0) {
            return (
              <motion.div variants={itemVariant} className="border border-[#0066ff]/15 dark:border-white/10 shadow-[0_15px_40px_rgba(0,102,255,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] bg-[#0066ff]/[0.03] dark:bg-[#121212]/90 backdrop-blur-3xl rounded-[32px] p-6 md:p-10 text-[#171330] dark:text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 border border-[#0066ff]/20 dark:border-[#0066ff]/30 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#0066ff] dark:text-[#58a6ff]" />
                      </div>
                      <h2 className="text-base font-black uppercase tracking-widest text-[#171330] dark:text-white">Hackathon Momentum</h2>
                    </div>
                    <p className="text-sm font-medium text-[#171330]/70 dark:text-white/70 max-w-2xl leading-relaxed">
                      No active hackathons. Join a hackathon from the Opportunity Hub to see your team's momentum tracker here &mdash; 4-hour check-ins, build velocity, and blockers.
                    </p>
                  </div>
                  <button type="button" onClick={() => navigate("/opportunity-hub")} className="text-[10px] uppercase tracking-widest font-black text-white bg-[#0066ff] px-6 py-4 rounded-xl hover:bg-[#0052cc] transition-colors shadow-sm shrink-0">
                    Browse opportunities &rarr;
                  </button>
                </div>
              </motion.div>
            );
          }
          return (
            <motion.div variants={itemVariant} className="border border-[#20c937]/30 dark:border-white/10 shadow-[0_20px_60px_rgba(32,201,55,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] bg-[#20c937]/[0.05] dark:bg-[#121212]/90 backdrop-blur-3xl rounded-[32px] p-6 md:p-10 relative overflow-hidden text-[#171330] dark:text-white">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#20c937]/20 via-transparent to-transparent opacity-60 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-8 relative z-10 border-b border-[#20c937]/20 dark:border-white/10 pb-6">
                <div className="w-12 h-12 rounded-xl bg-[#20c937]/20 border border-[#20c937]/30 flex items-center justify-center shadow-sm">
                  <Zap className="w-6 h-6 text-[#20c937]" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-[#171330] dark:text-white">Hackathon Momentum</h2>
                  <p className="text-xs font-bold text-[#171330]/60 dark:text-white/60 uppercase tracking-widest mt-1">Live tracking and velocity</p>
                </div>
              </div>
              
              <ul className="space-y-4 relative z-10">
                {regs.map((r) => {
                  const h = hackathons.find((o) => o.id === r.hackathonId);
                  if (!h) return null;
                  const memberCount = r.members.length + 1;
                  const teamSize = r.teamSize;
                  const startMs = new Date(h.startDate).getTime() - Date.now();
                  const days = Math.max(0, Math.ceil(startMs / (1000 * 60 * 60 * 24)));
                  const startsLabel = Number.isNaN(startMs) ? "Start date unavailable" : days <= 7 ? `Starts in ${days} days` : `Starts ${h.startDate}`;
                  const momentum = computeMomentum(r, Date.now());
                  const momColor = momentumColor(momentum.score);
                  const ctaLabel = momentum.nextAction === "submit-brief" ? "Submit brief" : momentum.nextAction === "log-check-in" ? "Log check-in" : "Open team";
                  const ctaStage = momentum.nextAction === "submit-brief" ? "brief" : "build";
                  
                  return (
                    <li key={r.teamId} className="flex flex-col lg:flex-row lg:items-center gap-6 border border-[#20c937]/20 dark:border-white/10 bg-[#20c937]/[0.05] dark:bg-white/[0.03] rounded-2xl p-5 md:p-6 hover:border-[#20c937]/40 hover:bg-[#20c937]/10 hover:dark:bg-white/[0.06] transition-all duration-300 group shadow-sm">
                      <div className="text-4xl shrink-0 bg-white/60 dark:bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-[#20c937]/20 dark:border-white/10 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">{h.poster}</div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-black text-[#171330] dark:text-white truncate mb-2">{h.title}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-[#20c937]/20 dark:bg-white/10 px-2 py-1 rounded-md text-[#171330] dark:text-white">{r.teamName}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#171330]/60 dark:text-white/60 flex items-center gap-1.5"><Building2 className="w-3 h-3" /> {memberCount}/{teamSize} members</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#171330]/60 dark:text-white/60 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {startsLabel}</span>
                        </div>
                        <p className="text-xs font-bold text-[#20c937] mt-3 uppercase tracking-widest">{momentum.nextActionLabel}</p>
                      </div>
                      
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 border-t border-[#20c937]/20 dark:border-white/10 lg:border-0 pt-5 lg:pt-0 lg:w-48 shrink-0">
                        <div className="text-right flex-1 lg:flex-none">
                          <p className={`text-4xl font-black tabular-nums tracking-tighter ${momColor.text}`}>{momentum.score}</p>
                          <div className="h-1.5 w-full lg:w-24 rounded-full bg-[#20c937]/20 dark:bg-white/10 mt-2">
                            <div className={`h-1.5 rounded-full ${momColor.bar} shadow-[0_0_10px_currentColor]`} style={{ width: `${momentum.score}%` }} />
                          </div>
                        </div>
                        <button type="button" onClick={() => navigate(`/incubation-hub?panel=hackathon&stage=${ctaStage}`)} className="text-[10px] uppercase font-black tracking-widest px-5 py-3 rounded-xl border border-white/20 text-white hover:bg-white hover:text-[#171330] transition-all shrink-0 shadow-lg whitespace-nowrap">
                          {ctaLabel} &rarr;
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          );
        })()}

      </motion.div>
      <div className="h-12" />
    </div>
  );
}
