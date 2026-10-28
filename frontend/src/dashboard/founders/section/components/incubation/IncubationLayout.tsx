import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Brain, Rocket, Trophy, GraduationCap } from "lucide-react";
import { useFounderProfile } from "@/contexts/UserContext";
import { MainIncubationPanel } from "./MainIncubationPanel";
import { FastTrackPanel } from "./FastTrackPanel";
import { HackathonPanel } from "./HackathonPanel";
import { Academy } from "@/dashboard/_shared/academy/Academy";
import { CustomerValidationPanel } from "./CustomerValidationPanel";

type Panel = "main" | "fast-track" | "hackathon" | "learn";

export default function IncubationLayout() {
  const [searchParams] = useSearchParams();
  const initialPanel: Panel =
    searchParams.get("validationSession")
      ? "main"
      : searchParams.get("panel") === "fast-track"
      ? "fast-track"
      : searchParams.get("panel") === "hackathon"
      ? "hackathon"
      : searchParams.get("panel") === "learn"
      ? "learn"
      : "main";
  const [panel, setPanel] = useState<Panel>(initialPanel);

  const { founderProfile } = useFounderProfile();
  const registrationCount = useMemo(
    () => founderProfile.hackathonRegistrations.length,
    [founderProfile.hackathonRegistrations.length],
  );

  return (
    <div className="app-incubation-layout flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-col md:h-full md:flex-row font-bricolage bg-slate-50 dark:bg-[#0a0a0a]">
      <aside className="flex w-full shrink-0 flex-row items-stretch gap-2 overflow-x-auto border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-2 md:w-20 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:py-4 transition-colors duration-200">
        <SidebarPill
          label="Main"
          icon={<Brain className="w-5 h-5" />}
          active={panel === "main"}
          onClick={() => setPanel("main")}
        />
        <SidebarPill
          label="Track"
          icon={<Rocket className="w-5 h-5" />}
          active={panel === "fast-track"}
          onClick={() => setPanel("fast-track")}
        />
        <SidebarPill
          label="Hack"
          icon={<Trophy className="w-5 h-5" />}
          active={panel === "hackathon"}
          onClick={() => setPanel("hackathon")}
          badge={registrationCount > 0 ? registrationCount : undefined}
        />
        <SidebarPill
          label="Learn"
          icon={<GraduationCap className="w-5 h-5" />}
          active={panel === "learn"}
          onClick={() => setPanel("learn")}
        />
      </aside>
      <div className="min-w-0 flex-1">
        {panel === "main" && <MainIncubationPanel />}
        {panel === "main" && <div className="px-4 pb-8 md:px-6"><CustomerValidationPanel /></div>}
        {panel === "fast-track" && <FastTrackPanel />}
        {panel === "hackathon" && <HackathonPanel />}
        {panel === "learn" && <Academy role="founder" userName={founderProfile.name.split(" ")[0]} />}
      </div>
    </div>
  );
}

function SidebarPill({
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative mx-0 flex min-w-[72px] flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 md:mx-2 md:min-w-0 md:flex-none md:py-3.5 group ${
        active
          ? "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 shadow-sm"
          : "text-slate-500 dark:text-slate-400 hover:bg-[#20C997]/5 hover:text-[#20C997] border border-transparent"
      }`}
      aria-pressed={active}
      aria-label={label}
    >
      <div className={`transition-transform duration-200 group-hover:scale-110 ${active ? "text-[#20C997]" : ""}`}>
        {icon}
      </div>
      <span className="font-black text-[10px] tracking-wider">{label}</span>
      {badge !== undefined && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#20C997] text-slate-950 text-[10px] font-black flex items-center justify-center shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );
}
