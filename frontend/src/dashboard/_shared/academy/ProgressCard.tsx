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
    <Card className="p-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 border-status-pending">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-text-primary">Your Journey</h3>
            <p className="text-sm text-text-muted mt-1">
              Week {currentWeek} of {totalWeeks}
            </p>
          </div>
          <div className="bg-status-pending-soft p-2 rounded-lg">
            <Target className="size-5 text-status-pending" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Overall Progress</span>
            <span className="font-semibold text-status-pending">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-surface-primary p-3 rounded-lg border border-border-default">
            <div className="text-2xl font-semibold text-text-primary">{completedTasks}</div>
            <div className="text-xs text-text-muted mt-1">Tasks Completed</div>
          </div>
          <div className="bg-surface-primary p-3 rounded-lg border border-border-default">
            <div className="text-2xl font-semibold text-text-primary">{totalTasks - completedTasks}</div>
            <div className="text-xs text-text-muted mt-1">Tasks Remaining</div>
          </div>
        </div>

        {/* Next Lesson */}
        <div className="bg-surface-primary p-4 rounded-lg border border-status-pending space-y-3">
          <div className="flex items-start gap-2">
            <Award className="size-4 text-status-pending mt-0.5" />
            <div>
              <p className="text-xs text-text-muted">Next Lesson</p>
              <p className="font-medium text-text-primary text-sm mt-1">{nextLessonTitle}</p>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="w-full bg-status-pending hover:bg-status-pending text-white" onClick={onContinue}>
              Continue Lesson
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </Card>
  );
}
