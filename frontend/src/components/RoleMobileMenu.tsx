import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useMobileChromeVisibility } from "@/components/mobile/useMobileChromeVisibility";

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
  primaryItems?: RoleMobileMenuItem[];
  backPath: string;
  backLabel?: string;
  onToggle: () => void;
  onNavigate: () => void;
  headerActions?: ReactNode;
}

/** Shared mobile shell for role workspaces. Content remains driven by each
 * role's existing navigation configuration and permissions. */
export function RoleMobileMenu({
  brand,
  title,
  open,
  items,
  primaryItems = items.slice(0, 5),
  backPath,
  backLabel = "Back to TechIT",
  onToggle,
  onNavigate,
  headerActions,
}: RoleMobileMenuProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chromeVisible = useMobileChromeVisibility(open);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onToggle();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      (previousFocus ?? trigger)?.focus();
    };
  }, [onToggle, open]);

  return (
    <>
      <header className={cn("app-safe-area-top fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur transition-transform duration-200 lg:hidden", !chromeVisible && !open && "-translate-y-full pointer-events-none")}>
        <div className="flex min-h-14 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{brand}</p>
            <p className="truncate text-xs text-muted-foreground">{title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              ref={triggerRef}
              type="button"
              onClick={onToggle}
              className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground motion-reduce:transition-none"
              style={{ transitionDuration: "var(--app-motion-duration)" }}
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {headerActions}
          </div>
        </div>
      </header>

      <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-40 bg-background pt-14 lg:hidden"
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
      <nav
        aria-label={`${title} quick navigation`}
        className={cn("app-safe-area-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur transition-transform duration-200 lg:hidden", !chromeVisible && !open && "translate-y-full pointer-events-none")}
      >
        {primaryItems.slice(0, 5).map(({ label, path, icon: Icon, active, disabled, badge }) => (
          disabled ? (
            <span key={`${path}-${label}`} aria-disabled="true" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[10px] text-muted-foreground/50">
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{badge || label}</span>
            </span>
          ) : (
            <Link key={`${path}-${label}`} to={path} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          )
        ))}
      </nav>
    </>
  );
}
