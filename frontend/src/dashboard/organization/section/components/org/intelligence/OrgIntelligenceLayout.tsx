import { NavLink, Outlet } from "react-router-dom";
import { Gauge } from "lucide-react";

const tabs = [
  { name: "Cohort Health", path: "/org/intelligence/cohort-health" },
  { name: "Impact", path: "/org/intelligence/impact" },
  { name: "Demo Day", path: "/org/intelligence/demo-day" },
  { name: "Allocation", path: "/org/intelligence/allocation" },
  { name: "Alumni", path: "/org/intelligence/alumni" },
  { name: "Benchmarks", path: "/org/intelligence/benchmarks" },
];

export function OrgIntelligenceLayout() {
  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-6 transition-colors">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#20C997]/10 border border-[#20C997]/20 p-2.5">
          <Gauge className="h-6 w-6 text-[#20C997]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Intelligence</h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Portfolio health, impact, and demo-day readiness across your startups.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-black/[0.06] dark:border-white/10 pb-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "border-[#20C997] text-[#20C997]"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
