import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import LavaLampBackground from "@/components/LavaLampBackground";
import GradientButton from "@/components/GradientButton";
import ufixiLogo from "@/assets/ufixi-logo.svg";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setConfirmSent(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate("/home");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      <LavaLampBackground />

      <motion.div
        className="w-full max-w-sm relative z-10 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <img src={ufixiLogo} alt="Ufixi" className="h-9 mx-auto object-contain mb-6" />
          <h1
            className="text-3xl"
            style={{ color: "var(--color-navy)", letterSpacing: "-0.02em" }}
          >
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
            {isSignUp
              ? "Sign up to save your diagnostics"
              : "Sign in to access your saved issues"}
          </p>
        </div>

        {confirmSent ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-backdrop)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <p style={{ color: "var(--color-navy)" }}>
              ✓ Check your email for a confirmation link!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-backdrop)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--color-navy)",
                }}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-4 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-backdrop)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--color-navy)",
                }}
              />
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "#DC2626" }}>
                {error}
              </p>
            )}

            <GradientButton size="lg" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </GradientButton>
          </form>
        )}

        <p className="text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setConfirmSent(false);
            }}
            className="underline transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
