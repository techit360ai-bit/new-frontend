import { NavLink, Outlet } from "react-router-dom";
import { Gauge } from "lucide-react";

const tabs = [
  { name: "Cohort Health", path: "/org/intelligence/cohort-health" },
  { name: "Impact", path: "/org/intelligence/impact" },
  { name: "Demo Day", path: "/org/intelligence/demo-day" },
];

export function OrgIntelligenceLayout() {
  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-indigo-50 p-2.5">
          <Gauge className="h-6 w-6 text-indigo-600" />
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
                  ? "border-indigo-600 text-indigo-600"
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
