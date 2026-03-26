import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Lock, Crown, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import BottomNavDemo from "@/components/BottomNavDemo";
import GradientButton from "@/components/GradientButton";
import LavaLampBackground from "@/components/LavaLampBackground";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

const PREMIUM_BENEFITS = [
  "Save unlimited diagnoses",
  "Access full scan history",
  "No ads during diagnosis",
  "Priority AI analysis",
  "Export diagnosis as PDF",
];

export default function MyIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isPremium, startCheckout } = useSubscription();

  useEffect(() => {
    loadIssues();
  }, [isPremium]);

  const loadIssues = async () => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("saved_issues")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setIssues(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navy = "#00172F";
  const textSec = "#5A6A7A";

  // Free user — show premium lock
  if (!isPremium) {
    return (
      <PageTransition>
        <div className="min-h-screen pb-20 relative overflow-hidden" style={{ background: "transparent" }}>
          <LavaLampBackground />
          <PageHeader title="My Issues" showBack={false} showLogo />

          <main className="max-w-lg mx-auto px-5 py-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 space-y-6 text-center"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--gradient-primary)" }}>
                <Lock className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: navy }}>Premium Feature</h2>
                <p className="text-base" style={{ color: textSec }}>
                  Saving and viewing your diagnosed issues requires a Premium membership.
                </p>
              </div>

              <div className="space-y-3 text-left">
                {PREMIUM_BENEFITS.map((b) => (
                  <div key={b} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,23,47,0.02)" }}>
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-success)" }} />
                    <span className="text-base" style={{ color: navy }}>{b}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <GradientButton size="lg" onClick={startCheckout}>
                  <span className="flex items-center justify-center gap-2">
                    <Crown className="w-5 h-5" /> Upgrade to Premium — £0.99/mo
                  </span>
                </GradientButton>
                <p className="text-xs" style={{ color: textSec }}>Cancel anytime. No commitments.</p>
              </div>
            </motion.div>
          </main>

          <BottomNavDemo />
        </div>
      </PageTransition>
    );
  }

  // Premium user — show real saved issues
  const filtered = issues.filter((i) =>
    i.issue_title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen pb-20" style={{ background: "var(--color-bg)" }}>
        <PageHeader title="My Issues" showBack={false} showLogo />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", minHeight: 44 }}>
              <Search className="w-4 h-4" style={{ color: textSec }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved issues..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: navy }}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: textSec }}>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-base font-semibold" style={{ color: navy }}>No saved issues yet</p>
              <p className="text-sm" style={{ color: textSec }}>
                Scan a new issue and save the diagnosis to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => navigate(`/issue/${issue.id}`)}
                  className="rounded-2xl p-4 space-y-2 cursor-pointer transition-all active:scale-[0.98]"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold" style={{ color: navy }}>{issue.issue_title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: issue.urgency === "fix_now" ? "rgba(220,38,38,0.1)" : issue.urgency === "fix_soon" ? "rgba(240,144,10,0.1)" : "rgba(107,122,141,0.1)",
                      color: issue.urgency === "fix_now" ? "#DC2626" : issue.urgency === "fix_soon" ? "#F0900A" : "#6B7A8D",
                    }}>
                      {issue.urgency?.replace("_", " ") || "unknown"}
                    </span>
                  </div>
                  {issue.brief_description && (
                    <p className="text-sm" style={{ color: textSec }}>{issue.brief_description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: textSec }}>{issue.category}</span>
                    <span className="text-xs" style={{ color: textSec }}>•</span>
                    <span className="text-xs" style={{ color: textSec }}>{new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <BottomNavDemo />
      </div>
    </PageTransition>
  );
}
