import { Link } from "react-router-dom";
import { Trophy, X } from "lucide-react";
import type { Hackathon } from "@/dashboard/_shared/opportunities/types";

interface Props {
  hackathon: Hackathon | null;
  teamName: string | null;
}

export function HackathonMatchBanner({ hackathon, teamName }: Props) {
  if (!hackathon) {
    return (
      <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 mb-5 flex items-start justify-between gap-3 text-amber-900 dark:text-amber-200 backdrop-blur-xl shadow-sm">
        <div>
          <p className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Filtering for an unknown hackathon
          </p>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-1">
            We can't find that hackathon, but you can still browse all collaborators below.
          </p>
        </div>
        <Link
          to="/matches"
          aria-label="Clear filter"
          className="p-1.5 rounded-xl text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </Link>
      </div>
    );
  }
  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 mb-5 flex items-start justify-between gap-3 text-amber-900 dark:text-amber-200 backdrop-blur-xl shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Filtering for {hackathon.title}
        </p>
        <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
          Showing live collaborator profiles whose skills or title match
          {teamName ? ` the open roles for team ${teamName}` : " this hackathon"}.
        </p>
      </div>
      <Link
        to="/matches"
        className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-amber-500/30 dark:border-amber-400/30 bg-white/40 dark:bg-black/20 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 inline-flex items-center gap-1.5 shrink-0 transition-colors"
      >
        Clear filter <X className="w-3 h-3" />
      </Link>
    </div>
  );
}
