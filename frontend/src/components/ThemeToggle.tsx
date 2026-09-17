import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** "fixed" = floating pill fixed bottom-right (default); "inline" = fits inside a header/nav bar */
  variant?: "fixed" | "inline";
  className?: string;
}

export function ThemeToggle({ variant = "fixed", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors overflow-hidden",
          isDark
            ? "bg-white/[0.05] border-white/10 text-[#58a6ff] hover:bg-[#0066ff]/20 hover:border-[#0066ff]/40 shadow-[0_0_12px_rgba(0,102,255,0.2)]"
            : "bg-[#f5f8ff] border-black/[0.05] text-[#171330]/60 hover:text-[#0066ff] hover:border-[#0066ff]/25",
          className,
        )}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </motion.span>
        </AnimatePresence>
      </button>
    );
  }

  // variant === "fixed" — floating button fixed bottom-right
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "fixed bottom-5 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full border shadow-lg transition-colors",
        isDark
          ? "bg-[#181818] border-white/10 text-[#58a6ff] hover:bg-[#0066ff]/20 hover:border-[#0066ff]/40 shadow-[0_4px_20px_rgba(0,102,255,0.25)]"
          : "bg-white border-black/[0.08] text-[#171330]/70 hover:text-[#0066ff] hover:border-[#0066ff]/20 shadow-[0_4px_16px_rgba(23,19,48,0.12)]",
        className,
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
