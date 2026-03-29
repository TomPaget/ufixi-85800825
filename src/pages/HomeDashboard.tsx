import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, History, Sparkles, TrendingUp, Calendar, ChevronDown, ChevronUp, Bell, Crown, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LavaLampBackground from "@/components/LavaLampBackground";
import GlassCard from "@/components/GlassCard";
import BottomNavDemo from "@/components/BottomNavDemo";
import PageTransition from "@/components/PageTransition";
import GradientButton from "@/components/GradientButton";
import ufixiLogo from "@/assets/ufixi-logo.svg";
import { useSubscription } from "@/hooks/useSubscription";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/appNavigation";

const ScanFlow = lazy(() => import("@/components/ScanFlow"));

export default function HomeDashboard() {
  const [showRecentIssues, setShowRecentIssues] = useState(false);
  const [showScanFlow, setShowScanFlow] = useState(false);
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [savedIssues, setSavedIssues] = useState<any[]>([]);
  const [resumeScanId, setResumeScanId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const nativeApp = isNativeApp();
  const { isPremium, startCheckout } = useSubscription();
  const { unreadCount } = useNotifications();

  // Register native push notifications — navigate on tap
  usePushNotifications((actionUrl) => navigate(actionUrl));

  // Handle resume from My Issues
  useEffect(() => {
    const state = location.state as any;
    if (state?.resumeScanId) {
      setResumeScanId(state.resumeScanId);
      setResumeData({
        step: state.resumeData?.step || 1,
        description: state.resumeData?.description || "",
        location: state.resumeData?.location || "",
        category: state.resumeData?.category || null,
        answers: state.resumeData?.answers || [],
        triageData: state.resumeData?.triage_data || null,
        diagnosisData: state.resumeData?.diagnosis_data || null,
      });
      setShowScanFlow(true);
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [activeCount, setActiveCount] = useState(0);
  const [fixSoonCount, setFixSoonCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  useEffect(() => {
    if (isPremium) loadCounts();
  }, [isPremium]);

  const loadCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("saved_issues").select("status, urgency").eq("user_id", user.id);
    if (!data) return;
    setActiveCount(data.filter(i => i.status === "active").length);
    setFixSoonCount(data.filter(i => i.urgency === "fix_now" || i.urgency === "fix_soon").length);
    setResolvedCount(data.filter(i => i.status === "resolved").length);
    setSavedIssues(data);
  };

  const handleRecentScansClick = () => {
    if (!isPremium) {
      setShowPremiumPrompt(!showPremiumPrompt);
      setShowRecentIssues(false);
    } else {
      setShowRecentIssues(!showRecentIssues);
      setShowPremiumPrompt(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "var(--app-page-bottom-space)" }}>
        <LavaLampBackground />

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30"
          style={{ paddingTop: "calc(var(--safe-top) + var(--app-header-offset))", paddingLeft: "var(--safe-left)", paddingRight: "var(--safe-right)" }}
        >
          <div className="max-w-lg mx-auto px-4 flex items-center relative" style={{ minHeight: 64, padding: "10px 16px 14px" }}>
            <button
              onClick={() => navigate("/notifications")}
              className="rounded-xl flex items-center justify-center transition-all active:scale-90 relative flex-shrink-0"
              style={{ color: "var(--color-navy)", minWidth: 52, minHeight: 52 }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#DC2626" }} />}
            </button>

            <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
              <img src={ufixiLogo} alt="Ufixi" className="h-8 object-contain" />
            </div>

            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <motion.button
                onClick={() => navigate("/upgrade")}
                animate={nativeApp ? undefined : { scale: [1, 1.02, 1] }}
                transition={nativeApp ? undefined : { duration: 2.2, ease: "easeInOut", repeat: Infinity }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95"
                style={{ background: "var(--gradient-primary)", color: "#fff", minHeight: 44 }}
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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

          {/* Quick Stats — all zeroed */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
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
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <button
              onClick={() => setShowScanFlow(true)}
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 border-0 transition-transform active:scale-95"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: nativeApp
                  ? "0 8px 24px rgba(232,83,10,0.28)"
                  : "0 0 0 16px rgba(232,83,10,0.1), 0 0 0 32px rgba(217,56,112,0.06), 0 8px 48px rgba(232,83,10,0.4)",
                color: "#fff",
                animation: nativeApp ? "none" : "pulse-ring 2s ease-out infinite",
              }}
            >
              <Plus className="w-12 h-12" strokeWidth={2.5} />
              <span className="text-sm tracking-wide">Scan</span>
            </button>
            <p className="text-sm mt-4" style={{ color: "#6B6A8E" }}>Tap to scan a new issue</p>
          </motion.div>

          {/* Recent Issues / Premium Gate */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <button
              onClick={handleRecentScansClick}
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
                  0
                </span>
              </span>
              {(showRecentIssues || showPremiumPrompt) ? <ChevronUp className="w-5 h-5" style={{ color: "#9aa5b4" }} /> : <ChevronDown className="w-5 h-5" style={{ color: "#9aa5b4" }} />}
            </button>

            <AnimatePresence>
              {/* Premium upsell for free users */}
              {showPremiumPrompt && !isPremium && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Premium Feature</h3>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Scan history requires Premium</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {["Save unlimited diagnoses", "Access 45-day scan history", "No ads during diagnosis", "Export as PDF"].map((b) => (
                        <div key={b} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-success)" }} />
                          <span className="text-sm" style={{ color: "var(--color-navy)" }}>{b}</span>
                        </div>
                      ))}
                    </div>

                    <GradientButton onClick={startCheckout}>
                      <span className="flex items-center justify-center gap-2"><Crown className="w-4 h-4" /> Upgrade to Premium — £0.99/mo</span>
                    </GradientButton>
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

        <AnimatePresence>
          {showScanFlow && (
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-background/80" />}>
              <ScanFlow
                onClose={() => { setShowScanFlow(false); setResumeScanId(null); setResumeData(null); }}
                resumeScanId={resumeScanId || undefined}
                resumeData={resumeData || undefined}
              />
            </Suspense>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
