import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface RoleMobileMenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
}

interface RoleMobileMenuProps {
  brand: string;
  title: string;
  open: boolean;
  items: RoleMobileMenuItem[];
  backPath: string;
  backLabel?: string;
  onToggle: () => void;
  onNavigate: () => void;
}

/** Shared mobile shell for role workspaces. Content remains driven by each
 * role's existing navigation configuration and permissions. */
export function RoleMobileMenu({
  brand,
  title,
  open,
  items,
  backPath,
  backLabel = "Back to TechIT",
  onToggle,
  onNavigate,
}: RoleMobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onToggle();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onToggle, open]);

  return (
    <>
      <header className="app-safe-area-top fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{brand}</p>
            <p className="truncate text-xs text-muted-foreground">{title}</p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-40 bg-background pt-16 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} navigation`}
        >
          <motion.nav
            initial={{ x: 18 }}
            animate={{ x: 0 }}
            exit={{ x: 18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="app-safe-area-bottom h-full overflow-y-auto px-4 py-4"
          >
            <div className="space-y-1">
              {items.map(({ label, path, icon: Icon, active, disabled, badge }) =>
                disabled ? (
                  <div
                    key={`${path}-${label}`}
                    className="app-nav-link flex items-center gap-3 px-3 text-sm text-muted-foreground/60"
                    aria-disabled="true"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {badge && <span className="text-[10px] uppercase tracking-wide">{badge}</span>}
                  </div>
                ) : (
                  <Link
                    key={`${path}-${label}`}
                    to={path}
                    onClick={onNavigate}
                    className={cn(
                      "app-nav-link flex items-center gap-3 px-3 text-sm font-medium",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </Link>
                ),
              )}
            </div>
            <Link
              to={backPath}
              onClick={onNavigate}
              className="app-nav-link mt-5 flex items-center gap-3 border-t border-border px-3 pt-5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              {backLabel}
            </Link>
          </motion.nav>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
