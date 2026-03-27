import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Crown } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import { useNotifications } from "@/hooks/useNotifications";

const priorityDot: Record<string, string> = {
  urgent: "#DC2626",
  high: "#F59E0B",
  normal: "transparent",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, requestPushPermission } = useNotifications();
  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem("pushNotificationsEnabled") !== "false";
  });

  useEffect(() => {
    if (pushEnabled) requestPushPermission();
  }, [requestPushPermission, pushEnabled]);

  const toggleNotifications = () => {
    const next = !pushEnabled;
    setPushEnabled(next);
    localStorage.setItem("pushNotificationsEnabled", String(next));
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-8" style={{ background: "var(--color-bg)" }}>
        <PageHeader title="Notifications" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-3">
          {/* Notification toggle */}
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Push Notifications</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{pushEnabled ? "Enabled" : "Disabled"}</p>
            </div>
            <button
              onClick={toggleNotifications}
              className="relative w-12 h-7 rounded-full transition-colors"
              style={{ background: pushEnabled ? "var(--color-primary)" : "rgba(0,23,47,0.12)" }}
            >
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
                style={{ left: pushEnabled ? "calc(100% - 26px)" : "2px" }}
              />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Bell className="w-10 h-10 mx-auto" style={{ color: "rgba(0,23,47,0.15)" }} />
              <p className="text-base font-semibold" style={{ color: "var(--color-navy)" }}>No notifications yet</p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                You'll get notified when your scans complete or issues are updated.
              </p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  markAsRead(n.id);
                  if (n.action_url) navigate(n.action_url);
                }}
                className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
                style={{
                  background: n.read ? "white" : "rgba(232,83,10,0.04)",
                  border: `1px solid ${n.read ? "rgba(0,23,47,0.08)" : "rgba(232,83,10,0.15)"}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5">
                    {n.type === "promo" ? (
                      <Crown className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                    ) : (
                      <Bell className="w-5 h-5" style={{ color: n.read ? "var(--color-text-secondary)" : "var(--color-primary)" }} />
                    )}
                    {n.priority !== "normal" && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                        style={{ background: priorityDot[n.priority] || "transparent", border: "2px solid var(--color-bg)" }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{n.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </main>
      </div>
    </PageTransition>
  );
}
