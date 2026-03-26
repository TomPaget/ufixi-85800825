import { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import GradientButton from "@/components/GradientButton";

const FAQ = [
  { q: "How does the AI scan work?", a: "Upload a photo or video of your home issue and our AI will analyse it, identify the problem, and provide a diagnosis with repair recommendations." },
  { q: "How many free scans do I get?", a: "Free users get 3 scans per month. Upgrade to Premium for unlimited scans." },
  { q: "How long are my scans saved?", a: "Saved scans are retained for 45 days, after which they are automatically deleted." },
  { q: "Is my data secure?", a: "Yes, all data is encrypted and stored securely. We do not share personal information with third parties." },
];

export default function Support() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <PageTransition>
      <div className="min-h-screen pb-8" style={{ background: "var(--color-bg)" }}>
        <PageHeader title="Support" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-6">
          {/* Contact form */}
          <div className="space-y-4">
            <h2 className="text-lg" style={{ color: "var(--color-navy)" }}>Get in Touch</h2>
            <input placeholder="Your name" className="w-full rounded-2xl p-4 text-sm" style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: "var(--color-navy)" }} />
            <input placeholder="Email address" className="w-full rounded-2xl p-4 text-sm" style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: "var(--color-navy)" }} />
            <textarea placeholder="How can we help?" className="w-full rounded-2xl p-4 text-sm resize-none" style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: "var(--color-navy)", minHeight: 100 }} rows={4} />
            <GradientButton size="lg">
              <span className="flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> Send Message</span>
            </GradientButton>
          </div>

          {/* FAQ */}
          <div className="space-y-3">
            <h2 className="text-lg" style={{ color: "var(--color-navy)" }}>Frequently Asked Questions</h2>
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
                <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left" style={{ minHeight: 48 }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{item.q}</span>
                  {expanded === i ? <ChevronUp className="w-4 h-4" style={{ color: "#9aa5b4" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#9aa5b4" }} />}
                </button>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-4 pb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
