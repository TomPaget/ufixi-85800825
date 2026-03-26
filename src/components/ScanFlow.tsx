import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera, Video, Upload, ArrowLeft, MapPin, Tag,
  Droplets, Zap, Building2, Wind, Cpu, Wrench,
  Bot, ChevronDown, ChevronUp, ExternalLink, AlertTriangle,
  Loader2, CheckCircle2, Lightbulb, UserPlus, Clock
} from "lucide-react";
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

const MOCK_QUESTIONS = [
  { q: "How long has this issue been present?", options: ["Less than a day", "A few days", "About a week", "More than a week", "Not sure"] },
  { q: "Is the problem getting worse?", options: ["Yes, rapidly", "Yes, slowly", "Staying the same", "Not sure"] },
  { q: "Have you attempted any fixes?", options: ["No, haven't tried anything", "Yes, basic DIY", "Yes, called a professional", "Waiting for advice"] },
];

interface ScanFlowProps {
  onClose: () => void;
}

export default function ScanFlow({ onClose }: ScanFlowProps) {
  const [step, setStep] = useState(1);
  const [uploadMethod, setUploadMethod] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("causes");
  const [showSignup, setShowSignup] = useState(false);

  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleUploadOption = (id: string) => {
    setUploadMethod(id);
    // Trigger the hidden file input
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
      if (file) setUploadedFile(file);
    };
    input.click();
  };

  const totalSteps = 7;
  const canContinueStep1 = description.trim().length > 0 && !!category && !!uploadMethod;

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);
    if (questionIndex < MOCK_QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setStep(4);
      setTimeout(() => setStep(5), 2500);
    }
  };

  const handleSave = () => {
    setShowSignup(true);
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  const navy = "#00172F";
  const textSecondary = "#5A6A7A";
  const showLavaBg = step === 5 || step === 6;

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
        {step > 1 && !showSignup ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, color: navy }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : <div style={{ minWidth: 44 }} />}
        <img src={ufixiLogo} alt="Ufixi" className="h-7 object-contain" />
        <button onClick={onClose} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, color: navy }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress */}
      {!showSignup && (
        <div className="px-6 pb-5 relative z-10">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < step ? "var(--color-primary)" : "rgba(0,23,47,0.1)" }} />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 relative z-10">
        <AnimatePresence mode="wait">

          {/* Signup Prompt */}
          {showSignup && (
            <motion.div key="signup" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-8 py-8">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--gradient-primary)" }}>
                  <UserPlus className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl tracking-tight" style={{ color: navy, letterSpacing: "-0.02em" }}>Save Your Diagnosis</h2>
                <p className="text-base leading-relaxed max-w-sm mx-auto" style={{ color: textSecondary }}>
                  Create a free account to save this diagnosis for 45 days, track your issues, and access your repair history.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: CheckCircle2, text: "Save unlimited diagnostics" },
                  { icon: Clock, text: "Access history for 45 days" },
                  { icon: Bot, text: "AI-powered repair guidance" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
                    <Icon className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                    <span className="text-base" style={{ color: navy }}>{text}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-2xl p-4 text-base"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                />
                <input
                  type="password"
                  placeholder="Create a password"
                  className="w-full rounded-2xl p-4 text-base"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                />
                <GradientButton size="lg">Create Account & Save</GradientButton>
              </div>

              <button
                onClick={() => setShowSignup(false)}
                className="w-full text-center py-3 text-base"
                style={{ color: textSecondary }}
              >
                ← Back to results
              </button>
            </motion.div>
          )}

          {/* STEP 1 — Describe & Upload */}
          {!showSignup && step === 1 && (
            <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-7">
              <div className="space-y-2">
                <h2 className="text-3xl tracking-tight" style={{ color: navy, letterSpacing: "-0.02em" }}>Describe Your Issue</h2>
                <p className="text-base" style={{ color: textSecondary }}>Upload media and tell us about the problem</p>
              </div>

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
                      onClick={() => setUploadMethod(id)}
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
                    </button>
                  ))}
                </div>
              </div>

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
          {!showSignup && step === 2 && (
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

          {/* STEP 3 — Questions */}
          {!showSignup && step === 3 && (
            <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-7">
              {/* Progress dots */}
              <div className="flex justify-center gap-2.5">
                {MOCK_QUESTIONS.map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ background: i <= questionIndex ? "var(--color-primary)" : "rgba(0,23,47,0.12)" }} />
                ))}
              </div>

              {/* Bot message */}
              <div className="flex gap-3 items-start">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--gradient-primary)" }}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-md p-4 flex-1" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
                  <p className="text-base leading-relaxed" style={{ color: navy }}>
                    {MOCK_QUESTIONS[questionIndex].q}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pl-14">
                {MOCK_QUESTIONS[questionIndex].options.map((opt) => (
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
                {questionIndex < MOCK_QUESTIONS.length - 1 ? "Next" : "See Results"}
              </GradientButton>
            </motion.div>
          )}

          {/* STEP 4 — Loading results */}
          {!showSignup && step === 4 && (
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
                <h2 className="text-2xl tracking-tight" style={{ color: navy }}>Your Results Are Ready</h2>
                <p className="text-base" style={{ color: textSecondary }}>Generating your full AI diagnosis...</p>
              </div>
            </motion.div>
          )}

          {/* STEP 5 — Results */}
          {!showSignup && step === 5 && (
            <motion.div key="s5" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-5 pb-6">
              {/* Result header */}
              <div className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: "var(--color-success)" }} />
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(29,158,117,0.1)", color: "var(--color-success)" }}>AI Diagnosis Complete</span>
                </div>
                <h2 className="text-2xl tracking-tight" style={{ color: navy }}>{description || "Home Issue Detected"}</h2>
                <p className="text-base leading-relaxed" style={{ color: textSecondary }}>
                  Based on your description and our AI analysis, here's what we've found.
                </p>
              </div>

              {/* Accordion sections */}
              {[
                {
                  id: "causes", title: "What Caused This?", icon: Lightbulb,
                  content: (
                    <div className="space-y-3">
                      {["Worn components due to regular use", "Mineral buildup affecting seals", "Age-related degradation of materials"].map((c, i) => (
                        <div key={i} className="p-4 rounded-xl text-base leading-relaxed" style={{ background: "rgba(0,23,47,0.03)", borderLeft: "3px solid rgba(59,130,246,0.5)", color: navy }}>{c}</div>
                      ))}
                    </div>
                  ),
                },
                {
                  id: "diagnostic", title: "How to Check What's Wrong", icon: CheckCircle2,
                  content: (
                    <ol className="space-y-3 list-decimal list-inside text-base leading-relaxed" style={{ color: navy }}>
                      <li>Inspect the affected area carefully</li>
                      <li>Check for any visible damage or wear</li>
                      <li>Test related systems (water pressure, electrical, etc.)</li>
                      <li>Document findings with photos</li>
                    </ol>
                  ),
                },
                {
                  id: "products", title: "What You'll Need", icon: ExternalLink,
                  content: (
                    <div className="space-y-3">
                      {[
                        { name: "Repair Kit", term: "home+repair+kit" },
                        { name: "Sealant", term: "waterproof+sealant" },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
                          <span className="text-base" style={{ color: navy }}>{p.name}</span>
                          <a
                            href={`https://amazon.co.uk/s?k=${p.term}&tag=ufixi-21`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-sm font-semibold"
                            style={{ background: "#FFD814", color: "#0F1111" }}
                          >
                            Buy on Amazon
                          </a>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  id: "diy", title: "Quick Fixes to Try", icon: Wrench,
                  content: (
                    <div className="space-y-3">
                      <div className="flex gap-2 mb-3">
                        <span className="text-sm px-3 py-1 rounded-full" style={{ background: "rgba(29,158,117,0.1)", color: "var(--color-success)" }}>Easy • 30 min</span>
                      </div>
                      <ol className="space-y-3 list-decimal list-inside text-base leading-relaxed" style={{ color: navy }}>
                        <li>Turn off the relevant supply (water/electricity)</li>
                        <li>Inspect and clean the affected component</li>
                        <li>Replace worn parts if necessary</li>
                        <li>Test the repair and monitor for 24 hours</li>
                      </ol>
                    </div>
                  ),
                },
                {
                  id: "pro", title: "When to Call a Professional", icon: AlertTriangle,
                  content: (
                    <div className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                      <p className="text-base leading-relaxed" style={{ color: "#DC2626" }}>
                        If the issue persists after attempting DIY fixes, or if you notice the problem worsening, contact a qualified professional immediately. Safety-critical issues should never be delayed.
                      </p>
                    </div>
                  ),
                },
              ].map(({ id, title, icon: Icon, content }) => (
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
              <button
                onClick={onClose}
                className="w-full text-center py-3 text-base"
                style={{ color: textSecondary }}
              >
                Close without saving
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
