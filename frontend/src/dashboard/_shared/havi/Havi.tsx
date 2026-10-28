import { useEffect, useMemo, useState } from "react";
import { HaviWidget, type HaviStatus } from "./HaviWidget";
import { HaviPanel } from "./HaviPanel";
import {
  getDefaultTasks, haviMessages, type HaviRole, type HaviTask, type PersonalityMode,
} from "./haviData";
import { claimFirstLanding } from "./firstLanding";
import { computeProgress, loadPlan, setTargetDate, type MvpPlan } from "./mvpEstimate";
import { fetchTourGuideCheckIn, type TourGuideCheckIn } from "@/lib/api/tourGuide";

interface HaviProps {
  role: HaviRole;
  userName?: string;
  /** Founder stage (Idea/Validation/MVP/…) used to seed the default MVP estimate. */
  stage?: string;
  route?: string;
  profileContext?: Record<string, unknown>;
}

const POS_KEY = (role: HaviRole) => `techit:havi:pos:${role}`;
const PERSONA_KEY = (role: HaviRole) => `techit:havi:persona:${role}`;
const EMPTY_PROFILE_CONTEXT: Record<string, unknown> = {};

function loadPosition(role: HaviRole): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POS_KEY(role));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { x: 0, y: 0 };
}

function loadPersona(role: HaviRole): PersonalityMode {
  try {
    const raw = localStorage.getItem(PERSONA_KEY(role)) as PersonalityMode | null;
    if (raw) return raw;
  } catch {
    /* ignore */
  }
  return "coach";
}

export function Havi({ role, userName = "there", stage, route, profileContext = EMPTY_PROFILE_CONTEXT }: HaviProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<HaviTask[]>(() => getDefaultTasks(role));
  const [plan, setPlan] = useState<MvpPlan>(() => loadPlan(role, stage));
  const [position, setPosition] = useState(() => loadPosition(role));
  const [personality, setPersonality] = useState<PersonalityMode>(() => loadPersona(role));
  const [firstLanding, setFirstLanding] = useState<boolean | null>(null);
  const [guidance, setGuidance] = useState<TourGuideCheckIn | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);

  const timeSpentToday = Number(profileContext.time_logged_today ?? profileContext.timeLoggedToday ?? 0) || 0;

  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionPercentage = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  // Momentum blends task completion with elapsed-vs-remaining health.
  const progress = useMemo(() => computeProgress(plan), [plan]);
  const backendMomentum = typeof guidance?.momentum_score === "number"
    ? Math.round(guidance.momentum_score)
    : null;
  const momentumScore = backendMomentum ?? 0;

  const status: HaviStatus =
    completionPercentage === 100
      ? "celebration"
      : progress.overdue
      ? "alert"
      : "active";

  const widgetMessage = guidanceLoading
    ? "Syncing live guidance..."
    : !guidance
    ? "Live guidance unavailable"
    : completionPercentage === 100
      ? haviMessages.celebration
      : progress.overdue
      ? "Past your MVP target — let's rebalance."
      : `${completionPercentage}% of today done`;

  // Persist position / persona.
  useEffect(() => {
    try { localStorage.setItem(POS_KEY(role), JSON.stringify(position)); } catch { /* ignore */ }
  }, [role, position]);
  useEffect(() => {
    try { localStorage.setItem(PERSONA_KEY(role), personality); } catch { /* ignore */ }
  }, [role, personality]);

  useEffect(() => {
    const claimed = claimFirstLanding(role);
    setFirstLanding(claimed);
    if (claimed) {
      setIsOpen(true);
    }
  }, [role]);

  useEffect(() => {
    if (firstLanding === null) return;
    let alive = true;
    setGuidanceLoading(true);
    fetchTourGuideCheckIn({
      source: "havi",
      role,
      firstLanding,
      route,
      profile: profileContext,
      mvp: {
        targetDate: plan.targetDate,
        daysRemaining: progress.daysRemaining,
        overdue: progress.overdue,
        completionPercentage,
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        estimatedMinutes: task.estimatedMinutes,
      })),
    })
      .then((nextGuidance) => {
        if (alive) setGuidance(nextGuidance);
      })
      .catch(() => {
        if (alive) setGuidance(null);
      })
      .finally(() => {
        if (alive) setGuidanceLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [completionPercentage, firstLanding, plan.targetDate, profileContext, progress.daysRemaining, progress.overdue, role, route, tasks]);

  useEffect(() => {
    if (tasks.length || !guidance?.daily_plan || !Array.isArray(guidance.daily_plan)) return;
    const nextTasks = guidance.daily_plan
      .map((item, index) => {
        if (typeof item === "string") return { id: `havi-live-${index}`, title: item, completed: false, estimatedMinutes: 30 };
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const title = String(row.action ?? row.title ?? "").trim();
        if (!title) return null;
        const estimatedMinutes = Number(row.est_min ?? row.estimatedMinutes ?? 30) || 30;
        return { id: String(row.id ?? `havi-live-${index}`), title, completed: false, estimatedMinutes };
      })
      .filter((item): item is HaviTask => Boolean(item))
      .slice(0, 5);
    if (nextTasks.length) setTasks(nextTasks);
  }, [guidance, tasks.length]);

  const toggleTask = (id: string) =>
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const changeTargetDate = (date: string) => setPlan(setTargetDate(role, date));

  return (
    <>
      <HaviWidget
        status={status}
        daysRemaining={progress.daysRemaining}
        overdue={progress.overdue}
        message={widgetMessage}
        onOpen={() => setIsOpen(true)}
        position={position}
        onPositionChange={setPosition}
      />

      <HaviPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        role={role}
        userName={userName}
        tasks={tasks}
        onToggleTask={toggleTask}
        timeSpentToday={timeSpentToday}
        completionPercentage={completionPercentage}
        momentumScore={momentumScore}
        plan={plan}
        progress={progress}
        personality={personality}
        firstLanding={Boolean(firstLanding)}
        guidance={guidance}
        guidanceLoading={guidanceLoading}
        route={route}
        profileContext={profileContext}
        onPersonalityChange={setPersonality}
        onTargetDateChange={changeTargetDate}
      />
    </>
  );
}
