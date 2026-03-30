import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import ufixiLogo from "@/assets/ufixi-logo.svg";
import GradientButton from "@/components/GradientButton";
import LavaLampBackground from "@/components/LavaLampBackground";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  const navy = "#00172F";
  const textSec = "#5A6A7A";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "forgot") {
      if (!email) {
        toast.error("Please enter your email");
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `https://ufixi.lovable.app/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for a password reset link");
        setMode("login");
      } catch (err: any) {
        toast.error(err.message || "Failed to send reset email");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: 'https://ufixi.lovable.app',
          },
        });
        if (error) throw error;
        if (data?.user && data.user.identities?.length === 0) {
          toast.error("An account with this email already exists. Try logging in.");
        } else {
          toast.success("Account created! Check your email for a verification link before logging in.");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Logged in!");
        navigate(redirect ? `/${redirect}` : "/home");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: "var(--color-bg)", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
      <LavaLampBackground />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4" style={{ minHeight: 64, paddingTop: "calc(var(--safe-top) + var(--app-header-offset))", paddingBottom: 12, paddingLeft: "calc(var(--safe-left) + 16px)", paddingRight: "calc(var(--safe-right) + 16px)" }}>
        <button onClick={() => mode === "forgot" ? setMode("login") : navigate("/")} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, color: navy }}>
          <ArrowLeft className="w-7 h-7" />
        </button>
        <img src={ufixiLogo} alt="Ufixi" className="h-7 object-contain" />
        <div style={{ minWidth: 44 }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-6">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: navy }}>
              {mode === "signup" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Welcome Back"}
            </h1>
            <p className="text-base" style={{ color: textSec }}>
              {mode === "signup"
                ? "Sign up to save diagnoses and track your issues"
                : mode === "forgot"
                ? "Enter your email and we'll send a reset link"
                : "Log in to your Ufixi account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold" style={{ color: navy }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSec }} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-2xl pl-11 pr-4 py-4 text-base"
                    style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: navy }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSec }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl pl-11 pr-4 py-4 text-base"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold" style={{ color: navy }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSec }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                    className="w-full rounded-2xl pl-11 pr-12 py-4 text-base"
                    style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: textSec }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm"
                  style={{ color: "var(--color-primary)" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <GradientButton size="lg" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "signup"
                ? "Create Account"
                : mode === "forgot"
                ? "Send Reset Link"
                : "Log In"}
            </GradientButton>
          </form>

          <div className="text-center">
            <button
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="text-base"
              style={{ color: "var(--color-primary)" }}
            >
              {mode === "signup" || mode === "forgot"
                ? "Already have an account? Log in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
