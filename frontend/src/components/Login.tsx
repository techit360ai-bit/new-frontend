import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { authRoleOnboardingPath, normalizeRole, roleForPath, roleSafeReturnPath } from "@/lib/roleRoutes";

const LOGIN_SLIDES = [
  "/auth/login1.jpg",
  "/auth/login2.avif",
  "/auth/login3.avif",
];

export default function Login() {
  const { signIn, profile, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % LOGIN_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      const profileRole = profile?.role ?? "founder";
      const dest =
        (!profile?.isOnboarded
          ? authRoleOnboardingPath(profileRole)
          : safePostLoginPath(from, profileRole, profile?.secondaryRoles));
      navigate(dest, { replace: true });
    }
  }, [user, profile, authLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(
        err.message.includes("Invalid")
          ? "Invalid email or password"
          : err.message,
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff] flex font-bricolage">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#171330] overflow-hidden flex-col justify-between p-12 lg:p-16">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0068ff]/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#0068ff]/20 blur-[100px] rounded-full" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-16 group">
            <div className="bg-white rounded-2xl px-4 py-2.5 shadow-lg group-hover:shadow-xl transition-all">
              <img src="/TechIT-logo.png" alt="TechIT Logo" className="h-9 object-contain" />
            </div>
          </Link>
          <h2 className="font-black text-5xl md:text-6xl text-white leading-[1.1] tracking-tight mb-6">
            Welcome
            <br />
            Back.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md font-medium">
            Your projects, your team, your investors — all waiting for you.
          </p>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-sm text-white/70 shadow-2xl">
            Live account and platform metrics become available after authentication.
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden bg-white z-20">
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={LOGIN_SLIDES[currentSlide]}
                alt="Login Background"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 z-10" />

        <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-20">
          <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <Link to="/" className="inline-flex group">
              <div className="bg-white rounded-2xl px-4 py-2.5 shadow-lg group-hover:shadow-xl transition-all">
                <img src="/TechIT-logo.png" alt="TechIT Logo" className="h-8 object-contain" />
              </div>
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="font-black text-4xl text-white tracking-tight mb-3 [text-shadow:0_2px_12px_rgba(0,0,0,0.8),0_1px_3px_rgba(0,0,0,0.9)]">Sign In</h1>
            <p className="text-white text-base font-medium [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-white font-bold underline underline-offset-2 hover:text-[#0068ff] transition-colors"
              >
                Create one free
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-[#0068ff] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white pl-12 pr-4 text-base font-medium text-[#171330] placeholder:text-gray-400 focus:outline-none focus:border-[#0068ff] focus:ring-4 focus:ring-[#0068ff]/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-white hover:text-[#0068ff] transition-colors [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-[#0068ff] transition-colors" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white pl-12 pr-12 text-base font-medium text-[#171330] placeholder:text-gray-400 focus:outline-none focus:border-[#0068ff] focus:ring-4 focus:ring-[#0068ff]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-[#0068ff] hover:bg-[#171330] hover:scale-[1.02] active:scale-95 text-white font-black text-lg flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(0,104,255,0.3)] hover:shadow-[0_10px_30px_rgba(23,19,48,0.3)] disabled:opacity-70 disabled:pointer-events-none mt-4"
            >
              {loading ? "Signing In..." : "Sign In"} <ArrowRight className="h-5 w-5" />
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function safePostLoginPath(
  from: string | undefined,
  profileRole: string,
  secondaryRoles: string[] | undefined,
) {
  if (from) {
    const fromRole = roleForPath(from);
    const availableRoles = [profileRole, ...(secondaryRoles ?? [])].map(normalizeRole);
    if (!fromRole || availableRoles.some((role) => role === fromRole)) return from;
  }

  return roleSafeReturnPath({
    currentPath: from ?? "",
    profileRole,
    secondaryRoles,
  });
}
