import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera, Video, Upload, ArrowLeft, MapPin, Tag,
  Droplets, Zap, Building2, Wind, Cpu, Wrench,
  Bot, ChevronDown, ChevronUp, ExternalLink, AlertTriangle,
  Loader2, CheckCircle2, Lightbulb, UserPlus, Clock,
  Stethoscope, ShieldAlert, PoundSterling, Crown, Lock, FileText, Mail
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import ufixiLogo from "@/assets/ufixi-logo.svg";
import GradientButton from "./GradientButton";
import LavaLampBackground from "./LavaLampBackground";

const CATEGORIES = [
  { id: "plumbing", label: "Plumbing", icon: Droplets },
  { id: "electrical", label: "Electrical", icon: Zap },
  { id: "structural", label: "Structural", icon: Building2 },
  { id: "hvac", label: "HVAC", icon: Wind },
  { id: "appliance", label: "Appliance", icon: Cpu },
  { id: "other", label: "Other", icon: Wrench },
];

const FOLLOW_UP_QUESTIONS = [
  { q: "How long has this issue been present?", options: ["Less than a day", "A few days", "About a week", "More than a week", "Not sure"] },
  { q: "Is the problem getting worse?", options: ["Yes, rapidly", "Yes, slowly", "Staying the same", "Not sure"] },
  { q: "Have you attempted any fixes?", options: ["No, haven't tried anything", "Yes, basic DIY", "Yes, called a professional", "Waiting for advice"] },
];

const PREMIUM_BENEFITS = [
  { icon: CheckCircle2, text: "Save unlimited diagnoses" },
  { icon: Clock, text: "Access scan history for 45 days" },
  { icon: X, text: "No ads during diagnosis" },
  { icon: Zap, text: "Priority AI analysis" },
  { icon: Mail, text: "Landlord letter generator" },
  { icon: FileText, text: "Export diagnosis as PDF" },
];

