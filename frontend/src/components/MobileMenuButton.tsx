import { Menu } from "lucide-react";
import { useSidebar } from "../contexts/SidebarContext";

export default function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="app-touch-target md:hidden items-center justify-center rounded-lg bg-card border border-border text-foreground hover:bg-accent transition-colors"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
