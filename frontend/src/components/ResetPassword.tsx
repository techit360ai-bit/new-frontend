import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function validatePassword(password: string) {
  const errors: string[] = [];
  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("one number");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("one special character");
  return { isValid: errors.length === 0, errors };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordErrors = useMemo(() => validatePassword(password).errors, [password]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const passwordValidation = validatePassword(password);
    if (!email.trim() || !token.trim()) {
      setError("Email and reset token are required");
      return;
    }
    if (!passwordValidation.isValid) {
      setError(`Password must contain: ${passwordValidation.errors.join(", ")}`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.error || "Password reset failed");
      setMessage(json.message || "Password reset successfully");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[color:var(--primary)] to-brand-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">TECHIT NETWORK</span>
        </Link>

        <div className="mb-8">
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
          <h1 className="font-bold text-3xl tracking-tight">Set New Password</h1>
          <p className="text-[color:var(--muted-foreground)] text-sm mt-2">
            Complete your password reset with the token from your email.
          </p>
        </div>

        {message && (
          <div className="mb-4 p-4 rounded-xl bg-status-success/10 border border-status-success/30 text-sm text-status-success">
            {message}{" "}
            <Link to="/signin" className="font-medium underline">
              Sign in
            </Link>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-sm text-status-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--input)] pl-10 pr-4 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
              Reset Token
            </label>
            <div className="relative">
              <KeyRound className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Reset token"
                required
                autoComplete="one-time-code"
                className="w-full h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--input)] pl-10 pr-4 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
              New Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                required
                autoComplete="new-password"
                className="w-full h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--input)] pl-10 pr-10 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Needs {passwordErrors.join(", ")}.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                required
                autoComplete="new-password"
                className="w-full h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--input)] pl-10 pr-4 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] transition-all"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
