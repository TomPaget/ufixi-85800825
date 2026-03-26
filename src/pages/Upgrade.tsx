import { Check, Crown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import GradientButton from "@/components/GradientButton";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    features: ["3 scans per month", "45-day scan history", "Community forum access", "Basic AI diagnosis"],
    current: true,
  },
  {
    name: "Premium",
    price: "£0.99",
    priceAfter: "£1.99",
    period: "first month",
    periodAfter: "per month after",
    features: ["Unlimited scans", "Extended scan history", "Priority AI analysis", "Detailed cost estimates", "PDF & email reports", "Ad-free experience"],
    current: false,
    recommended: true,
  },
];

export default function Upgrade() {
  const { isPremium, subscriptionEnd, startCheckout, user, checkSubscription } = useSubscription();
  const navigate = useNavigate();

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Could not open subscription manager");
    }
  };

  const handleUpgrade = () => {
    if (!user) {
      toast("Create an account first to subscribe");
      navigate("/auth?redirect=upgrade");
      return;
    }
    startCheckout();
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-8" style={{ background: "var(--color-bg)" }}>
        <PageHeader title="Upgrade" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          <div className="text-center space-y-2 py-4">
            <Crown className="w-10 h-10 mx-auto" style={{ color: "var(--color-primary)" }} />
            <h1 className="text-2xl" style={{ color: "var(--color-navy)" }}>
              {isPremium ? "You're Premium!" : "Go Premium"}
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {isPremium
                ? `Active until ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : "—"}`
                : "Unlock unlimited scans and premium features"}
            </p>
          </div>

          {PLANS.map((plan) => {
            const isActive = (plan.name === "Premium" && isPremium) || (plan.name === "Free" && !isPremium);
            return (
              <div
                key={plan.name}
                className="rounded-2xl p-5 space-y-4 relative"
                style={{
                  background: "white",
                  border: plan.recommended ? "2px solid var(--color-primary)" : "1px solid rgba(0,23,47,0.08)",
                  boxShadow: plan.recommended ? "var(--shadow-primary)" : "var(--shadow-card)",
                }}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-3 py-1 rounded-full" style={{ background: "var(--gradient-primary)", color: "white" }}>
                    {isPremium ? "Your Plan" : "Recommended"}
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl" style={{ color: "var(--color-navy)" }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>/{plan.period}</span>
                </div>
                {plan.priceAfter && (
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Then {plan.priceAfter}/{plan.periodAfter}
                  </p>
                )}
                <h3 className="text-lg" style={{ color: "var(--color-navy)" }}>{plan.name}</h3>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-navy)" }}>
                      <Check className="w-4 h-4" style={{ color: "var(--color-success)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <button
                    className="w-full py-3 rounded-2xl text-sm font-semibold"
                    style={{ background: "rgba(0,23,47,0.05)", color: "var(--color-text-secondary)" }}
                    disabled
                  >
                    Current Plan
                  </button>
                ) : plan.recommended ? (
                  <GradientButton size="lg" onClick={handleUpgrade}>
                    <span className="flex items-center justify-center gap-2"><Zap className="w-4 h-4" /> Upgrade Now</span>
                  </GradientButton>
                ) : null}
              </div>
            );
          })}

          {isPremium && (
            <div className="space-y-2">
              <button
                onClick={handleManage}
                className="w-full text-center py-3 text-base font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                Manage Subscription
              </button>
              <button
                onClick={() => navigate("/cancel-subscription")}
                className="w-full text-center py-2 text-sm"
                style={{ color: "#DC2626" }}
              >
                Cancel Subscription
              </button>
            </div>
          )}

          {/* Restore purchases — required by Apple App Store */}
          {!isPremium && (
            <button
              onClick={async () => {
                await checkSubscription();
                toast.info(isPremium ? "Subscription restored!" : "No active subscription found.");
              }}
              className="w-full text-center py-2 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Restore Purchases
            </button>
          )}

          {/* Legal links — required by app stores */}
          <div className="flex gap-4 justify-center text-xs pt-2" style={{ color: "rgba(0,23,47,0.38)" }}>
            <a href="/terms" className="underline">Terms of Service</a>
            <a href="/privacy" className="underline">Privacy Policy</a>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
