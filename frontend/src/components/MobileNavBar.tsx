import { Menu, X } from "lucide-react";

interface MobileNavBarProps {
  title: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
}

const MobileNavBar = ({
  title,
  isSidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
}: MobileNavBarProps) => {
  return (
    <div className="app-safe-area-top md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 flex min-h-16 items-center justify-between">
      <h1 className="font-semibold text-foreground text-sm truncate flex-1">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        {isSidebarOpen && (
          <button
            onClick={onCloseSidebar}
            className="app-touch-target inline-flex items-center justify-center hover:bg-accent rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        )}
        <button
          onClick={onToggleSidebar}
          className="app-touch-target inline-flex items-center justify-center hover:bg-accent rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MobileNavBar;
