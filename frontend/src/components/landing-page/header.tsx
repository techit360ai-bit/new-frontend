import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import StackMenuOrangeLogo from "../ui/StackMenuOrangeLogo";
import StackMenuWhiteLogo from "../ui/StackMenuWhiteLogo";
import LandingButton from "../ui/landing-btn";
import { getTranslations } from "@/app/lib/i18n";
import { Menu, X } from "lucide-react";

export default function Header() {
  const { header: { navLinks, loginButton, registerButton } } = getTranslations();
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
              ? "bg-white/80 backdrop-blur-md shadow-lg px-6 py-3 border border-gray-100"
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
                    <StackMenuOrangeLogo />
                  </motion.div>
                ) : (
                  <motion.div
                    key="light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <StackMenuWhiteLogo />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className={`font-black text-xl tracking-tight transition-colors ${isScrolled ? "text-text-dark" : "text-white"}`}>
              TechIT
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className={`text-sm font-bold transition-colors hover:opacity-100 ${
                  isScrolled ? "text-gray-600 hover:text-primary-orange" : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/auth/login"
              className={`text-sm font-bold transition-colors ${
                isScrolled ? "text-text-dark hover:text-primary-orange" : "text-white hover:text-white/80"
              }`}
            >
              {loginButton}
            </Link>
            <LandingButton
              href="/auth/signup"
              showRightArrow={false}
              className={isScrolled ? "bg-bg-black-btn-bg text-white" : "bg-white text-bg-black-btn-bg"}
            >
              {registerButton}
            </LandingButton>
          </div>

          <button
            className={`md:hidden z-50 p-2 rounded-full ${isScrolled ? "bg-gray-100 text-text-dark" : "bg-white/10 text-white"}`}
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
            className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl py-6 px-6 flex flex-col gap-6 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  className="text-lg font-bold text-text-dark"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
              <Link
                to="/auth/login"
                className="text-lg font-bold text-center text-text-dark"
                onClick={() => setMobileMenuOpen(false)}
              >
                {loginButton}
              </Link>
              <LandingButton
                href="/auth/signup"
                showRightArrow={false}
                onClick={() => setMobileMenuOpen(false)}
                className="bg-primary-orange text-white justify-center w-full"
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
