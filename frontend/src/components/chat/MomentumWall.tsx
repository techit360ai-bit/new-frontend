import { Gem, Info, TrendingUp } from "lucide-react";

const MomentumWall = () => {
  return (
    <aside className="sticky top-4 right-0 w-full min-w-0 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider">
          Your Momentum Wall
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full min-w-0 bg-gradient-to-b from-slate-900 to-slate-950 border border-border-inverse rounded-xl p-4 space-y-4">
        {/* Project Name */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white truncate">
            MediConnect Africa
          </h3>
          <span className="inline-block px-2 py-1 bg-status-pending/20 text-status-pending text-xs font-semibold rounded-full">
            MVP
          </span>
        </div>

        {/* GSIS Score */}
        <div className="space-y-2 pt-4 border-t border-border-inverse">
          <p className="text-sm text-text-disabled">GSIS</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-status-warning">68</span>
            <span className="text-sm text-text-muted">/100</span>
          </div>
          <p className="text-xs text-text-disabled flex items-center gap-1">
            <span className="text-status-success">↑</span> High Potential
          </p>
        </div>

        {/* Decay Factor */}
        <div className="space-y-2 pt-4 border-t border-border-inverse">
          <p className="text-sm text-text-disabled">Decay Factor</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-status-warning">0.91</span>
            <span className="text-xs text-status-error">-9%</span>
          </div>
          <p className="text-xs text-text-muted">Last active 5 days ago</p>
        </div>

        {/* Stage Progress */}
        <div className="space-y-2 pt-4 border-t border-border-inverse">
          <div className="flex items-center justify-between min-w-0">
            <p className="text-sm text-text-disabled shrink-0">Stage Progress</p>
            <span className="text-xs text-status-warning font-semibold shrink-0">
              42% to Beta
            </span>
          </div>
          <div className="w-full h-2 bg-surface-inverse-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-cyan-500"
              style={{ width: "42%" }}
            />
          </div>
        </div>

        {/* 30-Day Velocity */}
        <div className="space-y-3 pt-4 border-t border-border-inverse">
          <p className="text-sm text-text-disabled">30-DAY VELOCITY</p>
          <div className="flex items-end justify-between h-12 gap-1 w-full min-w-0">
            <div className="flex-1 h-full bg-status-success rounded min-w-0" />
            <div className="flex-1 h-full bg-status-warning rounded min-w-0" />
            <div className="flex-1 h-full bg-status-error rounded min-w-0" />
            <div className="flex-1 h-full bg-status-success-soft rounded min-w-0" />
          </div>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-status-success" aria-hidden="true" /> Week 4 recovery +12 GSIS
          </p>
        </div>

        {/* Next Milestone */}
        <div className="space-y-3 pt-4 border-t border-border-inverse">
          <p className="text-xs text-text-disabled uppercase font-semibold">
            Next Milestone
          </p>
          <div className="flex items-center gap-2 min-w-0">
            <Gem className="h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                First paying customer
              </p>
              <p className="text-xs text-text-muted">~14 days away</p>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <Info className="h-3.5 w-3.5 text-status-warning" aria-hidden="true" /> Platform estimate based on velocity
          </p>
        </div>
      </div>
    </aside>
  );
};

export default MomentumWall;
