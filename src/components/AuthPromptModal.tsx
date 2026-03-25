import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import GradientButton from "@/components/GradientButton";

interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthPromptModal({ open, onClose }: AuthPromptModalProps) {
  const [isSignUp, setIsSignUp] = useState(true);
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
        onClose();
      }
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,23,47,0.5)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-sm rounded-3xl p-6 space-y-6"
          style={{
            background: "var(--color-bg)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          }}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "#9aa5b4" }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-2xl" style={{ color: "var(--color-navy)" }}>
              {isSignUp ? "Create an account" : "Sign in"}
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
              Create a free account to save your diagnostic results
            </p>
          </div>

          {confirmSent ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <p style={{ color: "var(--color-navy)" }}>
                ✓ Check your email for a confirmation link!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--color-navy)",
                }}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--color-navy)",
                }}
              />

              {error && (
                <p className="text-xs text-center" style={{ color: "#DC2626" }}>
                  {error}
                </p>
              )}

              <GradientButton disabled={loading}>
                {loading ? "Please wait..." : isSignUp ? "Create Account & Save" : "Sign In & Save"}
              </GradientButton>
            </form>
          )}

          <p className="text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setConfirmSent(false);
              }}
              className="underline"
              style={{ color: "var(--color-primary)" }}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
