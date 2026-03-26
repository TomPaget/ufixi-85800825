import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, History, Sparkles, TrendingUp, Calendar, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LavaLampBackground from "@/components/LavaLampBackground";
import GlassCard from "@/components/GlassCard";
import IssueCardDemo from "@/components/IssueCardDemo";
import BottomNavDemo from "@/components/BottomNavDemo";
import ScanFlow from "@/components/ScanFlow";
import PageTransition from "@/components/PageTransition";
import ufixiLogo from "@/assets/ufixi-logo.svg";
import { MOCK_ISSUES } from "@/data/mockData";

export default function HomeDashboard() {
  const [showRecentIssues, setShowRecentIssues] = useState(false);
  const [showScanFlow, setShowScanFlow] = useState(false);
  const navigate = useNavigate();

  const activeCount = MOCK_ISSUES.filter((i) => i.status === "active").length;
  const fixSoonCount = MOCK_ISSUES.filter((i) => i.urgency === "fix_soon" || i.urgency === "fix_now").length;
  const resolvedCount = MOCK_ISSUES.filter((i) => i.status === "resolved").length;

  return (
    <PageTransition>
      <div className="min-h-screen pb-20 relative overflow-hidden" style={{ background: "transparent" }}>
        <LavaLampBackground />

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 py-3"
        >
          <div className="max-w-lg mx-auto px-4 flex items-center relative" style={{ padding: "10px 16px" }}>
            <button
              onClick={() => navigate("/notifications")}
              className="rounded-xl flex items-center justify-center transition-all active:scale-90 relative flex-shrink-0"
              style={{ color: "var(--color-navy)", minWidth: 44, minHeight: 44 }}
            >
              <Bell className="w-5 h-5" />
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#DC2626" }} />
            </button>

            <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
              <img src={ufixiLogo} alt="Ufixi" className="h-8 object-contain" />
            </div>

            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <motion.button
                onClick={() => navigate("/upgrade")}
                animate={{
                  boxShadow: [
                    "0 0 0 0px rgba(226,100,171,0.2)",
                    "0 0 0 6px rgba(226,100,171,0.08)",
                    "0 0 0 0px rgba(226,100,171,0.2)",
                  ],
                }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95"
                style={{ background: "var(--gradient-primary)", color: "#fff" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Go Premium
              </motion.button>
            </div>
          </div>
        </motion.header>

        <main className="max-w-lg mx-auto px-5 py-6 space-y-10">
          {/* Welcome */}
          <motion.div
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              style={{
                fontSize: "clamp(2.4rem, 7vw, 3.5rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "var(--color-navy)",
                marginTop: "1rem",
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
            <p className="text-sm max-w-xs mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Upload a photo or video and get an instant AI-powered repair assessment.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {[
              { icon: TrendingUp, value: activeCount, label: "Active", color: "var(--color-primary)" },
              { icon: Calendar, value: fixSoonCount, label: "Urgent", color: "#F0900A" },
              { icon: History, value: resolvedCount, label: "Resolved", color: "var(--color-secondary)" },
            ].map(({ icon: Icon, value, label, color }) => (
              <GlassCard key={label} className="text-center">
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
                <p className="text-xl" style={{ color: "var(--color-navy)" }}>{value}</p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
              </GlassCard>
            ))}
          </motion.div>

          {/* Scan Button */}
          <motion.div
            className="flex flex-col items-center justify-center gap-4 py-8 w-full text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={() => setShowScanFlow(true)}
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 border-0 transition-transform active:scale-95"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "0 0 0 16px rgba(232,83,10,0.1), 0 0 0 32px rgba(217,56,112,0.06), 0 8px 48px rgba(232,83,10,0.4)",
                color: "#fff",
                animation: "pulse-ring 2s ease-out infinite",
              }}
            >
              <Plus className="w-12 h-12" strokeWidth={2.5} />
              <span className="text-sm tracking-wide">Scan</span>
            </button>
            <p className="text-sm mt-4" style={{ color: "#6B6A8E" }}>Tap to scan a new issue</p>
          </motion.div>

          {/* Recent Issues */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={() => setShowRecentIssues(!showRecentIssues)}
              className="w-full flex items-center justify-between p-4 rounded-2xl transition-all hover:shadow-md active:scale-[0.99]"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-backdrop)",
                border: "1px solid var(--glass-border)",
                minHeight: 44,
              }}
            >
              <span className="flex items-center gap-2" style={{ color: "var(--color-navy)" }}>
                <History className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                Recent Scans
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,83,10,0.1)", color: "var(--color-primary)" }}>
                  {MOCK_ISSUES.length}
                </span>
              </span>
              {showRecentIssues ? <ChevronUp className="w-5 h-5" style={{ color: "#9aa5b4" }} /> : <ChevronDown className="w-5 h-5" style={{ color: "#9aa5b4" }} />}
            </button>

            <AnimatePresence>
              {showRecentIssues && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3">
                    {MOCK_ISSUES.map((issue) => (
                      <div key={issue.id} onClick={() => navigate(`/issue/${issue.id}`)}>
                        <IssueCardDemo key={issue.id} issue={issue} />
                      </div>
                    ))}
                    <button
                      onClick={() => navigate("/issues")}
                      className="block w-full text-center text-sm py-2"
                      style={{ color: "var(--color-primary)" }}
                    >
                      View All Issues →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Disclaimer */}
          <div className="text-center pb-4">
            <p className="text-xs" style={{ color: "rgba(0,23,47,0.38)" }}>
              Ufixi provides AI-powered assessments for informational purposes only.
              Always consult a qualified professional for safety-critical repairs.
            </p>
          </div>
        </main>

        <BottomNavDemo />

        {/* Scan Flow Overlay */}
        <AnimatePresence>
          {showScanFlow && <ScanFlow onClose={() => setShowScanFlow(false)} />}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
