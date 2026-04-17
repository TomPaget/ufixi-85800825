import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, AlertTriangle, ExternalLink,
  Lightbulb, Wrench, ShieldAlert, PoundSterling, CheckCircle2,
  Stethoscope, Youtube, ShoppingBag, Clock, Phone, Share2
} from "lucide-react";
import GradientButton from "./GradientButton";
import DiagnosisChatbot from "./DiagnosisChatbot";
import { generateTradesmanEmail } from "@/lib/generateTradesmanPdf";
import { buildTradesmanPdf, downloadPdf, sharePdf, emailPdfToTradesperson } from "@/lib/pdfDelivery";
import { getTradeNameForCategory } from "@/lib/tradeNameMap";
import { useSubscription } from "@/hooks/useSubscription";
import { FileText, Mail, Lock, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DiagnosisResultsProps {
  triage: any;
  diagnosis: any;
  uploadedPreviewUrl: string | null;
  uploadedFileType: string | null;
  onSave: () => void;
  onClose: () => void;
  /** When true, hides the Save / Close-without-saving buttons (used in IssueDetail view of saved issues). */
  hideSaveActions?: boolean;
}

const navy = "#00172F";
const textSecondary = "#5A6A7A";

function AccordionSection({
  id,
  title,
  icon: Icon,
  expandedSection,
  setExpandedSection,
  children,
  borderColor,
}: {
  id: string;
  title: string;
  icon: any;
  expandedSection: string | null;
  setExpandedSection: (id: string | null) => void;
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        border: borderColor ? `1px solid ${borderColor}` : "1px solid rgba(0,23,47,0.08)",
      }}
    >
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ minHeight: 56 }}
      >
        <span className="flex items-center gap-2.5 text-base font-semibold" style={{ color: navy }}>
          <Icon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          {title}
        </span>
        {expandedSection === id ? (
          <ChevronUp className="w-5 h-5" style={{ color: "#9aa5b4" }} />
        ) : (
          <ChevronDown className="w-5 h-5" style={{ color: "#9aa5b4" }} />
        )}
      </button>
      <AnimatePresence>
        {expandedSection === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DiagnosisResults({
  triage,
  diagnosis,
  uploadedPreviewUrl,
  uploadedFileType,
  onSave,
  onClose,
  hideSaveActions = false,
}: DiagnosisResultsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("causes");
  const { isPremium } = useSubscription();
  const tradeName = getTradeNameForCategory(triage?.category);
  const navigate = useNavigate();

  const issueTitle = triage?.issue_title || "Issue Detected";
  const briefDescription = triage?.brief_description || "";
  const categoryLabel = triage?.category || "other";
  const confidence = triage?.confidence || "medium";
  const urgency = diagnosis?.urgency_assessment;

  // Build YouTube search term from issue
  const youtubeSearchTerm = `how to fix ${issueTitle} UK DIY`;

  // Cost savings calculation
  const diyMin = diagnosis?.estimated_costs?.diy_min || 0;
  const diyMax = diagnosis?.estimated_costs?.diy_max || 0;
  const proMin = diagnosis?.estimated_costs?.professional_min || 0;
  const proMax = diagnosis?.estimated_costs?.professional_max || 0;
  const avgDiy = Math.round((diyMin + diyMax) / 2);
  const avgPro = Math.round((proMin + proMax) / 2);
  const savings = avgPro - avgDiy;

  // Chatbot context
  const causesForChat = diagnosis?.likely_causes?.map((c: any) => `${c.cause}: ${c.details}`) || [];
  const fixesForChat = diagnosis?.diy_quick_fixes?.map((f: any) => `${f.action}: ${f.description}`) || [];
  const warningsForChat = diagnosis?.safety_warnings || [];

  return (
    <motion.div
      key="diagnosis-results"
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 pb-6"
    >
      {/* 1. Uploaded image — full width */}
      {uploadedPreviewUrl && uploadedFileType?.startsWith("image/") && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,23,47,0.08)" }}>
          <img src={uploadedPreviewUrl} alt="Scanned issue" className="w-full h-auto object-cover" />
        </div>
      )}
      {uploadedPreviewUrl && uploadedFileType?.startsWith("video/") && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,23,47,0.08)" }}>
          <video src={uploadedPreviewUrl} controls className="w-full" />
        </div>
      )}

      {/* 2. AI Diagnosis Complete badge */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" style={{ color: "var(--color-success)" }} />
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ background: "rgba(29,158,117,0.1)", color: "var(--color-success)" }}
        >
          ✓ AI Diagnosis Complete
        </span>
      </div>

      {/* 3-6. Header card with title, description, tags, urgency */}
      <div
        className="rounded-2xl p-6 space-y-3"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,23,47,0.08)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h2 className="text-2xl tracking-tight font-bold" style={{ color: navy }}>
          {issueTitle}
        </h2>
        <p className="text-base leading-relaxed" style={{ color: textSecondary }}>
          {briefDescription}
        </p>
        <div className="flex flex-wrap gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
            style={{ background: "rgba(0,23,47,0.05)", color: navy }}
          >
            {categoryLabel}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}
          >
            {confidence} confidence
          </span>
        </div>
      </div>

      {/* Urgency banner */}
      {urgency && (urgency.level === "fix_now" || urgency.level === "fix_soon") && (
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: urgency.level === "fix_now" ? "rgba(220,38,38,0.08)" : "rgba(245,158,11,0.08)",
            border: `1px solid ${urgency.level === "fix_now" ? "rgba(220,38,38,0.2)" : "rgba(245,158,11,0.2)"}`,
          }}
        >
          <AlertTriangle
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            style={{ color: urgency.level === "fix_now" ? "#DC2626" : "#F59E0B" }}
          />
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: urgency.level === "fix_now" ? "#DC2626" : "#92400E" }}
            >
              {urgency.level.replace("_", " ").toUpperCase()}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: urgency.level === "fix_now" ? "#991B1B" : "#92400E" }}
            >
              {urgency.reason}
            </p>
          </div>
        </div>
      )}

      {/* === ACCORDION SECTIONS === */}

      {/* 1. What Caused This? */}
      <AccordionSection
        id="causes"
        title="What Caused This?"
        icon={Lightbulb}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
      >
        <div className="space-y-3">
          {diagnosis?.likely_causes?.length > 0 ? (
            diagnosis.likely_causes.map((c: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl text-base leading-relaxed"
                style={{
                  background: "rgba(0,23,47,0.03)",
                  borderLeft: "3px solid rgba(59,130,246,0.5)",
                  color: navy,
                }}
              >
                <p className="font-semibold mb-1">{c.cause}</p>
                <p style={{ color: textSecondary }}>{c.details}</p>
              </div>
            ))
          ) : (
            <p className="text-sm" style={{ color: textSecondary }}>No specific causes identified.</p>
          )}
        </div>
      </AccordionSection>

      {/* 2. How to Check + YouTube tutorials */}
      <AccordionSection
        id="diagnostic"
        title="How to Check / Fix"
        icon={Stethoscope}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
      >
        <div className="space-y-4">
          {/* Diagnostic steps */}
          {diagnosis?.diagnostic_steps?.length > 0 ? (
            <div className="space-y-3">
              {diagnosis.diagnostic_steps.map((s: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{ background: "rgba(0,23,47,0.03)", border: "1px solid rgba(0,23,47,0.06)" }}
                >
                  <p className="text-base font-semibold mb-1" style={{ color: navy }}>
                    Step {s.step_number}: {s.action}
                  </p>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    {s.what_to_look_for}
                  </p>
                  {s.safety_note && (
                    <p className="text-sm mt-2 flex items-center gap-1" style={{ color: "#F59E0B" }}>
                      <AlertTriangle className="w-3.5 h-3.5" /> {s.safety_note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: textSecondary }}>
              No diagnostic steps available for this issue.
            </p>
          )}

          {/* YouTube tutorial links */}
          <div
            className="p-4 rounded-xl space-y-3"
            style={{ background: "rgba(220,38,38,0.03)", border: "1px solid rgba(220,38,38,0.1)" }}
          >
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color: navy }}>
              <Youtube className="w-5 h-5" style={{ color: "#FF0000" }} />
              Recommended DIY Tutorials
            </p>
            {[
              { label: `How to fix ${issueTitle.toLowerCase()}`, search: `how to fix ${issueTitle} UK DIY` },
              { label: `${categoryLabel} repair guide for beginners`, search: `${categoryLabel} repair guide beginners UK` },
              { label: `${issueTitle.toLowerCase()} step by step repair`, search: `${issueTitle} step by step repair UK` },
              { label: `When to call a ${categoryLabel} professional`, search: `when to call ${categoryLabel} professional UK` },
            ].map((tutorial, i) => (
              <a
                key={i}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(tutorial.search)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg transition-all active:scale-[0.98]"
                style={{ background: "white", border: "1px solid rgba(0,23,47,0.06)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,0,0,0.08)" }}
                >
                  <Youtube className="w-4 h-4" style={{ color: "#FF0000" }} />
                </div>
                <span className="text-sm flex-1" style={{ color: navy }}>
                  {tutorial.label}
                </span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textSecondary }} />
              </a>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* 3. Quick Fixes */}
      <AccordionSection
        id="diy"
        title="Quick Fixes"
        icon={Wrench}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
      >
        <div className="space-y-4">
          {diagnosis?.diy_quick_fixes?.length > 0 ? (
            diagnosis.diy_quick_fixes.map((fix: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl"
                style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-semibold text-base" style={{ color: navy }}>
                    {fix.action}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background:
                        fix.difficulty === "Easy"
                          ? "rgba(29,158,117,0.1)"
                          : fix.difficulty === "Moderate"
                          ? "rgba(240,144,10,0.1)"
                          : "rgba(220,38,38,0.1)",
                      color:
                        fix.difficulty === "Easy"
                          ? "var(--color-success)"
                          : fix.difficulty === "Moderate"
                          ? "#F0900A"
                          : "#DC2626",
                    }}
                  >
                    {fix.difficulty}
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: textSecondary }}>
                    <Clock className="w-3 h-3" /> {fix.estimated_time}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
                  {fix.description}
                </p>
                {fix.tools_required?.length > 0 && (
                  <p className="text-xs mt-2" style={{ color: textSecondary }}>
                    Tools: {fix.tools_required.join(", ")}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm" style={{ color: textSecondary }}>No quick fixes available.</p>
          )}
        </div>
      </AccordionSection>

      {/* 4. What You'll Need */}
      <AccordionSection
        id="products"
        title="What You'll Need"
        icon={ShoppingBag}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
      >
        <div className="space-y-3">
          {diagnosis?.tools_and_materials?.length > 0 ? (
            diagnosis.tools_and_materials.map((p: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl"
                style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex-1">
                    <p className="text-base font-semibold" style={{ color: navy }}>
                      {p.product_name}
                    </p>
                    {p.reason_needed && (
                      <p className="text-sm mt-1" style={{ color: textSecondary }}>
                        {p.reason_needed}
                      </p>
                    )}
                    {!p.reason_needed && p.description && (
                      <p className="text-sm mt-1" style={{ color: textSecondary }}>
                        {p.description}
                      </p>
                    )}
                    {p.estimated_cost && (
                      <p className="text-sm mt-1 font-semibold" style={{ color: "var(--color-success)" }}>
                        {p.estimated_cost}
                      </p>
                    )}
                  </div>
                  <a
                    href={`https://amazon.co.uk/s?k=${encodeURIComponent(p.search_term)}&tag=ufixi-21`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
                    style={{ background: "#FFD814", color: "#0F1111" }}
                  >
                    Buy on Amazon
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm" style={{ color: textSecondary }}>No products needed.</p>
          )}
        </div>
      </AccordionSection>

      {/* 5. Estimated Costs */}
      <AccordionSection
        id="costs"
        title="Estimated Costs"
        icon={PoundSterling}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
      >
        <div className="space-y-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}
          >
            <div className="flex gap-4 mb-4">
              <div className="flex-1 text-center">
                <p className="text-xs mb-1" style={{ color: textSecondary }}>
                  DIY Cost
                </p>
                <p className="text-xl font-bold" style={{ color: "var(--color-success)" }}>
                  £{diyMin}–£{diyMax}
                </p>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>
                  Materials only
                </p>
              </div>
              <div className="w-px" style={{ background: "rgba(0,23,47,0.08)" }} />
              <div className="flex-1 text-center">
                <p className="text-xs mb-1" style={{ color: textSecondary }}>
                  Professional
                </p>
                <p className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
                  £{proMin}–£{proMax}
                </p>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>
                  Labour + materials
                </p>
              </div>
            </div>

            {/* Repair time */}
            {diagnosis?.estimated_repair_time && (
              <div className="flex gap-4 pt-3" style={{ borderTop: "1px solid rgba(0,23,47,0.06)" }}>
                <div className="flex-1 text-center">
                  <p className="text-xs" style={{ color: textSecondary }}>DIY Time</p>
                  <p className="text-sm font-semibold" style={{ color: navy }}>
                    {diagnosis.estimated_repair_time.diy_time || "N/A"}
                  </p>
                </div>
                <div className="w-px" style={{ background: "rgba(0,23,47,0.08)" }} />
                <div className="flex-1 text-center">
                  <p className="text-xs" style={{ color: textSecondary }}>Pro Time</p>
                  <p className="text-sm font-semibold" style={{ color: navy }}>
                    {diagnosis.estimated_repair_time.professional_time || "N/A"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-center" style={{ color: textSecondary }}>
            Costs based on UK 2024–2025 market rates
          </p>

          {savings > 20 && (
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.15)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                You could save ~£{savings} by doing this yourself
              </p>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* 6. Safety Warnings */}
      <AccordionSection
        id="safety"
        title="Safety Warnings"
        icon={ShieldAlert}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
      >
        <div className="space-y-3">
          {diagnosis?.safety_warnings?.length > 0 ? (
            diagnosis.safety_warnings.map((w: string, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl flex items-start gap-2"
                style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                <span className="text-sm" style={{ color: "#92400E" }}>
                  {w}
                </span>
              </div>
            ))
          ) : (
            <div
              className="p-4 rounded-xl"
              style={{ background: "rgba(29,158,117,0.06)", border: "1px solid rgba(29,158,117,0.15)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-success)" }}>
                No immediate safety risks identified for this issue.
              </p>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* 7. When to Call a Professional */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(220,38,38,0.2)",
        }}
      >
        <button
          onClick={() => setExpandedSection(expandedSection === "pro" ? null : "pro")}
          className="w-full flex items-center justify-between p-5 text-left"
          style={{ minHeight: 56 }}
        >
          <span className="flex items-center gap-2.5 text-base font-semibold" style={{ color: "#DC2626" }}>
            <Phone className="w-5 h-5" style={{ color: "#DC2626" }} />
            When to Call a Professional
          </span>
          {expandedSection === "pro" ? (
            <ChevronUp className="w-5 h-5" style={{ color: "#9aa5b4" }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: "#9aa5b4" }} />
          )}
        </button>
        <AnimatePresence>
          {expandedSection === "pro" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                <div
                  className="p-4 rounded-xl space-y-2"
                  style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.1)" }}
                >
                  {diagnosis?.call_pro_if?.length > 0 ? (
                    diagnosis.call_pro_if.map((c: string, i: number) => (
                      <p key={i} className="text-sm leading-relaxed" style={{ color: "#991B1B" }}>
                        • {c}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: textSecondary }}>
                      No specific professional triggers identified.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inline AI Chatbot */}
      <DiagnosisChatbot
        issueTitle={issueTitle}
        category={categoryLabel}
        briefDescription={briefDescription}
        causes={causesForChat}
        fixes={fixesForChat}
        safetyWarnings={warningsForChat}
        diyCostRange={`£${diyMin}–£${diyMax}`}
        proCostRange={`£${proMin}–£${proMax}`}
      />

      {/* Export PDF + Share (premium) */}
      {isPremium ? (
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const { toast } = await import("sonner");
              try {
                toast.loading("Generating your PDF report...", { id: "pdf-gen" });
                const built = await buildTradesmanPdf(triage, diagnosis, uploadedPreviewUrl);
                await downloadPdf(built);
                toast.success("Report ready", { id: "pdf-gen" });
              } catch (e: any) {
                console.error("PDF generation failed:", e);
                toast.error(e?.message || "Failed to generate report", { id: "pdf-gen" });
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: navy, minHeight: 52 }}
          >
            <FileText className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            Export PDF
          </button>
          <button
            onClick={async () => {
              const { toast } = await import("sonner");
              try {
                toast.loading("Preparing your report to share...", { id: "pdf-share" });
                const built = await buildTradesmanPdf(triage, diagnosis, uploadedPreviewUrl);
                const message = `Ufixi diagnosis: ${issueTitle}${briefDescription ? `\n\n${briefDescription}` : ""}\n\nFull report attached.`;
                await sharePdf(built, message);
                toast.success("Ready to share", { id: "pdf-share" });
              } catch (e: any) {
                console.error("Share failed:", e);
                toast.error(e?.message || "Could not share. Try Export PDF instead.", { id: "pdf-share" });
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: navy, minHeight: 52 }}
          >
            <Share2 className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            Share
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate("/upgrade")}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-base font-semibold transition-all active:scale-95 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0,23,47,0.03), rgba(59,130,246,0.06))",
            border: "1px solid rgba(59,130,246,0.15)",
            color: textSecondary,
            minHeight: 52,
          }}
        >
          <Lock className="w-4 h-4" style={{ color: textSecondary }} />
          Export Report for {tradeName}
          <span
            className="ml-2 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "white" }}
          >
            <Crown className="w-3 h-3" />
            PRO
          </span>
        </button>
      )}

      {/* Email tradesman — premium only */}
      {isPremium && (
      <button
          onClick={async () => {
            const { toast } = await import("sonner");
            try {
              toast.loading(`Preparing email to your ${tradeName.toLowerCase()}...`, { id: "pdf-email" });
              const built = await buildTradesmanPdf(triage, diagnosis, uploadedPreviewUrl);
              const { subject, body } = generateTradesmanEmail(triage, diagnosis);
              const result = await emailPdfToTradesperson(built, subject, body);
              if (result.method === "native") {
                toast.success("Pick Mail to send with the report attached", { id: "pdf-email" });
              } else {
                toast.success("Report downloaded. Attach it to the email that just opened.", { id: "pdf-email" });
              }
            } catch (e: any) {
              console.error("Email tradesman failed:", e);
              toast.error(e?.message || "Could not start email. Try Export PDF instead.", { id: "pdf-email" });
            }
          }}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-base font-semibold transition-all active:scale-95"
          style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: navy, minHeight: 52 }}
        >
          <Mail className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          Email {tradeName}
      </button>
      )}
      {!isPremium && (
        <button
          onClick={() => navigate("/upgrade")}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-base font-semibold transition-all active:scale-95 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0,23,47,0.03), rgba(59,130,246,0.06))",
            border: "1px solid rgba(59,130,246,0.15)",
            color: textSecondary,
            minHeight: 52,
          }}
        >
          <Lock className="w-4 h-4" style={{ color: textSecondary }} />
          Email {tradeName}
          <span
            className="ml-2 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "white" }}
          >
            <Crown className="w-3 h-3" />
            PRO
          </span>
        </button>
      )}

      {/* Save / Close buttons (hidden when viewing an already-saved issue) */}
      {!hideSaveActions && (
        <>
          <GradientButton size="lg" onClick={onSave}>
            Save Diagnosis & Close
          </GradientButton>
          <button onClick={onClose} className="w-full text-center py-3 text-base" style={{ color: textSecondary }}>
            Close without saving
          </button>
        </>
      )}
      {hideSaveActions && (
        <button
          onClick={onClose}
          className="w-full text-center py-3 text-base font-semibold"
          style={{ color: "var(--color-primary)" }}
        >
          Back to My Issues
        </button>
      )}
    </motion.div>
  );
}
