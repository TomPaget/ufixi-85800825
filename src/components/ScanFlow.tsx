import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import {
  Camera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";
import {
  X, Camera as CameraIcon, Upload, ArrowLeft, MapPin, Tag,
  Droplets, Zap, Building2, Wind, Cpu, Wrench,
  Bot, ChevronDown, ChevronUp, AlertTriangle,
  Loader2, CheckCircle2, UserPlus, Crown, Lock, FileText, Mail
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdMob } from "@/hooks/useAdMob";
import { useInProgressScan } from "@/hooks/useInProgressScan";
import ufixiLogo from "@/assets/ufixi-logo.svg";
import GradientButton from "./GradientButton";
import LavaLampBackground from "./LavaLampBackground";
import DiagnosisResults from "./DiagnosisResults";

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
];

const PREMIUM_BENEFITS = [
  { icon: CheckCircle2, text: "Save unlimited diagnoses" },
  { icon: CheckCircle2, text: "Access scan history for 45 days" },
  { icon: X, text: "No ads during diagnosis" },
  { icon: Zap, text: "Priority AI analysis" },
  { icon: Mail, text: "Landlord letter generator" },
  { icon: FileText, text: "Export diagnosis as PDF" },
];

// Minimum 15s, max 20s ad duration
const AD_MIN_SECONDS = 15;
const AD_MAX_SECONDS = 20;

