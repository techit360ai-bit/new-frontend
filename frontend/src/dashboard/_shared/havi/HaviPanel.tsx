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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[130]"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-primary shadow-2xl z-[140] flex flex-col"
          >
            {/* Header */}
            <div className="bg-surface-primary border-b border-border-default px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Havi</h2>
                  <p className="text-xs text-text-muted">Your build companion · {userName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                  aria-label="Close Havi"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              {/* Time to MVP — the core tracker */}
              <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <Target className="w-4 h-4 text-cyan-600" /> Time to MVP
                  </span>
                  <span className="font-semibold text-cyan-700">
                    {progress.overdue
                      ? `${Math.abs(progress.daysRemaining)}d overdue`
                      : `${progress.daysRemaining} days left`}
                  </span>
                </div>
                <Progress value={progress.percentElapsed} className="h-2 mt-2" aria-label="Time to MVP elapsed" />
                <div className="flex justify-between text-xs text-text-muted mt-1.5">
                  <span>{progress.percentElapsed}% elapsed</span>
                  <span>Target {progress.targetLabel}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 bg-surface-secondary rounded-lg p-1">
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
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                      <p className="text-sm font-semibold text-text-primary">Welcome, {userName}.</p>
                      <p className="text-xs text-text-secondary leading-relaxed mt-1">
                        {role === "founder" ? haviMessages.welcomeFounder : haviMessages.welcomeCollaborator}
                      </p>
                    </div>
                  )}

                  {firstLanding && guidance?.introduction && (
                    <div className="rounded-xl border border-brand-accent bg-status-info-soft p-4">
                      <p className="text-sm font-semibold text-text-primary">{guidance.introduction.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-text-secondary">{guidance.introduction.summary}</p>
                      <div className="mt-3 space-y-2">
                        {guidance.introduction.capabilities.map(item => (
                          <button key={item.path} type="button" onClick={() => { onClose(); navigate(item.path); }} className="block w-full rounded-lg border border-brand-accent bg-surface-primary p-2 text-left hover:border-brand-accent">
                            <span className="text-xs font-semibold text-brand-accent">{item.title}</span><span className="block text-xs text-text-muted">{item.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Momentum */}
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-status-warning">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="flex items-center gap-1.5 font-semibold text-text-primary">
                        <Flame className="w-4 h-4 text-status-warning" /> Momentum
                      </h3>
                      <span className="font-semibold text-status-warning">{momentumScore}/100</span>
                    </div>
                    <Progress value={momentumScore} className="h-2" aria-label="Momentum score" />
                    <p className="text-xs text-text-muted mt-2">
                      {momentumScore >= 70
                        ? "Strong and steady — keep the streak alive."
                        : momentumScore >= 40
                        ? "Building up. Ship one visible thing today."
                        : "Momentum is low. Pick the smallest win and start."}
                    </p>
                    {guidanceLoading && (
                      <p className="text-[11px] text-status-warning mt-2">Syncing live guidance...</p>
                    )}
                    {!guidanceLoading && guidance && (
                      <p className="text-[11px] text-status-warning mt-2">
                        Live tour guide connected
                        {guidance.stagnation_risk ? " - stagnation risk flagged" : ""}
                      </p>
                    )}
                  </div>

                  {(planItems.length > 0 || insightItems.length > 0 || alertItems.length > 0) && (
                    <div className="rounded-xl border border-border-default bg-surface-primary p-4 space-y-3">
                      <h3 className="font-semibold text-text-primary text-sm">Live Guidance</h3>
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
                    <h3 className="font-semibold text-text-primary mb-3">Today's Plan</h3>
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 bg-background-primary rounded-lg hover:bg-surface-secondary transition-colors"
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => onToggleTask(task.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <p className={`text-sm ${task.completed ? "line-through text-text-muted" : "text-text-primary"}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-text-muted mt-1">{task.estimatedMinutes} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress summary */}
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Tasks completed</span>
                      <span className="font-medium text-text-primary">{completedTasks} / {tasks.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Time spent today</span>
                      <span className="font-medium text-text-primary">{timeSpentToday} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Estimated remaining</span>
                      <span className="font-medium text-text-primary">{Math.max(0, totalEstimated - timeSpentToday)} min</span>
                    </div>
                    <div className="pt-2 mt-1 border-t border-cyan-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Completion</span>
                        <span className="font-semibold text-cyan-600">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2 mt-2" aria-label="Daily task completion" />
                    </div>
                  </div>

                  {/* Academy link */}
                  <button
                    onClick={goAcademy}
                    className="w-full group flex items-center gap-3 p-4 rounded-xl border border-brand-accent bg-gradient-to-br from-indigo-50 to-purple-50 hover:border-brand-accent transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-accent text-white shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm">Learn this in TechIT Academy</p>
                      <p className="text-xs text-text-muted">Lessons mapped to your stage and track</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-brand-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
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
      <p className={`text-xs font-semibold uppercase tracking-wide ${tone === "alert" ? "text-status-warning" : "text-text-muted"}`}>
        {title}
      </p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs text-text-secondary leading-relaxed">
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
      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active ? "bg-surface-primary text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
