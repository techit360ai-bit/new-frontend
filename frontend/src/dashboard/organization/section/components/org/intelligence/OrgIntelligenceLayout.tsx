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
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-[#20C997]/10 p-2.5">
          <Gauge className="h-6 w-6 text-[#20C997]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intelligence</h1>
          <p className="mt-1 text-gray-600">
            Portfolio health, impact, and demo-day readiness across your startups.
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[#20C997] text-[#20C997]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
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
