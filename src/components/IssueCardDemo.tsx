import { ChevronRight, Image, Wrench } from "lucide-react";
import { motion } from "framer-motion";

interface Issue {
  id: string;
  title: string;
  date: string;
  status: "active" | "in_progress" | "resolved";
  urgency: "ignore" | "fix_soon" | "fix_now";
  severity: number;
  mediaUrl?: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-amber-100 text-amber-700 border-amber-400",
  in_progress: "bg-emerald-100 text-emerald-700 border-emerald-400",
  resolved: "bg-green-100 text-green-700 border-green-400",
};

const urgencyLabels: Record<string, { label: string; color: string; bg: string }> = {
  ignore: { label: "Low", color: "#6B7A8D", bg: "rgba(107,122,141,0.1)" },
  fix_soon: { label: "Fix Soon", color: "#F0900A", bg: "rgba(240,144,10,0.1)" },
  fix_now: { label: "Fix Now", color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
};

export default function IssueCardDemo({ issue }: { issue: Issue }) {
  const urgency = urgencyLabels[issue.urgency];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative rounded-2xl p-4 border cursor-pointer"
      style={{
        background: "white",
        borderColor: "var(--glass-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex gap-4">
        {issue.mediaUrl ? (
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
            <img src={issue.mediaUrl} alt={issue.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(29,158,117,0.1)" }}>
            <Wrench className="w-6 h-6" style={{ color: "var(--color-success)" }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold truncate" style={{ color: "var(--color-navy)" }}>
                {issue.title}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#6B7A8D" }}>
                {issue.date}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-success)" }} />
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: urgency.bg, color: urgency.color }}
            >
              {urgency.label}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize border ${statusStyles[issue.status]}`}>
              {issue.status.replace("_", " ")}
            </span>
            <span
              className="text-xs font-medium px-2 py-1 rounded-full"
              style={{ background: "rgba(232,83,10,0.08)", color: "var(--color-primary)" }}
            >
              Severity: {issue.severity}/10
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
