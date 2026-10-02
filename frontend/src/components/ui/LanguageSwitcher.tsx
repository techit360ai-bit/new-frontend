import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { useLocale, LOCALES, type LocaleCode } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** When true (on transparent hero), uses light/white styling */
  light?: boolean;
  variant?: string;
  className?: string;
}

export default function LanguageSwitcher({ light = false, className }: LanguageSwitcherProps) {

  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative font-bricolage">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select language"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all",
          light
            ? "text-white/90 hover:text-white hover:bg-white/10"
            : "text-[#171330] dark:text-white hover:text-[#0068ff] dark:hover:text-[#58a6ff] hover:bg-gray-100/80 dark:hover:bg-white/10"
        )}
      >
        <Globe className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{locale.flag}&nbsp;{locale.nativeLabel}</span>
        <span className="sm:hidden">{locale.flag}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden z-[200]"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-400">Language & Currency</p>
            </div>

            {/* Options */}
            <div className="py-1.5 max-h-72 overflow-y-auto custom-scrollbar">
              {LOCALES.map((loc) => {
                const isActive = locale.code === loc.code;
                return (
                  <button
                    key={loc.code}
                    type="button"
                    onClick={() => {
                      setLocale(loc.code as LocaleCode);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06] group",
                      isActive && "bg-[#0068ff]/5 dark:bg-[#0068ff]/15"
                    )}
                  >
                    {/* Flag */}
                    <span className="text-xl w-7 text-center shrink-0">{loc.flag}</span>

                    {/* Labels */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm font-bold leading-none transition-colors",
                        isActive
                          ? "text-[#0068ff] dark:text-[#58a6ff]"
                          : "text-[#171330] dark:text-white group-hover:text-[#0068ff] dark:group-hover:text-[#58a6ff]"
                      )}>
                        {loc.nativeLabel}
                        <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-400">({loc.label})</span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <span>{loc.currencySymbol}</span>
                        <span>{loc.currencyCode}</span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span>{loc.currency}</span>
                      </div>
                    </div>

                    {/* Active check */}
                    {isActive && (
                      <div className="h-5 w-5 rounded-full bg-[#0068ff] flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              <p className="text-[10px] text-gray-400 dark:text-gray-400 leading-relaxed">
                🌍 Language auto-detected from your location. You can change it anytime.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
