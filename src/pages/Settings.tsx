import { useNavigate, useSearchParams } from "react-router-dom";
import { User, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Crown, XCircle } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageHeader from "@/components/PageHeader";
import BottomNavDemo from "@/components/BottomNavDemo";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { user, isPremium, subscriptionEnd, signOut, authReady } = useSubscription();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const handleManageSubscription = async () => {
    if (!isPremium) {
      navigate("/upgrade");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Could not open subscription manager");
    }
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const displayName = user?.user_metadata?.full_name || user?.email || "Guest";
  const displayEmail = user?.email || "";
  const planLabel = isPremium ? "Premium" : "Free Plan";
  const subDescription = isPremium
    ? `Premium · Renews ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : "—"}`
    : "Free plan — Upgrade to Premium";

  const MENU_ITEMS = [
    { icon: User, label: "Profile", sub: `${displayName}`, path: "/profile" },
    { icon: Crown, label: "Subscription", sub: subDescription, action: handleManageSubscription },
    ...(isPremium ? [{ icon: XCircle, label: "Cancel Subscription", sub: "Cancel your Premium plan", path: "/cancel-subscription" }] : []),
    { icon: Bell, label: "Notifications", sub: "Push & email preferences", path: "/notifications" },
    { icon: Shield, label: "Privacy", sub: "Data & privacy settings", path: "/privacy" },
    { icon: HelpCircle, label: "Support", sub: "Help centre & contact", path: "/support" },
  ];

  if (!authReady) return null;

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: "transparent", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 16px)" }}>
          <LavaLampBackground />
          <PageHeader title="Settings" showBack={false} showLogo />
          <main className="max-w-lg mx-auto px-5 py-8 text-center space-y-4 flex-1">
            <User className="w-12 h-12 mx-auto" style={{ color: "var(--color-text-secondary)" }} />
            <p className="text-base" style={{ color: "var(--color-navy)" }}>Sign in to access your settings</p>
            <button
              onClick={() => navigate("/auth")}
              className="px-6 py-3 rounded-2xl text-sm font-semibold"
              style={{ background: "var(--gradient-primary)", color: "white" }}
            >
              Sign In / Create Account
            </button>
          </main>
          <BottomNavDemo />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pb-20 relative overflow-hidden" style={{ background: "transparent" }}>
        <LavaLampBackground />
        <PageHeader title="Settings" showBack={false} showLogo />
        <main className="max-w-lg mx-auto px-5 py-4 space-y-3">
          {/* Profile card */}
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "var(--gradient-primary)", color: "white" }}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{displayName}</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{displayEmail}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block" style={{
                background: isPremium ? "var(--gradient-primary)" : "rgba(0,23,47,0.05)",
                color: isPremium ? "white" : "var(--color-text-secondary)"
              }}>
                {planLabel}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
            {MENU_ITEMS.map(({ icon: Icon, label, sub, path, action }, i) => (
              <button
                key={label}
                onClick={() => action ? action() : path ? navigate(path) : null}
                className="w-full flex items-center gap-3 p-4 text-left transition-all active:bg-muted"
                style={{ borderBottom: i < MENU_ITEMS.length - 1 ? "1px solid rgba(0,23,47,0.06)" : "none", minHeight: 56 }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{sub}</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "#9aa5b4" }} />
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: "rgba(220,38,38,0.06)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.12)", minHeight: 48 }}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </main>

        <BottomNavDemo />
      </div>
    </PageTransition>
  );
}
