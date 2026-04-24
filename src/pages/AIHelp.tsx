import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Camera, X, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import BottomNavDemo from "@/components/BottomNavDemo";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageTransition from "@/components/PageTransition";
import { useAdMob } from "@/hooks/useAdMob";
import { useSubscription } from "@/hooks/useSubscription";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: "scan";
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Describe the home issue or attach a photo. If I need to see it properly, I’ll send you straight to the scanner.",
  timestamp: new Date(),
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isSameReply(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export default function AIHelp() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const openScan = () => navigate("/home", { state: { startScan: true } });

  const choosePhoto = () => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";
    picker.onchange = () => {
      const file = picker.files?.[0];
      if (!file) return;
      setAttachedFile(file);
      setAttachedPreview(URL.createObjectURL(file));
    };
    picker.click();
  };

  const addAssistantMessage = (content: string, action: Message["action"] = "scan") => {
    setMessages((prev) => {
      const lastAssistant = [...prev].reverse().find((message) => message.role === "assistant");
      const finalContent = lastAssistant && isSameReply(lastAssistant.content, content)
        ? "The best next step is to scan the issue so I can inspect it properly."
        : content;
      return [...prev, { id: crypto.randomUUID(), role: "assistant", content: finalContent, action, timestamp: new Date() }];
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || isTyping) return;

    const fileToSend = attachedFile;
    const previewToSend = attachedPreview;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: `${text || "Please diagnose this photo."}${fileToSend ? "\n[Photo attached]" : ""}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFile(null);
    setAttachedPreview(null);
    setIsTyping(true);

    try {
      if (fileToSend) {
        const imageBase64 = await fileToBase64(fileToSend);
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-issue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            description: text || "User uploaded a photo for diagnosis in AI Help.",
            location: "Not specified",
            category: "other",
            answers: [],
            imageBase64,
            imageMimeType: fileToSend.type,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to scan photo");
        }

        const data = await response.json();
        if (!data.success) {
          addAssistantMessage("I can’t confirm the problem from that photo. Please use the full scanner so Ufixi can guide you through the right checks.");
          return;
        }

        const title = data.triage?.issue_title || "home issue";
        const summary = data.triage?.brief_description || "I found a likely maintenance issue";
        const urgency = data.diagnosis?.urgency_assessment?.reason;
        addAssistantMessage(`I can see ${title.toLowerCase()}: ${summary}. ${urgency ? `${urgency} ` : ""}Open the scanner for the full step-by-step diagnosis and saved result.`, "scan");
        if (previewToSend) URL.revokeObjectURL(previewToSend);
        return;
      }

      const conversationHistory = [...messages, userMsg]
        .filter((message) => message.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnosis-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ userMessage: text, conversationHistory, mode: "general" }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      const data = await resp.json();
      addAssistantMessage(data.reply || "I need to see the problem to help properly. Open the scanner and upload a photo of the issue.");
    } catch (err) {
      console.error("AI help error:", err);
      toast.error(err instanceof Error ? err.message : "AI Help failed");
      addAssistantMessage("I can’t check that reliably from chat right now. Open the scanner and upload a photo of the issue.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "calc(var(--app-page-bottom-space) + 72px)" }}>
        <LavaLampBackground />
        <PageHeader title="AI Help" showBack={false} showLogo />

        <div
          ref={scrollRef}
          className="max-w-lg mx-auto px-4 py-4 space-y-4 overflow-y-auto"
          style={{ height: "calc(100dvh - var(--app-header-total) - var(--app-bottom-nav-total) - 112px)" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: "var(--gradient-primary)" }}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="max-w-[80%] space-y-2">
                  <div
                    className="rounded-2xl px-4 py-3 text-base whitespace-pre-line"
                    style={{
                      background: msg.role === "user" ? "var(--gradient-primary)" : "rgba(255,255,255,0.85)",
                      color: msg.role === "user" ? "#fff" : "var(--color-navy)",
                      border: msg.role === "assistant" ? "1px solid var(--glass-border)" : "none",
                      backdropFilter: msg.role === "assistant" ? "blur(12px)" : undefined,
                      letterSpacing: "0.03em",
                      lineHeight: 1.6,
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.action === "scan" && (
                    <button
                      onClick={openScan}
                      className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold active:scale-95"
                      style={{ background: "var(--gradient-primary)", color: "#fff", minHeight: 44 }}
                    >
                      <ScanLine className="w-4 h-4" /> Scan issue
                    </button>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: "var(--color-navy)" }}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="rounded-2xl px-4 py-3 flex gap-1.5" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid var(--glass-border)" }}>
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div
          className="fixed left-0 right-0 z-40 px-4 py-3"
          style={{ bottom: "var(--app-bottom-nav-total)", background: "rgba(253,246,238,0.9)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--glass-border)" }}
        >
          <div className="max-w-lg mx-auto space-y-2">
            {attachedPreview && (
              <div className="flex items-center gap-2 rounded-2xl p-2" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid var(--glass-border)" }}>
                <img src={attachedPreview} alt="Attached issue" className="w-12 h-12 rounded-xl object-cover" />
                <span className="flex-1 text-sm" style={{ color: "var(--color-navy)" }}>{attachedFile?.name}</span>
                <button onClick={() => { setAttachedFile(null); setAttachedPreview(null); }} className="p-2" style={{ color: "var(--color-text-secondary)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={choosePhoto} className="rounded-2xl flex items-center justify-center transition-all active:scale-90" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid var(--glass-border)", color: "var(--color-primary)", minWidth: 48, minHeight: 48 }}>
                <Camera className="w-5 h-5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask or attach a photo..."
                className="flex-1 rounded-2xl px-4 py-3 text-base outline-none"
                style={{ background: "rgba(255,255,255,0.8)", border: "1px solid var(--glass-border)", color: "var(--color-navy)", letterSpacing: "0.03em", minHeight: 48 }}
              />
              <button onClick={sendMessage} disabled={(!input.trim() && !attachedFile) || isTyping} className="rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40" style={{ background: "var(--gradient-primary)", color: "#fff", minWidth: 48, minHeight: 48 }}>
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <BottomNavDemo />
      </div>
    </PageTransition>
  );
}
