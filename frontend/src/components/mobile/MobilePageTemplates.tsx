import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobilePage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("app-mobile-page min-h-full px-4 pb-24 pt-5 sm:px-6", className)}>{children}</div>;
}

export function MobilePageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <header className="mb-5 flex items-start justify-between gap-3"><div className="min-w-0"><h1 className="truncate text-xl font-semibold text-foreground">{title}</h1>{description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</header>;
}

export function MobileSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="mb-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">{title}</h2>{action}</div>{children}</section>;
}

export function MobileBottomSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => sheetRef.current?.querySelector<HTMLElement>('button, select, input, a[href]')?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;
  const titleId = `mobile-sheet-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className="absolute inset-0 bg-black/45" aria-label="Close sheet" onClick={onClose} />
      <div
        ref={sheetRef}
        className="app-safe-area-bottom absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-2xl"
        onTouchStart={(event) => { startYRef.current = event.touches[0]?.clientY ?? null; }}
        onTouchEnd={(event) => {
          const startY = startYRef.current;
          const endY = event.changedTouches[0]?.clientY;
          startYRef.current = null;
          if (startY !== null && endY !== undefined && endY - startY > 80) onClose();
        }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-base font-semibold text-foreground">{title}</h2>
          <button type="button" className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={onClose} aria-label="Close sheet"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