interface ScanFlowProps {
  onClose: () => void;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ScanFlow({ onClose }: ScanFlowProps) {
  const [step, setStep] = useState(1);
  const [uploadMethod, setUploadMethod] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("causes");
  const [showSavePrompt, setShowSavePrompt] = useState<"upgrade" | "auth" | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [triage, setTriage] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Ad state
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [adDone, setAdDone] = useState(false);
  const [pendingResults, setPendingResults] = useState<{ triage: any; diagnosis: any } | null>(null);
  const { isPremium, startCheckout } = useSubscription();

  const handleUploadOption = (id: string) => {
    setUploadMethod(id);
    const input = document.createElement("input");
    input.type = "file";
    if (id === "photo") {
      input.accept = "image/*";
      input.capture = "environment";
    } else if (id === "video") {
      input.accept = "video/*";
      input.capture = "environment";
    } else {
      input.accept = "image/*,video/*";
    }
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploadedFile(file);
        if (file.type.startsWith("image/")) {
          setUploadedPreviewUrl(URL.createObjectURL(file));
        } else if (file.type.startsWith("video/")) {
          setUploadedPreviewUrl(URL.createObjectURL(file));
        }
      }
    };
    input.click();
  };

  const totalSteps = 7;

  const collectAnonymisedData = async (triageData: any, diagnosisData: any) => {
    try {
      const sessionHash = crypto.randomUUID();
      const urgency = diagnosisData?.urgency_assessment?.level;
      const diyMin = diagnosisData?.estimated_costs?.diy_min || 0;
      const diyMax = diagnosisData?.estimated_costs?.diy_max || 0;
      const proMin = diagnosisData?.estimated_costs?.professional_min || 0;
      const proMax = diagnosisData?.estimated_costs?.professional_max || 0;
      const hasDiy = diagnosisData?.diy_quick_fixes?.length > 0;
      const priority = urgency === "fix_now" ? "critical" : urgency === "fix_soon" ? "high" : urgency === "monitor" ? "medium" : "low";

      await supabase.from("anonymised_insights").insert({
        issue_type: triageData?.category || category || "other",
        issue_title: triageData?.issue_title || triageData?.brief_description || "Unknown",
        category: triageData?.category || category || "other",
        urgency,
        severity_score: urgency === "fix_now" ? 9 : urgency === "fix_soon" ? 6 : urgency === "monitor" ? 3 : 1,
        priority,
        diy_safe: hasDiy,
        diy_cost_estimate: Math.round((diyMin + diyMax) / 2),
        pro_cost_estimate: Math.round((proMin + proMax) / 2),
        user_tier: isPremium ? "premium" : "free",
        session_id: sessionHash,
        status: "active",
      } as any);
    } catch (err) {
      console.error("Anonymised data collection error:", err);
    }
  };

  const canContinueStep1 = description.trim().length > 0 && !!category && !!uploadMethod;

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);
    if (questionIndex < FOLLOW_UP_QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setStep(4);
      runAIAnalysis(newAnswers);
    }
  };

  const runAIAnalysis = async (finalAnswers: string[]) => {
    setIsAnalysing(true);
    setAiError(null);
    try {
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      if (uploadedFile && uploadedFile.type.startsWith("image/")) {
        imageBase64 = await fileToBase64(uploadedFile);
        imageMimeType = uploadedFile.type;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-issue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            description,
            location,
            category,
            answers: finalAnswers,
            imageBase64,
            imageMimeType,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.success) {
        if (data.error === "not_home_issue") {
          setAiError("The uploaded image doesn't appear to show a home maintenance issue. Please try again with a clearer photo.");
          setStep(1);
          toast.error("That doesn't look like a home issue.");
          return;
        }
        throw new Error(data.error || "Analysis failed");
      }

      // Silently collect anonymised data
      collectAnonymisedData(data.triage, data.diagnosis);

      // If free user, show ad before results
      if (!isPremium) {
        setPendingResults({ triage: data.triage, diagnosis: data.diagnosis });
        const adTime = Math.floor(Math.random() * 6) + 15;
        setAdCountdown(adTime);
        setAdDone(false);
        setShowAd(true);
        setIsAnalysing(false);
      } else {
        setTriage(data.triage);
        setDiagnosis(data.diagnosis);
        setStep(5);
      }
    } catch (err: any) {
      console.error("AI analysis error:", err);
      setAiError(err.message);
      toast.error(err.message || "Analysis failed. Please try again.");
      setStep(1);
    } finally {
      setIsAnalysing(false);
    }
  };

  // Ad countdown timer
  useEffect(() => {
    if (!showAd || adCountdown <= 0) return;
    const timer = setTimeout(() => {
      if (adCountdown <= 1) {
        setAdDone(true);
        setAdCountdown(0);
      } else {
        setAdCountdown(adCountdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [showAd, adCountdown]);

  const handleAdContinue = () => {
    if (pendingResults) {
      setTriage(pendingResults.triage);
      setDiagnosis(pendingResults.diagnosis);
      setPendingResults(null);
    }
    setShowAd(false);
    setStep(5);
  };

  const handleSave = () => {
    if (isPremium) {
      // TODO: actually save to database
      toast.success("Diagnosis Saved ✓");
    } else {
      // Show upgrade prompt
      setShowSavePrompt("upgrade");
    }
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  const navy = "#00172F";
  const textSecondary = "#5A6A7A";
  const showLavaBg = step === 5 || step === 6;

  // Gradient progress bar color
  const getProgressColor = (index: number, currentStep: number) => {
    if (index >= currentStep) return "rgba(0,23,47,0.1)";
    const t = index / Math.max(totalSteps - 1, 1);
    // Interpolate from #E8530A (orange) to #D93870 (pink)
    const r = Math.round(232 + (217 - 232) * t);
    const g = Math.round(83 + (56 - 83) * t);
    const b = Math.round(10 + (112 - 10) * t);
    return `rgb(${r},${g},${b})`;
  };

  // Build results sections from real AI data
  const resultSections = diagnosis ? [
    {
      id: "causes", title: "What Caused This?", icon: Lightbulb,
      content: (
        <div className="space-y-3">
          {diagnosis.likely_causes?.map((c: any, i: number) => (
            <div key={i} className="p-4 rounded-xl text-base leading-relaxed" style={{ background: "rgba(0,23,47,0.03)", borderLeft: "3px solid rgba(59,130,246,0.5)", color: navy }}>
              <p className="font-semibold mb-1">{c.cause}</p>
              <p style={{ color: textSecondary }}>{c.details}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "diagnostic", title: "How to Check", icon: Stethoscope,
      content: (
        <div className="space-y-3">
          {diagnosis.diagnostic_steps?.map((s: any, i: number) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(0,23,47,0.03)", border: "1px solid rgba(0,23,47,0.06)" }}>
              <p className="text-base font-semibold mb-1" style={{ color: navy }}>Step {s.step_number}: {s.action}</p>
              <p className="text-sm" style={{ color: textSecondary }}>{s.what_to_look_for}</p>
              {s.safety_note && (
                <p className="text-sm mt-2 flex items-center gap-1" style={{ color: "#F59E0B" }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> {s.safety_note}
                </p>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "diy", title: "Quick Fixes", icon: Wrench,
      content: (
        <div className="space-y-4">
          {diagnosis.diy_quick_fixes?.map((fix: any, i: number) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-base" style={{ color: navy }}>{fix.action}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: fix.difficulty === "Easy" ? "rgba(29,158,117,0.1)" : fix.difficulty === "Moderate" ? "rgba(240,144,10,0.1)" : "rgba(220,38,38,0.1)", color: fix.difficulty === "Easy" ? "var(--color-success)" : fix.difficulty === "Moderate" ? "#F0900A" : "#DC2626" }}>{fix.difficulty} • {fix.estimated_time}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>{fix.description}</p>
              {fix.tools_required?.length > 0 && (
                <p className="text-xs mt-2" style={{ color: textSecondary }}>Tools: {fix.tools_required.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "products", title: "What You'll Need", icon: ExternalLink,
      content: (
        <div className="space-y-3">
          {diagnosis.tools_and_materials?.map((p: any, i: number) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-semibold" style={{ color: navy }}>{p.product_name}</span>
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
              {p.estimated_cost && <p className="text-sm" style={{ color: textSecondary }}>{p.estimated_cost}</p>}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "costs", title: "Estimated Costs", icon: PoundSterling,
      content: (
        <div className="rounded-xl p-4 flex gap-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
          <div className="flex-1 text-center">
            <p className="text-xs" style={{ color: textSecondary }}>DIY Cost</p>
            <p className="text-lg font-semibold" style={{ color: "var(--color-success)" }}>£{diagnosis.estimated_costs?.diy_min}–£{diagnosis.estimated_costs?.diy_max}</p>
          </div>
          <div className="w-px" style={{ background: "rgba(0,23,47,0.08)" }} />
          <div className="flex-1 text-center">
            <p className="text-xs" style={{ color: textSecondary }}>Professional</p>
            <p className="text-lg font-semibold" style={{ color: "var(--color-primary)" }}>£{diagnosis.estimated_costs?.professional_min}–£{diagnosis.estimated_costs?.professional_max}</p>
          </div>
        </div>
      ),
    },
    {
      id: "safety", title: "Safety Warnings", icon: ShieldAlert,
      content: (
        <div className="space-y-3">
          {diagnosis.safety_warnings?.map((w: string, i: number) => (
            <div key={i} className="p-4 rounded-xl flex items-start gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
              <span className="text-sm" style={{ color: "#92400E" }}>{w}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "pro", title: "When to Call a Pro", icon: AlertTriangle,
      content: (
        <div className="space-y-2">
          {diagnosis.call_pro_if?.map((c: string, i: number) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
              <p className="text-base leading-relaxed" style={{ color: "#DC2626" }}>• {c}</p>
            </div>
          ))}
        </div>
      ),
    },
  ] : [];

  // --- AD OVERLAY ---
  if (showAd) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <LavaLampBackground />
        <div className="relative z-10 w-full max-w-md px-6 space-y-6 text-center">
          <div className="rounded-2xl p-8 space-y-5" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--gradient-primary)" }}>
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: navy }}>Upgrade to Premium</h2>
            <p className="text-base" style={{ color: textSecondary }}>No ads, unlimited scans, save forever.</p>
            <div className="space-y-2 text-left">
              {["No ads during diagnosis", "Save unlimited scans", "Priority AI analysis", "Export as PDF"].map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-success)" }} />
                  <span className="text-sm" style={{ color: navy }}>{b}</span>
                </div>
              ))}
            </div>
            <p className="text-lg font-bold" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Just £3.99/month
            </p>
          </div>

          <div className="space-y-3">
            {!adDone ? (
              <div className="py-4">
                <p className="text-sm font-semibold" style={{ color: textSecondary }}>
                  Ad closes in {adCountdown}s...
                </p>
                <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,23,47,0.08)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: adCountdown, ease: "linear" }}
                  />
                </div>
              </div>
            ) : (
              <GradientButton size="lg" onClick={handleAdContinue}>
                Continue to Results →
              </GradientButton>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--color-bg)" }}
    >
      {showLavaBg && <LavaLampBackground />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 relative z-10" style={{ minHeight: 56 }}>
        {step > 1 && !showSavePrompt ? (
          <button onClick={() => { if (step === 4 && isAnalysing) return; setStep(step - 1); }} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, color: navy }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : <div style={{ minWidth: 44 }} />}
        <img src={ufixiLogo} alt="Ufixi" className="h-7 object-contain" />
        <button onClick={onClose} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, color: navy }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar — orange to pink gradient */}
      {!showSavePrompt && (
        <div className="px-6 pb-5 relative z-10">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full" style={{ background: getProgressColor(i, step) }} />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 relative z-10">
        <AnimatePresence mode="wait">

          {/* PREMIUM UPGRADE PROMPT */}
          {showSavePrompt === "upgrade" && (
            <motion.div key="upgrade" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-7 py-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--gradient-primary)" }}>
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl tracking-tight font-bold" style={{ color: navy }}>Save Your Diagnosis</h2>
                <p className="text-base" style={{ color: textSecondary }}>Saving scans is a Premium feature</p>
              </div>

              <div className="space-y-3">
                {PREMIUM_BENEFITS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-success)" }} />
                    <span className="text-base" style={{ color: navy }}>✓ {text}</span>
                  </div>
                ))}
              </div>

              <GradientButton size="lg" onClick={() => { onClose(); window.location.href = "/upgrade"; }}>
                Upgrade to Premium
              </GradientButton>

              <button onClick={() => setShowSavePrompt(null)} className="w-full text-center py-3 text-base" style={{ color: textSecondary }}>
                Close without saving
              </button>
            </motion.div>
          )}

          {/* STEP 1 — Describe & Upload */}
          {!showSavePrompt && step === 1 && (
            <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-7">
              <div className="space-y-2">
                <h2 className="text-3xl tracking-tight" style={{ color: navy, letterSpacing: "-0.02em" }}>Describe Your Issue</h2>
                <p className="text-base" style={{ color: textSecondary }}>Upload media and tell us about the problem</p>
              </div>

              {aiError && (
                <div className="p-4 rounded-2xl" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                  <p className="text-sm" style={{ color: "#DC2626" }}>{aiError}</p>
                </div>
              )}

              {/* Upload section */}
              <div className="space-y-2">
                <label className="text-base font-semibold flex items-center gap-2" style={{ color: navy }}>
                  <Camera className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Upload Evidence
                </label>
                <div className="space-y-3">
                  {[
                    { id: "photo", label: "Take Photo", sub: "Use your camera", icon: Camera },
                    { id: "video", label: "Record Video", sub: "Up to 30 seconds", icon: Video },
                    { id: "upload", label: "Upload Media", sub: "From your gallery", icon: Upload },
                  ].map(({ id, label, sub, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => handleUploadOption(id)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
                      style={{
                        background: uploadMethod === id ? "rgba(232,83,10,0.08)" : "white",
                        border: `2px solid ${uploadMethod === id ? "var(--color-primary)" : "rgba(0,23,47,0.08)"}`,
                        minHeight: 56,
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,83,10,0.08)" }}>
                        <Icon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div className="text-left">
                        <p className="text-base font-semibold" style={{ color: navy }}>{label}</p>
                        <p className="text-sm" style={{ color: textSecondary }}>{sub}</p>
                      </div>
                      {uploadMethod === id && uploadedFile && (
                        <span className="ml-auto text-xs px-2 py-1 rounded-full" style={{ background: "rgba(29,158,117,0.1)", color: "var(--color-success)" }}>
                          ✓ {uploadedFile.name.slice(0, 15)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Preview */}
              {uploadedPreviewUrl && uploadedFile && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,23,47,0.08)" }}>
                  {uploadedFile.type.startsWith("image/") ? (
                    <img src={uploadedPreviewUrl} alt="Uploaded preview" className="w-full h-auto max-h-64 object-cover" />
                  ) : uploadedFile.type.startsWith("video/") ? (
                    <video src={uploadedPreviewUrl} controls className="w-full max-h-64" />
                  ) : null}
                </div>
              )}

              {/* Tips */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(232,83,10,0.06)", border: "1px solid rgba(232,83,10,0.12)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>💡 Tips for best results</p>
                <ul className="text-sm space-y-1.5" style={{ color: textSecondary }}>
                  <li>• Good lighting helps AI accuracy</li>
                  <li>• Capture the full affected area</li>
                  <li>• Include close-ups of damage</li>
                </ul>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-base font-semibold" style={{ color: navy }}>What's the problem?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you see..."
                  className="w-full rounded-2xl p-4 text-base resize-none"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: navy, minHeight: 110 }}
                  rows={4}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-base font-semibold flex items-center gap-2" style={{ color: navy }}>
                  <MapPin className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Where is it located?
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Kitchen, Bathroom, Living Room..."
                  className="w-full rounded-2xl p-4 text-base"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                />
              </div>

              {/* Category */}
              <div className="space-y-3">
                <label className="text-base font-semibold flex items-center gap-2" style={{ color: navy }}>
                  <Tag className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Issue Category
                </label>
                <div className="space-y-2">
                  {CATEGORIES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setCategory(id)}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
                      style={{
                        background: category === id ? "rgba(232,83,10,0.08)" : "white",
                        border: `2px solid ${category === id ? "var(--color-primary)" : "rgba(0,23,47,0.08)"}`,
                        minHeight: 52,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: category === id ? "var(--color-primary)" : textSecondary }} />
                      <span className="text-base font-semibold" style={{ color: navy }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <GradientButton disabled={!canContinueStep1} onClick={() => setStep(2)} size="lg">Continue</GradientButton>
            </motion.div>
          )}

          {/* STEP 2 — AI Triage loading */}
          {!showSavePrompt && step === 2 && (
            <motion.div
              key="s2"
              variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center text-center py-20 space-y-7"
              onAnimationComplete={() => setTimeout(() => setStep(3), 2000)}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Loader2 className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl tracking-tight" style={{ color: navy }}>Analysing Your Issue</h2>
              <p className="text-base max-w-xs" style={{ color: textSecondary }}>
                Our AI is examining your upload and generating diagnostic questions...
              </p>
            </motion.div>
          )}

          {/* STEP 3 — Questions with gradient progress dots */}
          {!showSavePrompt && step === 3 && (
            <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-7">
              <div className="flex justify-center gap-2.5">
                {FOLLOW_UP_QUESTIONS.map((_, i) => {
                  const t = i / Math.max(FOLLOW_UP_QUESTIONS.length - 1, 1);
                  const dotColor = i <= questionIndex
                    ? `rgb(${Math.round(232 + (217 - 232) * t)},${Math.round(83 + (56 - 83) * t)},${Math.round(10 + (112 - 10) * t)})`
                    : "rgba(0,23,47,0.12)";
                  return <div key={i} className="w-3 h-3 rounded-full" style={{ background: dotColor }} />;
                })}
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--gradient-primary)" }}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-md p-4 flex-1" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
                  <p className="text-base leading-relaxed" style={{ color: navy }}>
                    {FOLLOW_UP_QUESTIONS[questionIndex].q}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-14">
                {FOLLOW_UP_QUESTIONS[questionIndex].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedAnswer(opt)}
                    className="w-full text-left p-4 rounded-2xl text-base transition-all active:scale-[0.98]"
                    style={{
                      background: selectedAnswer === opt ? "rgba(232,83,10,0.08)" : "white",
                      border: `2px solid ${selectedAnswer === opt ? "var(--color-primary)" : "rgba(0,23,47,0.08)"}`,
                      color: navy,
                      minHeight: 52,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <GradientButton disabled={!selectedAnswer} onClick={handleNextQuestion} size="lg">
                {questionIndex < FOLLOW_UP_QUESTIONS.length - 1 ? "Next" : "See Results"}
              </GradientButton>
            </motion.div>
          )}

          {/* STEP 4 — Loading results (AI is running) */}
          {!showSavePrompt && step === 4 && (
            <motion.div
              key="s4"
              variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center text-center py-20 space-y-7"
            >
              <div className="rounded-2xl p-8 text-center space-y-5" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-10 h-10 mx-auto" style={{ color: "var(--color-primary)" }} />
                </motion.div>
                <h2 className="text-2xl tracking-tight" style={{ color: navy }}>Generating Your Diagnosis</h2>
                <p className="text-base" style={{ color: textSecondary }}>Our AI is analysing the image and building a repair guide...</p>
                <p className="text-sm" style={{ color: textSecondary }}>This usually takes 10–20 seconds</p>
              </div>
            </motion.div>
          )}

          {/* STEP 5 — Real AI Results */}
          {!showSavePrompt && step === 5 && diagnosis && (
            <motion.div key="s5" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-5 pb-6">
              {/* Uploaded image preview */}
              {uploadedPreviewUrl && uploadedFile?.type.startsWith("image/") && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,23,47,0.08)" }}>
                  <img src={uploadedPreviewUrl} alt="Scanned issue" className="w-full h-auto max-h-56 object-cover" />
                </div>
              )}

              {/* Result header */}
              <div className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: "var(--color-success)" }} />
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(29,158,117,0.1)", color: "var(--color-success)" }}>AI Diagnosis Complete</span>
                </div>
                <h2 className="text-2xl tracking-tight font-bold" style={{ color: navy }}>{triage?.issue_title || triage?.brief_description || "Issue Detected"}</h2>
                <p className="text-base" style={{ color: textSecondary }}>{triage?.brief_description}</p>
                <p className="text-sm" style={{ color: textSecondary }}>
                  {triage?.category} • {triage?.confidence} confidence
                </p>

                {/* Urgency badge */}
                {diagnosis.urgency_assessment && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{
                      background: diagnosis.urgency_assessment.level === "fix_now" ? "rgba(220,38,38,0.1)" : diagnosis.urgency_assessment.level === "fix_soon" ? "rgba(240,144,10,0.1)" : "rgba(107,122,141,0.1)",
                      color: diagnosis.urgency_assessment.level === "fix_now" ? "#DC2626" : diagnosis.urgency_assessment.level === "fix_soon" ? "#F0900A" : "#6B7A8D",
                    }}>
                      {diagnosis.urgency_assessment.level.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-sm" style={{ color: textSecondary }}>{diagnosis.urgency_assessment.reason}</span>
                  </div>
                )}
              </div>

              {/* Accordion sections */}
              {resultSections.map(({ id, title, icon: Icon, content }) => (
                <div key={id} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)" }}>
                  <button
                    onClick={() => setExpandedSection(expandedSection === id ? null : id)}
                    className="w-full flex items-center justify-between p-5 text-left"
                    style={{ minHeight: 56 }}
                  >
                    <span className="flex items-center gap-2.5 text-base font-semibold" style={{ color: navy }}>
                      <Icon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                      {title}
                    </span>
                    {expandedSection === id ? <ChevronUp className="w-5 h-5" style={{ color: "#9aa5b4" }} /> : <ChevronDown className="w-5 h-5" style={{ color: "#9aa5b4" }} />}
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
                        <div className="px-5 pb-5">{content}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <GradientButton size="lg" onClick={handleSave}>Save Full Diagnosis</GradientButton>
              <button onClick={onClose} className="w-full text-center py-3 text-base" style={{ color: textSecondary }}>
                Close without saving
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
