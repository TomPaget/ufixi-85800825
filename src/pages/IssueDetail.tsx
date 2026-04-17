import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, AlertTriangle, FileText, Mail, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/PageTransition";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageHeader from "@/components/PageHeader";
import { generateTradesmanPdf, generateTradesmanEmail } from "@/lib/generateTradesmanPdf";
import { getTradeNameForCategory } from "@/lib/tradeNameMap";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

const navy = "#00172F";
const textSec = "#5A6A7A";

const urgencyStyle: Record<string, { bg: string; color: string; label: string }> = {
  fix_now:  { bg: "rgba(220,38,38,0.1)", color: "#DC2626", label: "fix now" },
  fix_soon: { bg: "rgba(240,144,10,0.1)", color: "#F0900A", label: "fix soon" },
  monitor:  { bg: "rgba(107,122,141,0.1)", color: "#6B7A8D", label: "monitor" },
  ignore:   { bg: "rgba(107,122,141,0.1)", color: "#6B7A8D", label: "ignore" },
};

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>("causes");

  useEffect(() => {
    (async () => {
      if (!id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("saved_issues")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) console.error("Load issue:", error);
      setIssue(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      </PageTransition>
    );
  }

  if (!issue) {
    return (
      <PageTransition>
        <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
          <PageHeader title="Issue Detail" />
          <div className="p-8 text-center space-y-3">
            <p className="text-base" style={{ color: textSec }}>Issue not found.</p>
            <button onClick={() => navigate("/my-issues")} className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              Back to My Issues
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const triage = issue.triage_data || {
    issue_title: issue.issue_title,
    brief_description: issue.brief_description,
    category: issue.category,
  };
  const diagnosis = issue.diagnosis_data || {};
  const tradeName = getTradeNameForCategory(issue.category);
  const urg = urgencyStyle[issue.urgency || ""] || urgencyStyle.monitor;

  const causes = diagnosis.likely_causes || [];
  const fixes = diagnosis.diy_quick_fixes || [];
  const warnings = diagnosis.safety_warnings || [];
  const callPro = diagnosis.call_pro_if || [];
  const costs = diagnosis.estimated_costs;

  const sections: { id: string; title: string; content: any }[] = [];
  if (causes.length) sections.push({
    id: "causes", title: "What Caused This?",
    content: causes.map((c: any, i: number) => (
      <div key={i} className="p-3 rounded-xl text-sm space-y-1" style={{ background: "rgba(0,23,47,0.03)", borderLeft: "3px solid rgba(232,83,10,0.5)" }}>
        <p className="font-semibold" style={{ color: navy }}>{c.cause}</p>
        {c.details && <p style={{ color: textSec }}>{c.details}</p>}
      </div>
    )),
  });
  if (fixes.length) sections.push({
    id: "diy", title: "DIY Quick Fixes",
    content: fixes.map((f: any, i: number) => (
      <div key={i} className="p-3 rounded-xl text-sm space-y-1" style={{ background: "rgba(0,23,47,0.03)" }}>
        <p className="font-semibold" style={{ color: navy }}>{f.action}</p>
        {f.description && <p style={{ color: textSec }}>{f.description}</p>}
        <p className="text-xs" style={{ color: textSec }}>{f.estimated_time} • {f.difficulty}</p>
      </div>
    )),
  });
  if (warnings.length) sections.push({
    id: "safety", title: "Safety Warnings",
    content: warnings.map((w: string, i: number) => (
      <div key={i} className="p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
        <span className="text-sm" style={{ color: "#92400E" }}>{w}</span>
      </div>
    )),
  });
  if (callPro.length) sections.push({
    id: "pro", title: "When to Call a Professional",
    content: callPro.map((p: string, i: number) => (
      <div key={i} className="p-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "#DC2626" }}>{p}</div>
    )),
  });

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <LavaLampBackground />
        <PageHeader title="Issue Detail" />
        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          {issue.image_url && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,23,47,0.08)" }}>
              <img src={issue.image_url} alt={issue.issue_title} className="w-full h-auto object-cover max-h-72" />
            </div>
          )}

          <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <h1 className="text-xl font-bold" style={{ color: navy }}>{issue.issue_title}</h1>
            {issue.brief_description && (
              <p className="text-sm" style={{ color: textSec }}>{issue.brief_description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: urg.bg, color: urg.color }}>{urg.label}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: "rgba(0,23,47,0.05)", color: navy }}>{issue.category}</span>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(0,23,47,0.05)", color: textSec }}>{new Date(issue.created_at).toLocaleDateString("en-GB")}</span>
            </div>
          </div>

          {costs && (
            <div className="rounded-2xl p-4 flex gap-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
              <div className="flex-1 text-center">
                <p className="text-xs" style={{ color: textSec }}>DIY Cost</p>
                <p className="text-lg font-semibold" style={{ color: "var(--color-success)" }}>£{costs.diy_min}–£{costs.diy_max}</p>
              </div>
              <div className="w-px" style={{ background: "rgba(0,23,47,0.08)" }} />
              <div className="flex-1 text-center">
                <p className="text-xs" style={{ color: textSec }}>Professional</p>
                <p className="text-lg font-semibold" style={{ color: "var(--color-primary)" }}>£{costs.professional_min}–£{costs.professional_max}</p>
              </div>
            </div>
          )}

          {sections.map(({ id: sId, title, content }) => (
            <div key={sId} className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
              <button onClick={() => setExpanded(expanded === sId ? null : sId)} className="w-full flex items-center justify-between p-4" style={{ minHeight: 52 }}>
                <span className="text-sm font-semibold" style={{ color: navy }}>{title}</span>
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

          {isPremium && (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    toast.loading("Generating PDF...", { id: "pdf" });
                    await generateTradesmanPdf(triage, diagnosis, issue.image_url);
                    toast.success("Report downloaded ✓", { id: "pdf" });
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to generate PDF", { id: "pdf" });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-semibold"
                style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: navy, minHeight: 44 }}
              >
                <FileText className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Export PDF
              </button>
              <button
                onClick={() => {
                  const { subject, body } = generateTradesmanEmail(triage, diagnosis);
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_self");
                }}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-semibold"
                style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: navy, minHeight: 44 }}
              >
                <Mail className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Email {tradeName}
              </button>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