interface ScanFlowProps {
  onClose: () => void;
  resumeScanId?: string;
  resumeData?: {
    step: number;
    description?: string;
    location?: string;
    category?: string;
    uploadedFileUrl?: string;
    answers?: string[];
    triageData?: any;
    diagnosisData?: any;
  };
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

export default function ScanFlow({ onClose, resumeScanId, resumeData }: ScanFlowProps) {
  const [step, setStep] = useState(resumeData?.step || 1);
  const [uploadMethod, setUploadMethod] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(resumeData?.uploadedFileUrl || null);
  const [description, setDescription] = useState(resumeData?.description || "");
  const [location, setLocation] = useState(resumeData?.location || "");
  const [category, setCategory] = useState<string | null>(resumeData?.category || null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(resumeData?.answers || []);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState<"upgrade" | "auth" | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(resumeData?.diagnosisData || null);
  const [triage, setTriage] = useState<any>(resumeData?.triageData || null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(resumeScanId || null);
  const [postcode, setPostcode] = useState("");

  // Ad state
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [adTotalTime, setAdTotalTime] = useState(0);
  const [adElapsed, setAdElapsed] = useState(0);
  const [adDone, setAdDone] = useState(false);
  const [pendingResults, setPendingResults] = useState<{ triage: any; diagnosis: any } | null>(null);
  const { isPremium, startCheckout, user } = useSubscription();
  const { showInterstitial, isNative } = useAdMob();
  const { saveScanProgress, deleteScan } = useInProgressScan();

  const handleUploadMedia = async () => {
    try {
      const native = (window as any).Capacitor?.isNativePlatform?.();

      if (native) {
        try {
          const photo = await Camera.getPhoto({
            quality: 70,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            saveToGallery: false,
            correctOrientation: true,
          });

          const photoUrl = photo.webPath || (photo.path ? Capacitor.convertFileSrc(photo.path) : null);
          if (!photoUrl) {
            throw new Error("No photo URL returned from camera");
          }

          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const fileExtension = photo.format || "jpg";
          const fileType = blob.type || `image/${fileExtension === "jpeg" ? "jpeg" : fileExtension}`;
          const file = new File([blob], `photo.${fileExtension}`, { type: fileType });

          setUploadedFile(file);
          setUploadedPreviewUrl(photoUrl);
          setUploadMethod("upload");
          return;
        } catch (camErr: any) {
          if (camErr?.message?.toLowerCase?.().includes("cancel")) return;
          console.error("Native camera error:", camErr);
          toast.error("Could not open camera. Check camera permission in Settings.");
          return;
        }
      }

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,video/*";
      input.setAttribute("capture", "environment");
      input.onchange = (e) => {
        try {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setUploadedFile(file);
            setUploadedPreviewUrl(URL.createObjectURL(file));
            setUploadMethod("upload");
          }
        } catch (err) {
          console.error("File selection error:", err);
          toast.error("Could not load the selected file. Please try again.");
        }
      };
      input.click();
    } catch (err) {
      console.error("Camera/upload error:", err);
      toast.error("Could not open camera. Please try uploading from your gallery instead.");
    }
  };

  const handleUploadFromGallery = () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,video/*";
      input.onchange = (e) => {
        try {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setUploadedFile(file);
            setUploadedPreviewUrl(URL.createObjectURL(file));
            setUploadMethod("upload");
          }
        } catch (err) {
          console.error("File selection error:", err);
          toast.error("Could not load the selected file. Please try again.");
        }
      };
      input.click();
    } catch (err) {
      console.error("Gallery error:", err);
      toast.error("Could not open gallery. Please try again.");
    }
  };

  const totalSteps = 7;

  // Auto-save progress for premium users
  const autoSaveProgress = useCallback(async () => {
    if (!isPremium || !user) return;
    const id = await saveScanProgress({
      scanId: currentScanId || undefined,
      step,
      description,
      location: location || undefined,
      category: category || undefined,
      uploadedFile,
      answers,
      triageData: triage,
      diagnosisData: diagnosis,
    });
    if (id && !currentScanId) setCurrentScanId(id);
  }, [isPremium, user, step, description, location, category, uploadedFile, answers, triage, diagnosis, currentScanId, saveScanProgress]);

  // Save progress when step changes (premium only)
  useEffect(() => {
    if (isPremium && step >= 1 && step < 5) {
      const timer = setTimeout(autoSaveProgress, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, isPremium, autoSaveProgress]);

  const handleClose = () => {
    if (!isPremium && step > 1 && step < 5) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  };

  const confirmExit = async () => {
    if (isPremium) {
      await autoSaveProgress();
      toast.success("Progress saved — resume anytime from My Issues");
    }
    onClose();
  };

  // Extract truncated postcode area (e.g. "SW1" from "SW1A 2AA") — never store full postcode
  const getPostcodeArea = (pc: string): string | null => {
    const trimmed = pc.trim().toUpperCase();
    if (!trimmed) return null;
    // UK postcode area is 1-2 letters + 1-2 digits at the start
    const match = trimmed.match(/^([A-Z]{1,2}\d{1,2})/);
    return match ? match[1] : null;
  };

  // Map postcode area to broad UK region for analytics
  const getRegionFromPostcode = (area: string | null): string | null => {
    if (!area) return null;
    const prefix = area.replace(/\d+$/, "");
    const REGION_MAP: Record<string, string> = {
      AB: "Scotland", DD: "Scotland", DG: "Scotland", EH: "Scotland", FK: "Scotland",
      G: "Scotland", HS: "Scotland", IV: "Scotland", KA: "Scotland", KW: "Scotland",
      KY: "Scotland", ML: "Scotland", PA: "Scotland", PH: "Scotland", TD: "Scotland", ZE: "Scotland",
      AL: "East of England", CB: "East of England", CM: "East of England", CO: "East of England",
      IP: "East of England", NR: "East of England", PE: "East of England", SG: "East of England", SS: "East of England",
      B: "West Midlands", CV: "West Midlands", DY: "West Midlands", WS: "West Midlands", WV: "West Midlands",
      DE: "East Midlands", DN: "East Midlands", LE: "East Midlands", LN: "East Midlands",
      NG: "East Midlands", NN: "East Midlands", S: "East Midlands",
      BA: "South West", BH: "South West", BS: "South West", DT: "South West", EX: "South West",
      GL: "South West", PL: "South West", SN: "South West", SP: "South West", TA: "South West",
      TQ: "South West", TR: "South West",
      BN: "South East", CT: "South East", GU: "South East", HP: "South East", ME: "South East",
      MK: "South East", OX: "South East", PO: "South East", RG: "South East", RH: "South East",
      SL: "South East", SO: "South East", TN: "South East",
      E: "London", EC: "London", N: "London", NW: "London", SE: "London", SW: "London",
      W: "London", WC: "London",
      BB: "North West", BL: "North West", CA: "North West", CH: "North West", CW: "North West",
      FY: "North West", L: "North West", LA: "North West", M: "North West", OL: "North West",
      PR: "North West", SK: "North West", WA: "North West", WN: "North West",
      BD: "Yorkshire", HD: "Yorkshire", HG: "Yorkshire", HU: "Yorkshire", HX: "Yorkshire",
      LS: "Yorkshire", WF: "Yorkshire", YO: "Yorkshire",
      DH: "North East", DL: "North East", NE: "North East", SR: "North East", TS: "North East",
      CF: "Wales", LD: "Wales", LL: "Wales", NP: "Wales", SA: "Wales", SY: "Wales",
      BT: "Northern Ireland",
    };
    return REGION_MAP[prefix] || null;
  };

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
      const cat = triageData?.category || category || "other";
      const postcodeArea = getPostcodeArea(postcode);
      const region = getRegionFromPostcode(postcodeArea);

      // Derive trade type from category
      const TRADE_FROM_CAT: Record<string, string> = {
        plumbing: "Plumber", electrical: "Electrician", structural: "Builder",
        hvac: "Heating Engineer", appliance: "Appliance Repair", roofing: "Roofer",
        damp: "Damp Specialist", gas: "Gas Safe Engineer", drainage: "Drainage Engineer",
        carpentry: "Carpenter", glazing: "Glazier", pest: "Pest Control", other: "General",
      };
      const tradeType = TRADE_FROM_CAT[cat.toLowerCase()] || "General";

      // Determine responsibility from diagnosis if available
      const responsibility = diagnosisData?.responsibility || (diagnosisData?.diy_quick_fixes?.length > 0 ? "tenant_can_diy" : "landlord_likely");

      await supabase.from("anonymised_insights").insert({
        issue_type: cat,
        issue_title: triageData?.issue_title || triageData?.brief_description || "Unknown",
        category: cat,
        urgency,
        severity_score: urgency === "fix_now" ? 9 : urgency === "fix_soon" ? 6 : urgency === "monitor" ? 3 : 1,
        priority,
        diy_safe: hasDiy,
        diy_cost_estimate: Math.round((diyMin + diyMax) / 2),
        pro_cost_estimate: Math.round((proMin + proMax) / 2),
        user_tier: isPremium ? "premium" : "free",
        session_id: sessionHash,
        status: "active",
        postcode_area: postcodeArea,
        region,
        trade_type: tradeType,
        property_category: "residential",
        responsibility,
      } as any);
    } catch (err) {
      console.error("Anonymised data collection error:", err);
    }
  };

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const hasFile = !!uploadedFile || !!uploadedPreviewUrl;
  const hasEnoughDescription = hasFile || wordCount >= 20;
  const canContinueStep1 = description.trim().length > 0 && !!category && hasEnoughDescription;

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

    // For free users on web, show the ad screen with enforced minimum time
    if (!isPremium && !isNative) {
      const adTime = Math.floor(Math.random() * (AD_MAX_SECONDS - AD_MIN_SECONDS + 1)) + AD_MIN_SECONDS;
      setAdTotalTime(adTime);
      setAdCountdown(adTime);
      setAdElapsed(0);
      setAdDone(false);
      setShowAd(true);
    }

    // For free users on native, fire the interstitial in parallel
    let nativeAdPromise: Promise<boolean> | null = null;
    if (!isPremium && isNative) {
      nativeAdPromise = showInterstitial();
    }

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
          setShowAd(false);
          setStep(1);
          toast.error("That doesn't look like a home issue.");
          return;
        }
        throw new Error(data.error || "Analysis failed");
      }

      // Silently collect anonymised data
      collectAnonymisedData(data.triage, data.diagnosis);

      // Record follow-up for 1-week push notification
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        await supabase.from("scan_follow_ups").insert({
          user_id: authUser?.id || null,
          session_id: crypto.randomUUID(),
          issue_title: data.triage?.issue_title || "Unknown Issue",
          category: data.triage?.category || category,
        } as any);
      } catch (e) {
        console.warn("Follow-up recording failed:", e);
      }

      // Send notification + push for premium users
      if (isPremium && user) {
        const issueTitle = data.triage?.issue_title || "your issue";
        const priority = data.diagnosis?.urgency_assessment?.level === "fix_now" ? "urgent" : "normal";
        try {
          // In-app notification (also handled by the edge function, but this ensures immediate display)
          await supabase.from("notifications").insert({
            user_id: user.id,
            title: "Scan Complete",
            message: `Your diagnosis for "${issueTitle}" is ready to view.`,
            type: "scan_complete",
            priority,
            action_url: null,
          } as any);

          // Native push notification (for when app is in background/closed)
          supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: user.id,
              title: "Scan Complete ✓",
              body: `Your diagnosis for "${issueTitle}" is ready to view.`,
              data: { type: "scan_complete", priority, action_url: "/notifications" },
            },
          }).catch((e) => console.warn("Push notification failed:", e));
        } catch (e) {
          console.warn("Notification insert failed:", e);
        }
      }

      if (!isPremium) {
        if (isNative) {
          if (nativeAdPromise) await nativeAdPromise;
          setTriage(data.triage);
          setDiagnosis(data.diagnosis);
          setStep(5);
        } else {
          setPendingResults({ triage: data.triage, diagnosis: data.diagnosis });
        }
      } else {
        setTriage(data.triage);
        setDiagnosis(data.diagnosis);
        setStep(5);
        // Delete in-progress scan since it's now complete
        if (currentScanId) {
          deleteScan(currentScanId);
          setCurrentScanId(null);
        }
      }
    } catch (err: any) {
      console.error("AI analysis error:", err);
      setAiError(err.message);
      setShowAd(false);
      toast.error(err.message || "Analysis failed. Please try again.");
      setStep(1);
    } finally {
      setIsAnalysing(false);
    }
  };

  // Ad countdown timer — enforced minimum 15s
  useEffect(() => {
    if (!showAd || adCountdown <= 0) return;
    const timer = setTimeout(() => {
      const newElapsed = adElapsed + 1;
      setAdElapsed(newElapsed);
      if (adCountdown <= 1) {
        setAdDone(true);
        setAdCountdown(0);
      } else {
        setAdCountdown(adCountdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [showAd, adCountdown, adElapsed]);

  // Handle ad close attempt — restart if under 15s
  const handleAdCloseAttempt = () => {
    if (adElapsed < AD_MIN_SECONDS) {
      // Restart the ad timer
      const newTime = Math.floor(Math.random() * (AD_MAX_SECONDS - AD_MIN_SECONDS + 1)) + AD_MIN_SECONDS;
      setAdTotalTime(newTime);
      setAdCountdown(newTime);
      setAdElapsed(0);
      setAdDone(false);
      toast.error("Please watch the full ad to see your results");
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {}
    }
  };

  const handleAdContinue = () => {
    if (pendingResults) {
      setTriage(pendingResults.triage);
      setDiagnosis(pendingResults.diagnosis);
      setPendingResults(null);
    }
    setShowAd(false);
    setStep(5);
  };

  const handleSave = async () => {
    if (!isPremium) {
      setShowSavePrompt("upgrade");
      return;
    }
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setShowSavePrompt("auth");
        return;
      }
      const { error } = await supabase.from("saved_issues").insert({
        user_id: authUser.id,
        issue_title: triage?.issue_title || "Untitled Issue",
        brief_description: triage?.brief_description || "",
        category: triage?.category || category || "other",
        urgency: diagnosis?.urgency_assessment?.level || null,
        diagnosis_data: diagnosis,
        triage_data: triage,
        image_url: uploadedPreviewUrl || null,
        status: "active",
      });
      if (error) throw error;
      toast.success("Diagnosis saved to your account ✓");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save diagnosis");
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

  const getProgressColor = (index: number, currentStep: number) => {
    if (index >= currentStep) return "rgba(0,23,47,0.1)";
    const t = index / Math.max(totalSteps - 1, 1);
    const r = Math.round(232 + (217 - 232) * t);
    const g = Math.round(83 + (56 - 83) * t);
    const b = Math.round(10 + (112 - 10) * t);
    return `rgb(${r},${g},${b})`;
  };

  // Push AdSense ad when ad overlay mounts
  useEffect(() => {
    if (showAd && !isNative) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn("AdSense push error:", e);
      }
    }
  }, [showAd, isNative]);

  // --- EXIT WARNING OVERLAY (free users) ---
  if (showExitWarning) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <LavaLampBackground />
        <div className="relative z-10 w-full max-w-md px-6 space-y-6">
          <div className="rounded-2xl p-8 space-y-6 text-center" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(220,38,38,0.1)" }}>
              <AlertTriangle className="w-8 h-8" style={{ color: "#DC2626" }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: navy }}>
              {isPremium ? "Save & Exit?" : "Your progress will be lost!"}
            </h2>
            <p className="text-base" style={{ color: textSecondary }}>
              {isPremium
                ? "Your progress will be saved automatically. You can resume from My Issues anytime."
                : "Free users cannot save scan progress. If you leave now, you'll need to start over."}
            </p>

            {!isPremium && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(232,83,10,0.04)", border: "1px solid rgba(232,83,10,0.15)" }}>
                <p className="text-sm font-semibold" style={{ color: navy }}>
                  <Crown className="w-4 h-4 inline mr-1" style={{ color: "var(--color-primary)" }} />
                  Upgrade to Premium for £0.99/mo
                </p>
                <p className="text-xs" style={{ color: textSecondary }}>
                  Automatically save your progress and resume any scan where you left off.
                </p>
                <GradientButton onClick={startCheckout}>
                  <span className="flex items-center gap-2"><Crown className="w-4 h-4" /> Upgrade Now</span>
                </GradientButton>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="w-full p-3 rounded-2xl text-base font-semibold"
                style={{ background: "var(--gradient-primary)", color: "#fff" }}
              >
                Continue Scanning
              </button>
              <button
                onClick={confirmExit}
                className="w-full text-center py-2 text-sm"
                style={{ color: textSecondary }}
              >
                {isPremium ? "Save & Exit" : "Exit Anyway"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

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
          {/* Close attempt handler */}
          {!adDone && (
            <button
              onClick={handleAdCloseAttempt}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,23,47,0.1)", color: textSecondary, top: "calc(var(--safe-top) + 16px)", right: "calc(var(--safe-right) + 16px)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Ad unit */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <div className="p-2">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: textSecondary }}>Advertisement</p>
              <div
                className="w-full flex items-center justify-center rounded-xl"
                style={{ minHeight: 250, background: "rgba(0,23,47,0.03)" }}
              >
                <ins
                  className="adsbygoogle"
                  style={{ display: "block", width: "100%", height: 250 }}
                  data-ad-client="ca-pub-9591380465147865"
                  data-ad-slot="XXXXXXXXXX"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
              </div>
              <div className="text-center p-4 space-y-2">
                <Crown className="w-8 h-8 mx-auto" style={{ color: "var(--color-primary)" }} />
                <p className="text-sm font-bold" style={{ color: navy }}>Go Premium — No ads, unlimited scans</p>
                <p className="text-lg font-bold" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Just £0.99/month
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(!adDone || !pendingResults) ? (
              <div className="py-4">
                <p className="text-sm font-semibold" style={{ color: textSecondary }}>
                  {isAnalysing
                    ? "Analysing your issue..."
                    : adCountdown > 0
                    ? `Results ready in ${adCountdown}s...`
                    : "Preparing your results..."}
                </p>
                <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,23,47,0.08)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: adCountdown, ease: "linear" }}
                    key={adTotalTime}
                  />
                </div>
                <p className="text-[10px] mt-1" style={{ color: textSecondary }}>
                  Minimum {AD_MIN_SECONDS}s viewing required
                </p>
              </div>
            ) : (
              <GradientButton size="lg" onClick={handleAdContinue}>
                Continue to Results →
              </GradientButton>
            )}

            <button
              onClick={startCheckout}
              className="w-full text-center py-2 text-sm font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              Skip ads forever — Go Premium
            </button>
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
      <div className="flex items-center justify-between px-4 relative z-10" style={{ minHeight: 64, paddingTop: "calc(var(--safe-top) + var(--app-header-offset))", paddingBottom: 12, paddingLeft: "calc(var(--safe-left) + 16px)", paddingRight: "calc(var(--safe-right) + 16px)" }}>
        {step > 1 && !showSavePrompt ? (
          <button onClick={() => { if (step === 4 && isAnalysing) return; setStep(step - 1); }} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, color: navy }}>
            <ArrowLeft className="w-7 h-7" />
          </button>
        ) : <div style={{ minWidth: 44 }} />}
        <img src={ufixiLogo} alt="Ufixi" className="h-7 object-contain" />
        <button onClick={handleClose} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, color: navy }}>
          <X className="w-7 h-7" />
        </button>
      </div>

      {/* Progress Bar */}
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
      <div className="flex-1 overflow-y-auto px-6 relative z-10" style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
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
                    <span className="text-base" style={{ color: navy }}>{text}</span>
                  </div>
                ))}
              </div>

              <GradientButton size="lg" onClick={startCheckout}>
                Upgrade to Premium — £0.99/mo
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
                   <CameraIcon className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Upload Issue
                 </label>
                {uploadedFile ? (
                  <button
                    onClick={handleUploadFromGallery}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
                    style={{
                      background: "rgba(232,83,10,0.08)",
                      border: "2px solid var(--color-primary)",
                      minHeight: 56,
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,83,10,0.08)" }}>
                      <Upload className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold" style={{ color: navy }}>Change Media</p>
                      <p className="text-sm" style={{ color: textSecondary }}>{uploadedFile.name.slice(0, 30)}</p>
                    </div>
                    <span className="ml-auto text-xs px-2 py-1 rounded-full" style={{ background: "rgba(29,158,117,0.1)", color: "var(--color-success)" }}>✓</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleUploadMedia}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-[0.98]"
                      style={{ background: "white", border: "2px solid rgba(0,23,47,0.08)", minHeight: 56 }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,83,10,0.08)" }}>
                        <CameraIcon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: navy }}>Take Photo</p>
                    </button>
                    <button
                      onClick={handleUploadFromGallery}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-[0.98]"
                      style={{ background: "white", border: "2px solid rgba(0,23,47,0.08)", minHeight: 56 }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,83,10,0.08)" }}>
                        <Upload className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: navy }}>Choose from Gallery</p>
                    </button>
                  </div>
                )}
              </div>

              {/* Image/Video Preview OR Tips */}
              {uploadedPreviewUrl && (uploadedFile || resumeData?.uploadedFileUrl) ? (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,23,47,0.08)" }}>
                  {uploadedFile?.type?.startsWith("image/") || (!uploadedFile && uploadedPreviewUrl) ? (
                    <img src={uploadedPreviewUrl} alt="Uploaded preview" className="w-full h-auto max-h-64 object-cover" />
                  ) : uploadedFile?.type?.startsWith("video/") ? (
                    <video src={uploadedPreviewUrl} controls className="w-full max-h-64" />
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(232,83,10,0.06)", border: "1px solid rgba(232,83,10,0.12)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>No photo? No problem!</p>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    If you can't upload a photo, please describe the issue in detail below (at least 20 words). Include:
                  </p>
                  <ul className="text-sm space-y-1.5" style={{ color: textSecondary }}>
                    <li>• What does the problem look like?</li>
                    <li>• Where exactly is it located?</li>
                    <li>• When did you first notice it?</li>
                    <li>• Has it changed or worsened over time?</li>
                  </ul>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <label className="text-base font-semibold" style={{ color: navy }}>What's the problem?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={hasFile ? "Describe what you see..." : "Describe the issue in detail — what does it look like, where is it, when did it start, and has it changed over time?"}
                  className="w-full rounded-2xl p-4 text-base resize-none focus:outline-none focus:ring-2"
                  style={{ background: "white", border: "1px solid rgba(232,83,10,0.25)", color: navy, minHeight: 110, boxShadow: "0 0 0 0px transparent", "--tw-ring-color": "rgba(232,83,10,0.4)" } as React.CSSProperties}
                  rows={4}
                />
                {!hasFile && (
                  <p className="text-xs" style={{ color: wordCount >= 20 ? "var(--color-success)" : textSecondary }}>
                    {wordCount}/20 words minimum {wordCount >= 20 ? "✓" : "(no photo uploaded)"}
                  </p>
                )}
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

              {/* Postcode (optional — truncated for anonymised analytics) */}
              <div className="space-y-2">
                <label className="text-base font-semibold flex items-center gap-2" style={{ color: navy }}>
                  <MapPin className="w-4 h-4" style={{ color: "var(--color-primary)" }} /> Postcode <span className="text-xs font-normal" style={{ color: textSecondary }}>(optional)</span>
                </label>
                <input
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  placeholder="e.g., SW1A 2AA"
                  maxLength={8}
                  className="w-full rounded-2xl p-4 text-base"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                />
                <p className="text-xs" style={{ color: textSecondary }}>
                  Only the area code (e.g. "SW1") is stored — never your full postcode
                </p>
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

          {/* STEP 3 — Questions */}
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

          {/* STEP 4 — Loading results */}
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
                {isPremium && (
                  <p className="text-xs" style={{ color: "var(--color-success)" }}>
                    ✓ You can close the app — we'll notify you when it's done
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 5 — Real AI Results */}
          {!showSavePrompt && step === 5 && diagnosis && (
            <DiagnosisResults
              triage={triage}
              diagnosis={diagnosis}
              uploadedPreviewUrl={uploadedPreviewUrl}
              uploadedFileType={uploadedFile?.type || null}
              onSave={handleSave}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
