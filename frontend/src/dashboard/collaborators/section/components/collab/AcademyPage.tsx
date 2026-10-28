import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { Academy } from "@/dashboard/_shared/academy/Academy";
import { roleDashboardPath } from "@/lib/roleRoutes";

export function AcademyPage() {
  const navigate = useNavigate();
  const { collaboratorProfile } = useCollaboratorProfile();
  const firstName = collaboratorProfile.name.split(" ")[0];

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="px-6 lg:px-8 pt-6">
        <button
          onClick={() => {
            navigate(roleDashboardPath.collaborator);
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#111111] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>
      <div className="flex-1">
        {/* Collaborator role only ever sees the collaborator track */}
        <Academy role="collaborator" userName={firstName} />
      </div>
    </div>
  );
}
