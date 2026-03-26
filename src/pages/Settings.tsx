import { useNavigate } from "react-router-dom";
import { User, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Crown } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import BottomNavDemo from "@/components/BottomNavDemo";

const MENU_ITEMS = [
  { icon: User, label: "Profile", sub: "Name, email, account type", path: null },
  { icon: Crown, label: "Subscription", sub: "Free plan — Upgrade to Premium", path: "/upgrade" },
  { icon: Bell, label: "Notifications", sub: "Push & email preferences", path: "/notifications" },
  { icon: Shield, label: "Privacy", sub: "Data & privacy settings", path: null },
  { icon: HelpCircle, label: "Support", sub: "Help centre & contact", path: "/support" },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen pb-20" style={{ background: "var(--color-bg)" }}>
        <PageHeader title="Settings" showBack={false} showLogo />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-3">
          {/* Profile card */}
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg" style={{ background: "var(--gradient-primary)", color: "white" }}>
              JD
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>John Doe</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>john@email.com</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "rgba(0,23,47,0.05)", color: "var(--color-text-secondary)" }}>Free Plan</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
            {MENU_ITEMS.map(({ icon: Icon, label, sub, path }, i) => (
              <button
                key={label}
                onClick={() => path && navigate(path)}
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
