import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Gauge, MessageSquare, SlidersHorizontal, GraduationCap, Target,
  Flame, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { HaviChat } from "./HaviChat";
import { HaviChoices } from "./HaviChoices";
import { haviMessages, type HaviRole, type HaviTask, type PersonalityMode } from "./haviData";
import type { MvpPlan, MvpProgress } from "./mvpEstimate";
import type { TourGuideCheckIn } from "@/lib/api/tourGuide";

type Tab = "today" | "ask" | "choices";

interface HaviPanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: HaviRole;
  userName: string;
  tasks: HaviTask[];
  onToggleTask: (id: string) => void;
  timeSpentToday: number;
  completionPercentage: number;
  momentumScore: number;
  plan: MvpPlan;
  progress: MvpProgress;
  personality: PersonalityMode;
  firstLanding: boolean;
  guidance: TourGuideCheckIn | null;
  route?: string;
  profileContext: Record<string, unknown>;
  guidanceLoading: boolean;
  onPersonalityChange: (m: PersonalityMode) => void;
  onTargetDateChange: (date: string) => void;
}

const ACADEMY_PATH: Record<HaviRole, string> = {
  founder: "/incubation-hub?panel=learn",
  collaborator: "/collaborator/academy",
};

export function HaviPanel(props: HaviPanelProps) {
  const {
    isOpen, onClose, role, userName, tasks, onToggleTask, timeSpentToday,
    completionPercentage, momentumScore, plan, progress, personality,
    firstLanding, guidance, guidanceLoading, route, profileContext, onPersonalityChange, onTargetDateChange,
  } = props;

  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("today");

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalEstimated = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const planItems = toTextList(guidance?.daily_plan);
  const insightItems = toTextList(guidance?.ai_insights);
  const alertItems = toTextList(guidance?.alerts);

  const goAcademy = () => {
    onClose();
    navigate(ACADEMY_PATH[role]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[130]"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border-l border-black/[0.08] dark:border-white/10 shadow-2xl z-[140] flex flex-col text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="bg-white/40 dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/10 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center">
                    <img src="/bot-icon.png" alt="Havi" className="h-6 w-6 object-contain drop-shadow-sm" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Havi</h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Your build companion · {userName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
                  aria-label="Close Havi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Time to MVP — the core tracker */}
              <div className="rounded-2xl border border-[#0066ff]/25 dark:border-[#0066ff]/35 bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/10 dark:from-[#0066ff]/10 dark:to-[#58a6ff]/15 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">
                    <Target className="w-4 h-4 text-[#0066ff] dark:text-[#58a6ff]" /> Time to MVP
                  </span>
                  <span className="font-bold text-xs uppercase tracking-wider text-[#0066ff] dark:text-[#58a6ff]">
                    {progress.overdue
                      ? `${Math.abs(progress.daysRemaining)}d overdue`
                      : `${progress.daysRemaining} days left`}
                  </span>
                </div>
                <Progress value={progress.percentElapsed} className="h-2 mt-2.5" aria-label="Time to MVP elapsed" />
                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                  <span>{progress.percentElapsed}% elapsed</span>
                  <span>Target {progress.targetLabel}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5 mt-4 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl p-1">
                <TabBtn active={tab === "today"} onClick={() => setTab("today")} icon={<Gauge className="w-4 h-4" />} label="Today" />
                <TabBtn active={tab === "ask"} onClick={() => setTab("ask")} icon={<MessageSquare className="w-4 h-4" />} label="Ask" />
                <TabBtn active={tab === "choices"} onClick={() => setTab("choices")} icon={<SlidersHorizontal className="w-4 h-4" />} label="Edit" />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {tab === "today" && (
                <div className="space-y-6">
                  {firstLanding && (
                    <div className="rounded-2xl border border-[#0066ff]/20 dark:border-[#0066ff]/35 bg-[#0066ff]/5 dark:bg-[#0066ff]/10 p-4.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Welcome, {userName}.</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1 font-normal">
                        {role === "founder" ? haviMessages.welcomeFounder : haviMessages.welcomeCollaborator}
                      </p>
                    </div>
                  )}

                  {firstLanding && guidance?.introduction && (
                    <div className="rounded-2xl border border-[#58a6ff]/25 dark:border-[#58a6ff]/35 bg-[#58a6ff]/5 dark:bg-[#58a6ff]/10 p-4.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{guidance.introduction.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">{guidance.introduction.summary}</p>
                      <div className="mt-3 space-y-2">
                        {guidance.introduction.capabilities.map(item => (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => { onClose(); navigate(item.path); }}
                            className="block w-full rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#1a1a1a]/80 p-3 text-left hover:border-[#58a6ff]/50 transition-colors"
                          >
                            <span className="text-xs font-bold text-[#0066ff] dark:text-[#58a6ff]">{item.title}</span>
                            <span className="block text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-normal">{item.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Momentum */}
                  <div className="p-4.5 bg-gradient-to-br from-[#20c937]/5 to-[#20c937]/10 dark:from-[#20c937]/10 dark:to-[#20c937]/15 rounded-2xl border border-[#20c937]/25">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                        <Flame className="w-4 h-4 text-[#20c937]" /> Momentum
                      </h3>
                      <span className="font-bold text-sm text-[#20c937]">{momentumScore}/100</span>
                    </div>
                    <Progress value={momentumScore} className="h-2" aria-label="Momentum score" />
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-normal leading-relaxed">
                      {momentumScore >= 70
                        ? "Strong and steady — keep the streak alive."
                        : momentumScore >= 40
                        ? "Building up. Ship one visible thing today."
                        : "Momentum is low. Pick the smallest win and start."}
                    </p>
                    {guidanceLoading && (
                      <p className="text-[11px] font-semibold text-[#20c937] mt-2">Syncing live guidance...</p>
                    )}
                    {!guidanceLoading && guidance && (
                      <p className="text-[11px] font-semibold text-[#20c937] mt-2">
                        Live tour guide connected
                        {guidance.stagnation_risk ? " - stagnation risk flagged" : ""}
                      </p>
                    )}
                  </div>

                  {(planItems.length > 0 || insightItems.length > 0 || alertItems.length > 0) && (
                    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-4.5 space-y-3 backdrop-blur-md">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Live Guidance</h3>
                      {insightItems.length > 0 && (
                        <GuidanceList title="Insight" items={insightItems} />
                      )}
                      {planItems.length > 0 && (
                        <GuidanceList title="Next moves" items={planItems} />
                      )}
                      {alertItems.length > 0 && (
                        <GuidanceList title="Alerts" items={alertItems} tone="alert" />
                      )}
                    </div>
                  )}

                  {/* Today's plan */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Today's Plan</h3>
                    <div className="space-y-2.5">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3.5 bg-white/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 rounded-xl hover:border-[#0066ff]/30 transition-colors"
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => onToggleTask(task.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${task.completed ? "line-through text-slate-400 dark:text-slate-500 font-normal" : "text-slate-800 dark:text-slate-200 font-medium"}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-normal">{task.estimatedMinutes} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress summary */}
                  <div className="p-4.5 bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/5 dark:from-[#0066ff]/10 dark:to-[#58a6ff]/10 rounded-2xl border border-[#0066ff]/20 space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Tasks completed</span>
                      <span className="font-bold text-slate-900 dark:text-white">{completedTasks} / {tasks.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Time spent today</span>
                      <span className="font-bold text-slate-900 dark:text-white">{timeSpentToday} min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Estimated remaining</span>
                      <span className="font-bold text-slate-900 dark:text-white">{Math.max(0, totalEstimated - timeSpentToday)} min</span>
                    </div>
                    <div className="pt-2 mt-1 border-t border-[#0066ff]/20">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Completion</span>
                        <span className="font-bold text-[#0066ff] dark:text-[#58a6ff]">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2 mt-2" aria-label="Daily task completion" />
                    </div>
                  </div>

                  {/* Academy link */}
                  <button
                    onClick={goAcademy}
                    className="w-full group flex items-center gap-3.5 p-4 rounded-2xl border border-[#58a6ff]/25 dark:border-[#58a6ff]/35 bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/10 dark:from-[#0066ff]/10 dark:to-[#58a6ff]/15 hover:border-[#58a6ff]/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-white shrink-0 shadow-sm">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">Learn this in TechIT Academy</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lessons mapped to your stage and track</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#0066ff] dark:text-[#58a6ff] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                </div>
              )}

              {tab === "ask" && <HaviChat role={role} route={route} profile={profileContext} />}

              {tab === "choices" && (
                <HaviChoices
                  plan={plan}
                  personality={personality}
                  onPersonalityChange={onPersonalityChange}
                  onTargetDateChange={onTargetDateChange}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function toTextList(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => toTextList(item))
      .filter(Boolean)
      .slice(0, 5);
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .flatMap((item) => toTextList(item))
      .filter(Boolean)
      .slice(0, 5);
  }
  return [String(value)];
}

function GuidanceList({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "alert";
}) {
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-wider ${tone === "alert" ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>
        {title}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabBtn({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
        active
          ? "bg-white dark:bg-[#1a1a1a] text-[#0066ff] dark:text-[#58a6ff] shadow-sm"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
