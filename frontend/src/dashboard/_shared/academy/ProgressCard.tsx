import { ArrowRight, Award, Target } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ProgressCardProps {
  currentWeek: number;
  totalWeeks: number;
  progressPercent: number;
  nextLessonTitle: string;
  completedTasks: number;
  totalTasks: number;
  onContinue?: () => void;
}

export function ProgressCard({
  currentWeek,
  totalWeeks,
  progressPercent,
  nextLessonTitle,
  completedTasks,
  totalTasks,
  onContinue,
}: ProgressCardProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Your Journey</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Week {currentWeek} of {totalWeeks}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff]">
          <Target className="size-4" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400">Overall Progress</span>
          <span className="font-bold text-[#0066ff] dark:text-[#58a6ff]">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2.5" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white">{completedTasks}</div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Tasks Completed</div>
        </div>
        <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white">{Math.max(0, totalTasks - completedTasks)}</div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Tasks Remaining</div>
        </div>
      </div>

      {/* Next Lesson */}
      <div className="rounded-xl border border-[#0066ff]/20 bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/10 dark:from-[#0066ff]/10 dark:to-[#58a6ff]/15 p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0066ff]/15 text-[#0066ff] dark:text-[#58a6ff] flex items-center justify-center shrink-0 mt-0.5">
            <Award className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Next Lesson</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 truncate">{nextLessonTitle}</p>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold text-sm py-2.5 shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
          >
            Continue Lesson
            <ArrowRight className="size-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
