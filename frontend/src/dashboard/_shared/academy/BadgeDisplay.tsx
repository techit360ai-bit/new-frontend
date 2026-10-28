import { Award, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge as BadgePrimitive } from "@/components/ui/badge";
export type AcademyBadge = {
  id: string;
  badgeId?: string;
  projectId?: string;
  role?: string;
  earnedAt?: string;
  name?: string;
  description?: string;
  category?: string;
  level?: number;
};

interface BadgeDisplayProps {
  badges: AcademyBadge[];
  earnedBadgeIds: string[];
}

export function BadgeDisplay({ badges, earnedBadgeIds }: BadgeDisplayProps) {
  const isEarned = (badgeId: string) => earnedBadgeIds.includes(badgeId);

  const getBadgeColor = (category: string) => {
    switch (category) {
      case "founder":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "collaborator":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const earnedCount = badges.filter((b) => isEarned(b.id)).length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Your Badges</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {earnedCount} of {totalCount} earned
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(progressPercent)}%</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0066ff] dark:text-[#58a6ff]">Complete</div>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {badges.map((badge, index) => {
          const earned = isEarned(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`p-4 rounded-xl border transition-all ${
                  earned
                    ? "border-[#20c937]/30 bg-[#20c937]/10 dark:bg-[#20c937]/15 shadow-sm"
                    : "border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${earned ? "bg-white/80 dark:bg-black/40 text-[#20c937]" : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-400"}`}>
                    {earned ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Lock className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{badge.name || badge.badgeId || "Academy badge"}</h4>
                      {badge.level && (
                        <span className="h-5 px-1.5 rounded text-[10px] font-bold border border-[#0066ff]/30 bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] inline-flex items-center">
                          L{badge.level}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{badge.description || "Earned through verified Academy progress."}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2.5 pt-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-[#0066ff]/5 dark:bg-[#0066ff]/10 border border-[#0066ff]/15 rounded-xl p-3.5">
        <Award className="size-4 text-[#0066ff] dark:text-[#58a6ff] shrink-0" />
        <span>Badges boost your credibility score and investor visibility</span>
      </div>
    </div>
  );
}
