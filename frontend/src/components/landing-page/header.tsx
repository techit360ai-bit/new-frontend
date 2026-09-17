import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import TechITLogo from "../ui/TechITLogo";
import LandingButton from "../ui/landing-btn";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Header() {
  const { locale } = useLocale();
  const { header: { navLinks, loginButton, registerButton } } = getTranslations(locale.code);
  const { resolvedTheme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 font-bricolage ${
        isScrolled ? "py-4" : "py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`flex items-center justify-between transition-all duration-300 rounded-full ${
            isScrolled
              ? "bg-white/80 dark:bg-[#111111]/80 backdrop-blur-md shadow-lg px-6 py-3 border border-gray-100 dark:border-white/10"
              : "bg-transparent px-0 py-0"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 z-50">
            <div className="w-10 h-10 relative">
              <AnimatePresence mode="wait">
                {isScrolled ? (
                  <motion.div
                    key="dark"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <TechITLogo />
                  </motion.div>
                ) : (
                  <motion.div
                    key="light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <TechITLogo />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className={`font-black text-xl tracking-tight transition-colors ${isScrolled ? "text-[#171330] dark:text-white" : "text-white"}`}>
              TechIT
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className={`text-sm font-bold transition-colors hover:opacity-100 ${
                  isScrolled ? "text-gray-600 dark:text-gray-300 hover:text-[#0068ff] dark:hover:text-[#0068ff]" : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {/* Language / Currency switcher */}
            <LanguageSwitcher light={!isScrolled} />

            {/* Dark mode switcher button */}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-full transition-colors border ${
                isScrolled
                  ? "border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
                  : "border-white/20 text-white hover:bg-white/10"
              }`}
              aria-label="Toggle dark mode"
              title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/signin"
              className={`text-sm font-bold transition-colors ${
                isScrolled ? "text-[#171330] dark:text-white hover:text-[#0068ff]" : "text-white hover:text-white/80"
              }`}
            >
              {loginButton}
            </Link>
            <LandingButton
              href="/signup"
              showRightArrow={false}
              className={isScrolled ? "bg-[#171330] dark:bg-white text-white dark:text-[#171330]" : "bg-white text-[#171330]"}
            >
              {registerButton}
            </LandingButton>
          </div>

          <button
            className={`md:hidden z-50 p-2 rounded-full ${isScrolled ? "bg-gray-100 dark:bg-white/10 text-[#171330] dark:text-white" : "bg-white/10 text-white"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-white/10 shadow-xl py-6 px-6 flex flex-col gap-6 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  className="text-lg font-bold text-[#171330] dark:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Theme</span>
                <button
                  type="button"
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 text-xs font-bold text-[#171330] dark:text-white"
                >
                  {resolvedTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Language</span>
                <LanguageSwitcher light={false} />
              </div>
              <Link
                to="/signin"
                className="text-lg font-bold text-center text-[#171330] dark:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {loginButton}
              </Link>
              <LandingButton
                href="/signup"
                showRightArrow={false}
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#0068ff] text-white justify-center w-full"
              >
                {registerButton}
              </LandingButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
