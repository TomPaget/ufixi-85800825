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
import { loadRecentScans, MAX_AUTO_RECENT, AUTO_RECENT_DAYS } from "@/lib/autoSaveScan";

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
  const { isPremium, hasEverSubscribed, startCheckout, checkSubscription, user, authReady } = useSubscription();
  const [verifyingUpgrade, setVerifyingUpgrade] = useState(false);

  // Post-checkout: poll for subscription activation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") !== "true") return;
    setVerifyingUpgrade(true);
    let cancelled = false;
    let attempts = 0;
    const MAX = 12;
    const poll = async () => {
      while (!cancelled && attempts < MAX) {
        attempts++;
        await checkSubscription();
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) setVerifyingUpgrade(false);
      // Clean URL
      window.history.replaceState({}, "", "/home");
    };
    poll();
    return () => { cancelled = true; };
  }, [checkSubscription]);

  // Hide overlay as soon as premium activates
  useEffect(() => {
    if (verifyingUpgrade && isPremium) setVerifyingUpgrade(false);
  }, [isPremium, verifyingUpgrade]);
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
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [activeCount, setActiveCount] = useState(0);
  const [fixSoonCount, setFixSoonCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const loadCounts = async () => {
    if (!authReady || !user) return;

    const { data } = await supabase
      .from("saved_issues")
      .select("status, urgency")
      .eq("user_id", user.id)
      .neq("status", "auto_recent");

    if (data) {
      setActiveCount(data.filter(i => i.status === "active").length);
      setFixSoonCount(data.filter(i => i.urgency === "fix_now" || i.urgency === "fix_soon").length);
      setResolvedCount(data.filter(i => i.status === "resolved").length);
      setSavedIssues(data);
    }

    const recent = await loadRecentScans(user.id);
    setRecentScans(recent);
  };

  useEffect(() => {
    if (authReady && isPremium && user) loadCounts();
  }, [authReady, isPremium, user, showScanFlow]);

  useEffect(() => {
    if (authReady && isPremium && user && !showScanFlow) loadCounts();
  }, [authReady, showScanFlow, isPremium, user]);

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
      {verifyingUpgrade && !isPremium && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
          style={{ background: "rgba(0,23,47,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 text-center space-y-3"
            style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div
              className="w-12 h-12 mx-auto rounded-full animate-spin border-4"
              style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
            />
            <h2 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>
              Activating your Premium…
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Confirming your payment with Stripe. This usually takes a few seconds.
            </p>
          </div>
        </div>
      )}
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "var(--app-page-bottom-space)" }}>
        <LavaLampBackground />

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30"
          style={{ paddingTop: "calc(var(--safe-top) + var(--app-header-offset))", paddingLeft: "var(--safe-left)", paddingRight: "var(--safe-right)" }}
        >
          <div className="max-w-lg mx-auto px-4 flex items-center relative" style={{ minHeight: 48, padding: "4px 16px 6px" }}>
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
                  {isPremium ? `${recentScans.length} / ${MAX_AUTO_RECENT}` : "0"}
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
                      <span className="flex items-center justify-center gap-2"><Crown className="w-4 h-4" /> Upgrade to Premium — {hasEverSubscribed ? "£1.99/mo" : "£0.99/mo"}</span>
                    </GradientButton>
                  </div>
                </motion.div>
              )}

              {/* Recent scans list for premium users */}
              {showRecentIssues && isPremium && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {recentScans.length === 0 ? (
                      <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,23,47,0.08)" }}>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>No recent scans yet</p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                          Completed scans appear here for {AUTO_RECENT_DAYS} days. Save the ones you want to keep.
                        </p>
                      </div>
                    ) : (
                      recentScans.map((scan) => {
                        const expiresIn = scan.expires_at
                          ? Math.max(0, Math.ceil((new Date(scan.expires_at).getTime() - Date.now()) / 86400000))
                          : null;
                        const urgencyColor =
                          scan.urgency === "fix_now" ? "#DC2626" :
                          scan.urgency === "fix_soon" ? "#F0900A" : "#6B7A8D";
                        const urgencyBg =
                          scan.urgency === "fix_now" ? "rgba(220,38,38,0.1)" :
                          scan.urgency === "fix_soon" ? "rgba(240,144,10,0.1)" : "rgba(107,122,141,0.1)";
                        return (
                          <button
                            key={scan.id}
                            onClick={() => navigate(`/issue/${scan.id}`)}
                            className="w-full flex gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98]"
                            style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}
                          >
                            {scan.image_url ? (
                              <img
                                src={scan.image_url}
                                alt={scan.issue_title}
                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                style={{ border: "1px solid rgba(0,23,47,0.08)" }}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(232,83,10,0.08)" }}>
                                <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--color-primary)" }}>
                                  {(scan.category || "?").slice(0, 3)}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--color-navy)" }}>
                                  {scan.issue_title}
                                </h4>
                                {scan.urgency && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: urgencyBg, color: urgencyColor }}>
                                    {scan.urgency.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                                <span className="capitalize">{scan.category}</span>
                                <span>•</span>
                                <span>Auto-saved · {expiresIn !== null ? `${expiresIn}d left` : "saved"}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
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
