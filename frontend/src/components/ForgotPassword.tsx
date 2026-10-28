import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Mail, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
// you may need to import the slideshow images
const SLIDES = [
  "/auth/login1.jpg",
  "/auth/login2.avif",
  "/auth/login3.avif",
];

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto‑rotate background slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setResetUrl("");
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.error || "Password reset failed");
      setMessage(json.message || "If an account exists, a reset link has been sent.");
      setResetUrl(json.resetUrl || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 font-bricolage relative overflow-hidden bg-[#171330]">
      {/* Background slideshow */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <img
            src={SLIDES[currentSlide]}
            alt="Background"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-[#171330]/60 z-0" />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[36px] p-8 shadow-2xl"
      >
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-lg">
            <img src="/TechIT-logo.png" alt="TechIT" className="h-6 object-contain" />
          </div>
          <span className="font-black text-xl text-white tracking-tight">TechIT</span>
        </Link>

        <div className="mb-8">
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
          <h1 className="font-black text-3xl text-white tracking-tight drop-shadow-sm">
            Reset Password
          </h1>
          <p className="text-white/80 text-sm mt-2">
            Enter your email and we'll send password reset instructions.
          </p>
        </div>

        {message && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-sm text-white backdrop-blur-sm">
            {message}
            {resetUrl && (
              <Link
                to={resetUrl.replace(window.location.origin, "")}
                className="mt-2 block font-bold underline underline-offset-2 hover:text-emerald-300"
              >
                Open local reset form
              </Link>
            )}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400/40 text-sm text-white backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-widest text-white/80">
              Email Address
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-12 rounded-2xl border border-white/20 bg-white/10 pl-12 pr-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:border-transparent transition-all backdrop-blur-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 rounded-2xl bg-[#0068ff] hover:bg-[#171330] text-white font-black text-base shadow-[0_10px_30px_rgba(0,104,255,0.4)] hover:shadow-lg transition-all group"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}