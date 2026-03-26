import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import { MOCK_NOTIFICATIONS } from "@/data/mockData";

const priorityDot: Record<string, string> = {
  urgent: "#DC2626",
  high: "#F59E0B",
  normal: "transparent",
};

export default function Notifications() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen pb-8" style={{ background: "var(--color-bg)" }}>
        <PageHeader title="Notifications" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-3">
          {MOCK_NOTIFICATIONS.map((n) => (
            <button
              key={n.id}
              onClick={() => n.actionUrl && navigate(n.actionUrl)}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{
                background: n.read ? "white" : "rgba(232,83,10,0.04)",
                border: `1px solid ${n.read ? "rgba(0,23,47,0.08)" : "rgba(232,83,10,0.15)"}`,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="relative mt-0.5">
                  <Bell className="w-5 h-5" style={{ color: n.read ? "var(--color-text-secondary)" : "var(--color-primary)" }} />
                  {n.priority !== "normal" && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: priorityDot[n.priority], border: "2px solid var(--color-bg)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{n.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{n.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>{n.date}</p>
                </div>
              </div>
            </button>
          ))}
        </main>
      </div>
    </PageTransition>
  );
}
