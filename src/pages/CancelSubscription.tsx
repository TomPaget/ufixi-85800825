import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Gift, Crown, Check, X, ArrowLeft,
  Zap, Mail, FileText, Shield
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import GradientButton from "@/components/GradientButton";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { isRevenueCatPlatform } from "@/lib/revenueCat";

const CANCEL_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Found a better alternative",
  "Missing features I need",
  "Technical issues",
  "Other",
];

const PREMIUM_PERKS = [
  { icon: Zap, text: "Unlimited scans" },
  { icon: X, text: "No ads during diagnosis" },
  { icon: FileText, text: "PDF & email reports" },
  { icon: Mail, text: "Landlord letter generator" },
  { icon: Shield, text: "Priority AI analysis" },
];

type CancelStep = "reason" | "offer" | "confirm" | "done";

export default function CancelSubscription() {
  const navigate = useNavigate();
  const { isPremium, subscriptionEnd, cancelAtPeriodEnd, checkSubscription } = useSubscription();
  const [step, setStep] = useState<CancelStep>("reason");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [claimingOffer, setClaimingOffer] = useState(false);
  const [cancelledUntil, setCancelledUntil] = useState<string | null>(null);
  const [offerEligible, setOfferEligible] = useState<boolean | null>(null);
  const [trackingAttempt, setTrackingAttempt] = useState(false);

  const navy = "#00172F";
  const textSecondary = "#5A6A7A";
  const native = isRevenueCatPlatform();

  useEffect(() => {
    if (native) {
      const platform = window.Capacitor?.getPlatform?.();
      const url = platform === "ios"
        ? "itms-apps://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
      window.location.href = url;
      navigate("/settings");
    }
  }, [native, navigate]);

  if (native) return null;

  if (!isPremium || cancelAtPeriodEnd) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
          <div className="text-center space-y-4 px-6">
            <p className="text-base" style={{ color: navy }}>
              {cancelAtPeriodEnd
                ? "Your subscription is already scheduled to cancel."
                : "You don't have an active subscription."}
            </p>
            <button onClick={() => navigate("/settings")} className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              Back to Settings
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        headers: { "x-ufixi-billing-client": "web" },
        body: {
          action: "cancel",
          reason: selectedReason,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCancelledUntil(data?.subscription_end || subscriptionEnd || null);
      setStep("done");
      await checkSubscription();

      if (data?.already_cancelled) {
        toast.info("Your subscription was already set to cancel at the end of the billing period.");
      } else {
        toast.success("Your subscription will now end at the close of the current billing period.");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not process cancellation");
    } finally {
      setCancelling(false);
    }
  };

  const handleClaimOffer = async () => {
    setClaimingOffer(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        headers: { "x-ufixi-billing-client": "web" },
        body: { action: "claim_free_month" },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || "Could not claim offer");
      toast.success("Free month applied! Your next charge is delayed by a full month.");
      await checkSubscription();
      navigate("/settings");
    } catch (err: any) {
      toast.error(err?.message || "Could not apply free month");
    } finally {
      setClaimingOffer(false);
    }
  };

  const handleContinueToOffer = async () => {
    if (!selectedReason) return;
    setTrackingAttempt(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        headers: { "x-ufixi-billing-client": "web" },
        body: { action: "track_attempt", reason: selectedReason },
      });
      if (error) throw error;
      const eligible = !!data?.offer_eligible;
      setOfferEligible(eligible);
      setStep(eligible ? "offer" : "confirm");
    } catch (err: any) {
      setOfferEligible(false);
      setStep("confirm");
    } finally {
      setTrackingAttempt(false);
    }
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ background: "var(--color-bg)", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5" style={{ minHeight: 64, paddingTop: "calc(var(--safe-top) + var(--app-header-offset))", paddingBottom: 12, paddingLeft: "calc(var(--safe-left) + 20px)", paddingRight: "calc(var(--safe-right) + 20px)" }}>
          <button
            onClick={() => step === "reason" ? navigate("/settings") : setStep("reason")}
            className="flex items-center justify-center"
            style={{ minWidth: 44, minHeight: 44, color: navy }}
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-lg font-semibold" style={{ color: navy }}>Cancel Subscription</h1>
        </div>

        <main className="max-w-lg mx-auto px-5" style={{ paddingBottom: "calc(var(--safe-bottom) + 32px)" }}>
          <AnimatePresence mode="wait">

            {/* Step 1: Select reason */}
            {step === "reason" && (
              <motion.div
                key="reason"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(245,158,11,0.1)" }}>
                    <AlertTriangle className="w-8 h-8" style={{ color: "#F59E0B" }} />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: navy }}>We're sorry to see you go</h2>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    Help us improve — why are you considering cancelling?
                  </p>
                </div>

                <div className="space-y-2">
                  {CANCEL_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                      style={{
                        background: selectedReason === reason ? "rgba(232,83,10,0.06)" : "white",
                        border: selectedReason === reason ? "2px solid var(--color-primary)" : "1px solid rgba(0,23,47,0.08)",
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: selectedReason === reason ? "var(--color-primary)" : "rgba(0,23,47,0.2)",
                        }}
                      >
                        {selectedReason === reason && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-primary)" }} />
                        )}
                      </div>
                      <span className="text-sm font-medium" style={{ color: navy }}>{reason}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleContinueToOffer}
                  disabled={!selectedReason || trackingAttempt}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    background: selectedReason ? "var(--color-primary)" : "rgba(0,23,47,0.08)",
                    color: selectedReason ? "white" : textSecondary,
                    opacity: selectedReason ? 1 : 0.5,
                  }}
                >
                  {trackingAttempt ? "Please wait…" : "Continue"}
                </button>

                <button
                  onClick={() => navigate("/settings")}
                  className="w-full text-center py-2 text-sm font-medium"
                  style={{ color: "var(--color-primary)" }}
                >
                  Never mind, keep my plan
                </button>
              </motion.div>
            )}

            {/* Step 2: Retention offer — free month */}
            {step === "offer" && (
              <motion.div
                key="offer"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--gradient-primary)" }}>
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: navy }}>Wait — here's a gift!</h2>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    We'd hate to lose you. How about a <strong>free month</strong> on us?
                  </p>
                </div>

                {/* What you'll lose card */}
                <div
                  className="rounded-2xl p-5 space-y-3"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: navy }}>
                    What you'll lose if you cancel:
                  </p>
                  {PREMIUM_PERKS.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                      <span className="text-sm" style={{ color: navy }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Free month offer */}
                <div
                  className="rounded-2xl p-5 text-center space-y-3"
                  style={{
                    background: "rgba(29,158,117,0.05)",
                    border: "2px solid rgba(29,158,117,0.2)",
                  }}
                >
                  <Crown className="w-8 h-8 mx-auto" style={{ color: "var(--color-success)" }} />
                  <p className="text-lg font-bold" style={{ color: navy }}>1 Month Free</p>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    Stay Premium and enjoy another month at no cost.
                  </p>
                  <GradientButton size="lg" onClick={handleClaimOffer} disabled={claimingOffer}>
                    {claimingOffer ? "Applying..." : "Claim Free Month"}
                  </GradientButton>
                </div>

                <button
                  onClick={() => setStep("confirm")}
                  className="w-full text-center py-2 text-sm font-medium"
                  style={{ color: "#DC2626" }}
                >
                  No thanks, I still want to cancel
                </button>
              </motion.div>
            )}

            {/* Step 3: Final confirmation */}
            {step === "confirm" && (
              <motion.div
                key="confirm"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(220,38,38,0.08)" }}>
                    <AlertTriangle className="w-8 h-8" style={{ color: "#DC2626" }} />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: navy }}>Are you sure?</h2>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    Your Premium access will remain active until{" "}
                    <strong>{subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : "the end of your billing period"}</strong>.
                    After that, you'll be downgraded to the Free plan.
                  </p>
                </div>

                <div
                  className="rounded-2xl p-5 space-y-2"
                  style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "#DC2626" }}>After cancellation:</p>
                  <ul className="space-y-1.5 text-sm" style={{ color: navy }}>
                    <li>• Limited to 3 scans per month</li>
                    <li>• Ads will show during diagnosis</li>
                    <li>• No PDF/email reports</li>
                    <li>• Saved issues may become inaccessible</li>
                  </ul>
                </div>

                <p className="text-xs text-center" style={{ color: textSecondary }}>
                  Cancelling now stops future renewals. Your Premium access stays active until the end of the current billing period.
                </p>

                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)" }}
                >
                  {cancelling ? "Cancelling..." : "Cancel My Subscription"}
                </button>

                <GradientButton size="lg" onClick={() => navigate("/settings")}>
                  Keep My Premium Plan
                </GradientButton>
              </motion.div>
            )}

            {/* Step 4: Confirmation done */}
            {step === "done" && (
              <motion.div
                key="done"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-6 py-10 text-center"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(0,23,47,0.05)" }}>
                  <Check className="w-8 h-8" style={{ color: textSecondary }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: navy }}>Cancellation Scheduled</h2>
                <p className="text-sm" style={{ color: textSecondary }}>
                  Your billing has been cancelled and Premium stays active until {new Date(cancelledUntil || subscriptionEnd || Date.now()).toLocaleDateString()}.
                </p>
                <button
                  onClick={() => {
                    checkSubscription();
                    navigate("/settings");
                  }}
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-primary)" }}
                >
                  Return to Settings
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </PageTransition>
  );
}
