import { Search } from 'lucide-react';

export function ZoneSwitcher({ active, onChange, onSearch }: { active: string; onChange: (zone: string) => void; onSearch?: () => void }) {
  const zones = ['For You', 'Following', 'Startups', 'Funding', 'Hackathons', 'Organizations', 'Learning', 'AI Recommendations'];
  return (
    <div className="sticky top-14 bg-surface-primary border-b border-border-default h-12 flex items-center gap-6 px-4 sm:px-6 z-40">
      <div className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto">
      {zones.map((zone) => (
        <button key={zone} onClick={() => onChange(zone)} className={`relative h-full text-sm font-medium transition-colors whitespace-nowrap ${active === zone ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
          {zone}
          {active === zone && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"></div>}
        </button>
      ))}
      </div>
      {onSearch && <button type="button" onClick={onSearch} aria-label="Search feed" title="Search people, startups, projects, ideas, and opportunities" className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-primary text-text-secondary hover:border-accent-primary hover:text-accent-primary"><Search className="h-4 w-4" /></button>}
    </div>
  );
}
