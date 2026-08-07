import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  X,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

type Role = "founder" | "collaborator" | "investor" | "organisation";

// Enhanced Toast Component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
    error: "bg-red-500/10 border-red-500/30 text-red-500",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-500",
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 p-4 rounded-xl border backdrop-blur-sm animate-in slide-in-from-top-2",
        colors[type],
      )}
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">{message}</p>
        <button onClick={onClose} className="ml-4 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const ROLES: { id: Role; label: string; desc: string }[] = [
  { id: "founder", label: "Founder", desc: "Launch startups & find your team" },
  {
    id: "collaborator",
    label: "Collaborator",
    desc: "Join projects & earn credits",
  },
  { id: "investor", label: "Investor", desc: "Discover & fund startups" },
  {
    id: "organisation",
    label: "Organisation",
    desc: "Find talent & post challenges",
  },
];

// Validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (
  password: string,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("one number");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push("one special character");

  return { isValid: errors.length === 0, errors };
};

const getSetupPath = (role: Role) => {
  if (role === "organisation") return "/org/setup";
  return `/${role}/setup`;
};

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = digits
      .map((current, currentIndex) =>
        currentIndex === index ? digit : current,
      )
      .join("")
      .slice(0, 6);

    onChange(next);
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      onChange(
        digits
          .map((current, currentIndex) =>
            currentIndex === index - 1 ? "" : current,
          )
          .join(""),
      );
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index] || ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          disabled={disabled}
          className={cn(
            "h-14 w-12 rounded-xl border-2 bg-[color:var(--input)] text-center text-xl font-bold text-[color:var(--foreground)] transition-all",
            "focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed",
            digits[index]
              ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
              : "border-[color:var(--border)]",
          )}
        />
      ))}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [otpError, setOtpError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "founder" as Role,
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  // Memoized password validation (computed, not set)
  const passwordErrors = useMemo(() => {
    if (form.password) {
      const { errors } = validatePassword(form.password);
      return errors;
    }
    return [];
  }, [form.password]);

  // Memoized validation for canNext to prevent unnecessary recalculation
  const canNext = useMemo(() => {
    if (step === 1) {
      return (
        form.firstName.trim().length >= 2 && form.lastName.trim().length >= 2
      );
    } else if (step === 2) {
      return validateEmail(form.email);
    } else if (step === 3) {
      return otpVerified;
    } else {
      return (
        form.password.length >= 8 &&
        form.password === form.confirmPassword &&
        form.agreeTerms &&
        validatePassword(form.password).isValid
      );
    }
  }, [
    step,
    form.firstName,
    form.lastName,
    form.email,
    form.password,
    form.confirmPassword,
    form.agreeTerms,
    otpVerified,
  ]);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const sendOtp = useCallback(async () => {
    setLoading(true);
    setOtpError("");
    setOtpCode("");
    setOtpVerified(false);
    setEmailVerificationToken("");

    try {
      const response = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const json = await response.json();

      if (!response.ok) {
        if (response.status === 429) startCooldown(json.retryAfter || 60);
        setToast({
          message: json.error || "Failed to send verification code",
          type: "error",
        });
        return;
      }

      setToast({
        message: `Verification code sent to ${form.email}`,
        type: "success",
      });
      startCooldown(60);
      setStep(3);
    } catch {
      setToast({
        message: "Network error. Is the server running?",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [form.email, startCooldown]);

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Enter the full 6-digit code");
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      const response = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: otpCode }),
      });
      const json = await response.json();

      if (!response.ok) {
        setOtpError(json.error || "Incorrect code");
        return;
      }

      if (!json.verificationToken) {
        setOtpError("Verification completed, but the server did not return a signup token.");
        return;
      }

      setEmailVerificationToken(json.verificationToken);
      setOtpVerified(true);
      setToast({
        message: "Email verified. Set your password.",
        type: "success",
      });
      setStep(4);
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goNext = async () => {
    if (step === 1) {
      if (form.firstName.trim().length < 2) {
        setToast({
          message: "First name must be at least 2 characters",
          type: "error",
        });
        return;
      }
      if (form.lastName.trim().length < 2) {
        setToast({
          message: "Last name must be at least 2 characters",
          type: "error",
        });
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateEmail(form.email)) {
        setToast({
          message: "Please enter a valid email address",
          type: "error",
        });
        return;
      }
      await sendOtp();
    }
  };

  const handleSubmit = async () => {
    if (!otpVerified || !emailVerificationToken) {
      setToast({ message: "Please verify your email first", type: "error" });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }

    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      setToast({
        message: `Password must contain: ${passwordValidation.errors.join(", ")}`,
        type: "error",
      });
      return;
    }

    if (!form.agreeTerms) {
      setToast({
        message: "Please agree to the Terms of Service",
        type: "error",
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: "",
      country: "",
      countryCode: "",
      role: form.role,
      emailVerificationToken,
    });

    if (error) {
      setToast({ message: error.message, type: "error" });
      setLoading(false);
      return;
    }

    setLoading(false);
    setToast({
      message: "Account created successfully! Redirecting...",
      type: "success",
    });
    setTimeout(() => {
      navigate(getSetupPath(form.role));
    }, 1200);
  };

  const inputCls =
    "w-full h-10 rounded-xl border border-[color:var(--border)] bg-[color:var(--input)] px-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[color:var(--background)] flex">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Left decorative */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-[color:var(--primary)]/15 via-blue-500/8 to-[color:var(--background)] overflow-hidden flex-col justify-between p-12">
        <div className="orb orb-violet w-[400px] h-[400px] -top-20 -left-20 absolute" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-12">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[color:var(--primary)] to-blue-400 flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold leading-none">TECHIT</div>
              <div className="font-mono text-[0.6rem] text-[color:var(--primary)] tracking-widest">
                NETWORK
              </div>
            </div>
          </Link>
          <h2 className="font-bold text-4xl leading-tight tracking-tight mb-3">
            Build.
            <br />
            Connect.
            <br />
            Ship.
          </h2>
          <p className="text-[color:var(--muted-foreground)] text-sm leading-relaxed max-w-xs">
            Join the global network where founders find co-builders, investors
            discover deals, and experts build their legacy.
          </p>
        </div>
        <div className="relative z-10 p-5 rounded-2xl bg-[color:var(--card)]/60 border border-[color:var(--border)] backdrop-blur">
          <p className="text-sm text-[color:var(--muted-foreground)] italic leading-relaxed mb-4">
            "Found my technical co-founder in 3 days through TechIT. The AI
            matching is unlike anything else."
          </p>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
              AK
            </div>
            <div>
              <div className="text-sm font-semibold">Amara Kone</div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Founder · Lagos · Seed Funded
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[color:var(--primary)] to-blue-400 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">TECHIT NETWORK</span>
          </Link>

          <div className="mb-8">
            <h1 className="font-bold text-3xl tracking-tight">
              Create Account
            </h1>
            <p className="text-[color:var(--muted-foreground)] text-sm mt-2">
              Already a member?{" "}
              <Link
                to="/signin"
                className="text-[color:var(--primary)] font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, index) => index + 1).map((n) => (
              <div
                key={n}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-500",
                  n < step
                    ? "bg-emerald-500"
                    : n === step
                      ? "bg-[color:var(--primary)]"
                      : "bg-[color:var(--muted)]",
                )}
              />
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="font-mono text-xs text-[color:var(--primary)] uppercase tracking-widest">
                Step 01 — Your Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="First Name"
                    className={inputCls}
                    disabled={loading}
                  />
                  {form.firstName && form.firstName.length < 2 && (
                    <p className="text-xs text-red-500 mt-1">
                      Minimum 2 characters
                    </p>
                  )}
                </div>
                <div>
                  <input
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Last Name"
                    className={inputCls}
                    disabled={loading}
                  />
                  {form.lastName && form.lastName.length < 2 && (
                    <p className="text-xs text-red-500 mt-1">
                      Minimum 2 characters
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={goNext}
                disabled={!canNext || loading}
                className="w-full h-10 rounded-xl bg-[color:var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="font-mono text-xs text-[color:var(--primary)] uppercase tracking-widest">
                Step 02 — Role & Email
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => set("role", role.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      form.role === role.id
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10"
                        : "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--primary)]/40",
                    )}
                    disabled={loading}
                  >
                    <div className="text-sm font-semibold">{role.label}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                      {role.desc}
                    </div>
                    {form.role === role.id && (
                      <div className="mt-2 h-4 w-4 rounded-full bg-[color:var(--primary)] flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="Email Address"
                  className={inputCls}
                  disabled={loading}
                />
                {form.email && !validateEmail(form.email) && (
                  <p className="text-xs text-red-500 mt-1">
                    Enter a valid email address
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-12 flex-shrink-0 px-0 justify-center h-10 rounded-xl border border-[color:var(--border)] bg-[color:var(--input)] hover:bg-[color:var(--muted)] disabled:opacity-50 transition-all"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goNext}
                  disabled={!canNext || loading}
                  className="flex-1 h-10 rounded-xl bg-[color:var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? "Sending..." : "Send Verification Code"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[color:var(--primary)]/15 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-[color:var(--primary)]" />
                </div>
                <div>
                  <p className="font-mono text-xs text-[color:var(--primary)] uppercase tracking-widest">
                    Step 03 — Verify Email
                  </p>
                  <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                    Code sent to{" "}
                    <span className="font-medium text-[color:var(--foreground)]">
                      {form.email}
                    </span>
                  </p>
                </div>
              </div>

              <OtpInput
                value={otpCode}
                onChange={(value) => {
                  setOtpCode(value);
                  setOtpError("");
                }}
                disabled={loading || otpVerified}
              />

              {otpError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {otpError}
                </div>
              )}

              {otpVerified && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-500">
                  <Check className="h-4 w-4 flex-shrink-0" />
                  Email verified successfully.
                </div>
              )}

              <button
                onClick={verifyOtp}
                disabled={otpCode.length !== 6 || loading || otpVerified}
                className="w-full h-10 rounded-xl bg-[color:var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Verifying..." : otpVerified ? "Verified" : "Verify Code"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                  disabled={loading}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Wrong email?
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={sendOtp}
                  className="flex items-center gap-1.5 text-[color:var(--primary)] hover:opacity-80 disabled:text-[color:var(--muted-foreground)] disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5", loading && "animate-spin")}
                  />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="font-mono text-xs text-[color:var(--primary)] uppercase tracking-widest">
                Step 04 — Secure Your Account
              </p>
              <div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Password (min. 8 chars)"
                    className={cn(inputCls, "pr-10")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                    disabled={loading}
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.password && passwordErrors.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-600 mb-1">
                      Password must contain:
                    </p>
                    <ul className="text-xs text-yellow-600 space-y-0.5">
                      {passwordErrors.map((err) => (
                        <li key={err}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Confirm Password"
                  className={inputCls}
                  disabled={loading}
                />
                {form.confirmPassword &&
                  form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() =>
                    !loading && set("agreeTerms", !form.agreeTerms)
                  }
                  className={cn(
                    "mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all",
                    form.agreeTerms
                      ? "bg-[color:var(--primary)] border-[color:var(--primary)]"
                      : "border-[color:var(--border)]",
                    !loading && "cursor-pointer",
                  )}
                >
                  {form.agreeTerms && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm text-[color:var(--muted-foreground)] leading-relaxed">
                  I agree to the{" "}
                  <a
                    href="/terms-of-service.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--primary)] hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy-policy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--primary)] hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-12 flex-shrink-0 px-0 justify-center h-10 rounded-xl border border-[color:var(--border)] bg-[color:var(--input)] hover:bg-[color:var(--muted)] disabled:opacity-50 transition-all"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canNext || loading}
                  className="flex-1 h-10 rounded-xl bg-[color:var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .slide-in-from-top-2 {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
