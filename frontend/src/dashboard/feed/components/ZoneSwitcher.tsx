export function ZoneSwitcher({ active, onChange }: { active: string; onChange: (zone: string) => void }) {
  const zones = ["For You", "Following", "Startups", "Funding", "Hackathons", "Organizations", "Learning", "AI Recommendations"];

  return (
    <div className="sticky top-16 z-30 flex h-12 items-center gap-2 overflow-x-auto border-b border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/90 px-4 sm:px-6 backdrop-blur-xl font-bricolage scrollbar-none">
      {zones.map((zone) => {
        const isActive = active === zone;
        return (
          <button
            key={zone}
            type="button"
            onClick={() => onChange(zone)}
            className={`relative flex h-full items-center px-3 text-xs font-bold transition-all whitespace-nowrap ${
              isActive
                ? "text-[#20C997]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>{zone}</span>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#20C997]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
