import { useState } from "react";
import { Compass, Lightbulb, MessageCircle, Rocket, Search, Sparkles, Users, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { ContextSwitcher } from "@/components/context/ContextSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { RoleMobileMenu } from "@/components/RoleMobileMenu";

const destinations = [
  { href: "/feed", label: "Personalized Feed", icon: Compass, description: "See ideas, people, startups, and conversations relevant to you." },
  { href: "/feed/discover", label: "Discover", icon: Search, description: "Explore founders, collaborators, investors, organizations, and projects." },
  { href: "/feed/messages", label: "Messages", icon: MessageCircle, description: "Continue conversations where TechIT allows connection." },
  { href: "/demos", label: "Events and Hackathons", icon: CalendarDays, description: "Join challenges and meet people building around real problems." },
  { href: "/matches", label: "Opportunities", icon: Users, description: "Find places where your skills, interests, and time can create value." },
  { href: "/workspaces", label: "Learning and AI Guide", icon: Sparkles, description: "Learn the ecosystem and get contextual guidance." },
];

export default function ExplorerHome() {
  const { profile, activateRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const firstName = profile?.firstName || "there";
  const mobileItems = destinations.map(({ href, label, icon }) => ({ label, path: href, icon }));
  return <main className="min-h-screen bg-background pb-16 text-text-primary lg:pb-0">
    <RoleMobileMenu
      brand="TechIT Network"
      title="Explorer"
      open={mobileMenuOpen}
      onToggle={() => setMobileMenuOpen((value) => !value)}
      onNavigate={() => setMobileMenuOpen(false)}
      backPath="/"
      items={mobileItems}
      primaryItems={mobileItems.slice(0, 4)}
    />
    <header className="hidden border-b border-border-default bg-card/90 px-5 py-4 backdrop-blur lg:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary text-white"><Compass className="h-5 w-5" /></div><div><p className="text-sm font-semibold">TechIT Network</p><p className="text-xs text-text-muted">Explorer</p></div></div>
        <ContextSwitcher />
      </div>
    </header>
    <section className="mx-auto max-w-6xl px-5 pb-10 pt-24 lg:pt-12">
      <div className="max-w-2xl"><p className="text-sm font-medium text-accent-primary">Your place to start</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome, {firstName}.</h1><p className="mt-3 text-base leading-7 text-text-muted">Explore the people, ideas, startups, projects, communities, and opportunities where you can create value next.</p></div>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map(({ href, label, icon: Icon, description }) => <Link key={href} to={href} className="group rounded-lg border border-border-default bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-lg"><Icon className="h-5 w-5 text-accent-primary" /><h2 className="mt-4 text-base font-semibold">{label}</h2><p className="mt-2 text-sm leading-6 text-text-muted">{description}</p><span className="mt-4 inline-flex text-sm font-medium text-accent-primary">Open <span aria-hidden="true" className="ml-1 transition group-hover:translate-x-1">-&gt;</span></span></Link>)}
      </div>
      <section className="mt-10 border-t border-border-default pt-8"><div className="flex items-center gap-3"><Lightbulb className="h-5 w-5 text-amber-500" /><div><h2 className="text-lg font-semibold">Ready to participate?</h2><p className="text-sm text-text-muted">Activate a specialized mode only when it matches what you want to do.</p></div></div><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => void activateRole("founder")} className="inline-flex items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-sm font-medium hover:border-accent-primary"><Rocket className="h-4 w-4" /> Explore Founder mode</button><button type="button" onClick={() => void activateRole("collaborator")} className="inline-flex items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-sm font-medium hover:border-accent-primary"><Users className="h-4 w-4" /> Explore Collaborator mode</button></div></section>
    </section>
  </main>;
}
