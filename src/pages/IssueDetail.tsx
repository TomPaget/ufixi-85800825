import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, Wrench, AlertTriangle, ExternalLink,
  BookOpen, MessageSquare, PoundSterling, Shield, FileText, Mail
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageHeader from "@/components/PageHeader";
import GradientButton from "@/components/GradientButton";
import { MOCK_ISSUES } from "@/data/mockData";
import { generateTradesmanPdf, generateTradesmanEmail } from "@/lib/generateTradesmanPdf";
import { getTradeNameForCategory } from "@/lib/tradeNameMap";
import { useSubscription } from "@/hooks/useSubscription";

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "rgba(107,122,141,0.1)", text: "#6B7A8D" },
  medium: { bg: "rgba(240,144,10,0.1)", text: "#F0900A" },
  high: { bg: "rgba(220,38,38,0.1)", text: "#DC2626" },
  critical: { bg: "rgba(153,27,27,0.1)", text: "#991B1B" },
};

export default function IssueDetail() {
  const { id } = useParams();
  const issue = MOCK_ISSUES.find((i) => i.id === id);
  const [expanded, setExpanded] = useState<string | null>("causes");
  const { isPremium } = useSubscription();
  const tradeName = issue ? getTradeNameForCategory(issue.category) : "Specialist";

  if (!issue) return <div className="p-6 text-center" style={{ color: "var(--color-text-secondary)" }}>Issue not found</div>;

  const pColor = priorityColors[issue.priority] || priorityColors.medium;

  const sections = [
    {
      id: "causes", title: "What Caused This?",
      content: issue.causes?.map((c, i) => (
        <div key={i} className="p-3 rounded-xl text-sm" style={{ background: "rgba(0,23,47,0.03)", borderLeft: "3px solid rgba(59,130,246,0.5)", color: "var(--color-navy)" }}>{c}</div>
      )),
    },
    {
      id: "diy", title: "Step-by-Step DIY Guide",
      content: (
        <ol className="space-y-2 list-decimal list-inside text-sm" style={{ color: "var(--color-navy)" }}>
          {issue.diySteps?.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      ),
    },
    {
      id: "products", title: "Products Needed",
      content: issue.productsNeeded?.map((p, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
          <span className="text-sm" style={{ color: "var(--color-navy)" }}>{p.name}</span>
          <a href={`https://amazon.co.uk/s?k=${p.searchTerm}&tag=ufixi-21`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#FFD814", color: "#0F1111" }}>
            Buy on Amazon
          </a>
        </div>
      )),
    },
    {
      id: "safety", title: "Safety Warnings",
      content: issue.safetyWarnings?.map((w, i) => (
        <div key={i} className="p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
          <span className="text-sm" style={{ color: "#92400E" }}>{w}</span>
        </div>
      )),
    },
    {
      id: "pro", title: "When to Call a Professional",
      content: (
        <div className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
          <p className="text-sm" style={{ color: "#DC2626" }}>{issue.whenToCallPro}</p>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <LavaLampBackground />
        <PageHeader title="Issue Detail" />
        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          {/* Header card */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <h1 className="text-xl" style={{ color: "var(--color-navy)" }}>{issue.title}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{issue.description}</p>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: pColor.bg, color: pColor.text }}>{issue.priority}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(232,83,10,0.08)", color: "var(--color-primary)" }}>Severity: {issue.severity}/10</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: "rgba(0,23,47,0.05)", color: "var(--color-navy)" }}>{issue.category}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,23,47,0.05)", color: "var(--color-navy)" }}>{issue.location}</span>
            </div>
          </div>

          {/* Cost card */}
          {issue.costs && (
            <div className="rounded-2xl p-4 flex gap-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
              <div className="flex-1 text-center">
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>DIY Cost</p>
                <p className="text-lg" style={{ color: "var(--color-success)" }}>£{issue.costs.diyMin}–£{issue.costs.diyMax}</p>
              </div>
              <div className="w-px" style={{ background: "rgba(0,23,47,0.08)" }} />
              <div className="flex-1 text-center">
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Professional</p>
                <p className="text-lg" style={{ color: "var(--color-primary)" }}>£{issue.costs.proMin}–£{issue.costs.proMax}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {[
              { icon: BookOpen, label: "DIY Guide" },
              { icon: MessageSquare, label: "Talk to Landlord" },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-semibold transition-all active:scale-95"
                style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: "var(--color-navy)", minHeight: 44 }}>
                <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                {label}
              </button>
            ))}
          </div>

          {/* Accordion sections */}
          {sections.map(({ id: sId, title, content }) => (
            <div key={sId} className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
              <button onClick={() => setExpanded(expanded === sId ? null : sId)} className="w-full flex items-center justify-between p-4" style={{ minHeight: 52 }}>
                <span className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{title}</span>
                {expanded === sId ? <ChevronUp className="w-4 h-4" style={{ color: "#9aa5b4" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#9aa5b4" }} />}
              </button>
              <AnimatePresence>
                {expanded === sId && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2">{content}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Export buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const triage = { issue_title: issue.title, brief_description: issue.description, category: issue.category };
                const diagnosis = {
                  likely_causes: issue.causes?.map(c => ({ cause: c, details: "" })) || [],
                  diy_quick_fixes: issue.diySteps?.map(s => ({ action: s, description: "", estimated_time: "", difficulty: "Moderate" })) || [],
                  safety_warnings: issue.safetyWarnings || [],
                  call_pro_if: issue.whenToCallPro ? [issue.whenToCallPro] : [],
                  urgency_assessment: { level: issue.urgency, reason: "" },
                };
                generateTradesmanPdf(triage, diagnosis);
              }}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: "var(--color-navy)", minHeight: 44 }}
            >
              <FileText className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Export PDF
            </button>
            {isPremium && (
              <button
                onClick={() => {
                  const triageData = { issue_title: issue.title, brief_description: issue.description, category: issue.category };
                  const diagnosisData = {
                    likely_causes: issue.causes?.map(c => ({ cause: c, details: "" })) || [],
                    urgency_assessment: { level: issue.urgency, reason: "" },
                  };
                  const { subject, body } = generateTradesmanEmail(triageData, diagnosisData);
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_self");
                }}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-semibold transition-all active:scale-95"
                style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: "var(--color-navy)", minHeight: 44 }}
              >
                <Mail className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Email {tradeName}
              </button>
            )}
            {!isPremium && (
            <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-semibold" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: "var(--color-navy)", minHeight: 44 }}>
              <Mail className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Email Report
            </button>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
