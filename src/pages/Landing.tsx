import { useNavigate } from "react-router-dom";
import { Zap, DollarSign, BookOpen } from "lucide-react";
import LavaLampBackground from "@/components/LavaLampBackground";
import GradientButton from "@/components/GradientButton";
import FeaturePill from "@/components/FeaturePill";
import { motion } from "framer-motion";
import ufixiLogo from "@/assets/ufixi-logo.svg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center pb-16 pt-10">
      <LavaLampBackground />

      <div className="max-w-md mx-auto px-6 text-center space-y-10 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src={ufixiLogo} alt="Ufixi" className="h-9 mx-auto object-contain" />
        </motion.div>

        {/* Heading */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1
            style={{
              fontSize: "clamp(2.8rem, 8vw, 4.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "var(--color-navy)",
            }}
          >
            What needs{" "}
            <span
              style={{
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              fixing?
            </span>
          </h1>
          <p
            className="text-base max-w-[26rem] mx-auto"
            style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}
          >
            Clarity before cost. AI diagnoses any home issue in seconds — know
            what's wrong, what it costs, and what to do.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GradientButton size="lg" onClick={() => navigate("/home")}>
            Get started — it's free
          </GradientButton>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <FeaturePill icon={Zap} label="Instant diagnosis" />
          <FeaturePill icon={DollarSign} label="Cost estimates" />
          <FeaturePill icon={BookOpen} label="DIY guidance" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-xs"
          style={{ color: "rgba(0,23,47,0.38)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          No jargon. No guesswork. No wasted call-outs.
        </motion.p>
      </div>
    </div>
  );
}
