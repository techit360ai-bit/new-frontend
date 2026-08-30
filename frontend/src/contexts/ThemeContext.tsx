import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { techITTheme } from "@/config/theme.config"

export type Theme = "light" | "dark" | "system"

const THEME_STORAGE_KEY = "techit-theme"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system"
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system"
}

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(effective: "light" | "dark") {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(effective)
}

function applyConfiguredTokens() {
  const root = document.documentElement
  const values: Record<string, string> = {
    '--techit-brand-primary': techITTheme.brand.primary,
    '--techit-brand-primary-hover': techITTheme.brand.primaryHover,
    '--techit-brand-secondary': techITTheme.brand.secondary,
    '--techit-brand-accent': techITTheme.brand.accent,
    '--techit-brand-premium': techITTheme.brand.premium,
    '--techit-status-success': techITTheme.status.success,
    '--techit-status-warning': techITTheme.status.warning,
    '--techit-status-error': techITTheme.status.error,
    '--techit-status-info': techITTheme.status.info,
    '--techit-status-pending': techITTheme.status.pending,
    '--techit-role-explorer': techITTheme.role.explorer,
    '--techit-role-founder': techITTheme.role.founder,
    '--techit-role-collaborator': techITTheme.role.collaborator,
    '--techit-role-investor': techITTheme.role.investor,
    '--techit-role-organization': techITTheme.role.organization,
  }
  for (const [name, value] of Object.entries(values)) root.style.setProperty(name, value)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme()
    const effective = stored === "system" ? getSystemTheme() : stored
    if (typeof document !== "undefined") { applyTheme(effective); applyConfiguredTokens() }
    return stored
  })
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    theme === "system" ? getSystemTheme() : theme
  )

  useEffect(() => {
    const effective = theme === "system" ? getSystemTheme() : theme
    setResolvedTheme(effective)
    applyTheme(effective)
    applyConfiguredTokens()
  }, [theme])

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const effective = mq.matches ? "dark" : "light"
      setResolvedTheme(effective)
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(effective)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    localStorage.setItem(THEME_STORAGE_KEY, next)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
