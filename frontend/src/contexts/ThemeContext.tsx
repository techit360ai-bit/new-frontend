import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "techit-theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  } catch {
    return "system";
  }
};

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

function applyTheme(effective: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(effective);
  root.style.colorScheme = effective;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    const effective = stored === "system" ? getSystemTheme() : stored;
    applyTheme(effective);
    return stored;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (e) {
      console.warn("Failed to persist theme to localStorage", e);
    }
    const effective = next === "system" ? getSystemTheme() : next;
    setThemeState(next);
    setResolvedTheme(effective);
    applyTheme(effective);
  }, []);

  // Sync on theme state change
  useEffect(() => {
    const effective = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(effective);
    applyTheme(effective);
  }, [theme]);

  // Listen to system preference changes if in system mode
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const effective = mq.matches ? "dark" : "light";
      setResolvedTheme(effective);
      applyTheme(effective);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Sync with changes across tabs / storage events
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const val = e.newValue as Theme | null;
        if (val === "light" || val === "dark" || val === "system") {
          const effective = val === "system" ? getSystemTheme() : val;
          setThemeState(val);
          setResolvedTheme(effective);
          applyTheme(effective);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
