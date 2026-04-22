import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import GradientButton from "@/components/GradientButton";
import LavaLampBackground from "@/components/LavaLampBackground";

const FAQ = [
  { q: "How does the AI scan work?", a: "Upload a photo or video of your home issue and our AI will analyse it, identify the problem, and provide a diagnosis with repair recommendations." },
  { q: "How many free scans do I get?", a: "Free users get 3 scans per month. Upgrade to Premium for unlimited scans." },
  { q: "How long are my scans saved?", a: "Saved scans are retained for 45 days, after which they are automatically deleted." },
  { q: "Is my data secure?", a: "Yes, all data is encrypted and stored securely. We do not share personal information with third parties." },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const ESCALATION_KEYWORDS = [
  "speak to someone", "human", "real person", "contact", "get in touch",
  "talk to someone", "agent", "representative", "manager", "complaint",
  "not helpful", "doesn't help", "useless", "speak to a person",
];

const GREETING: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm your Ufixi support assistant. I can help with account questions, scan issues, billing, and more. What can I help you with?",
};

function shouldEscalate(input: string, msgCount: number): boolean {
  const lower = input.toLowerCase();
  const wantsHuman = ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));
  return (wantsHuman && msgCount >= 2) || msgCount >= 8;
}

export default function Support() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const userMsgCount = messages.filter((m) => m.role === "user").length;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const newCount = userMsgCount + 1;

    try {
      const conversationHistory = [...messages, userMsg]
        .filter((message) => message.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnosis-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ userMessage: text, conversationHistory, mode: "support" }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      const data = await resp.json();
      const escalate = shouldEscalate(text, newCount) || /contact form|support team|human/i.test(data.reply || "");
      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: data.reply || "I can help troubleshoot this, or you can use the contact form below if you need the team to review it." };
      setMessages((prev) => [...prev, aiMsg]);

      if (escalate) {
        setShowContactForm(true);
        setTimeout(() => {
          contactRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 400);
      }
    } catch (err) {
      console.error("Support chat error:", err);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "I can't connect right now. Please use the contact form below and our team will review it." }]);
      setShowContactForm(true);
    } finally {
      setIsTyping(false);
    }
  };

  const openSupportEmail = () => {
    const subject = encodeURIComponent("Ufixi support request");
    const body = encodeURIComponent(`Name: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${contactMessage}`);
    const link = document.createElement("a");
    link.href = `mailto:info@ufixi.co.uk?subject=${subject}&body=${body}`;
    link.target = "_self";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <LavaLampBackground />
        <PageHeader title="Support" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-6">
          {/* AI Chat */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-navy)", letterSpacing: "0.02em" }}>
              Chat with Support
            </h2>

            <div
              ref={scrollRef}
              className="rounded-2xl overflow-y-auto space-y-3 p-4"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: "1px solid var(--glass-border)",
                backdropFilter: "blur(12px)",
                maxHeight: 400,
                minHeight: 260,
              }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--gradient-primary)" }}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className="rounded-2xl px-4 py-3 max-w-[80%] text-sm whitespace-pre-line"
                      style={{
                        background: msg.role === "user" ? "var(--gradient-primary)" : "white",
                        color: msg.role === "user" ? "#fff" : "var(--color-navy)",
                        border: msg.role === "assistant" ? "1px solid rgba(0,23,47,0.06)" : "none",
                        letterSpacing: "0.03em",
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--color-navy)" }}>
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--gradient-primary)" }}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 flex gap-1.5" style={{ background: "white", border: "1px solid rgba(0,23,47,0.06)" }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Describe your issue..."
                className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.85)", border: "1px solid var(--glass-border)", color: "var(--color-navy)", letterSpacing: "0.03em", minHeight: 48 }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                style={{ background: "var(--gradient-primary)", color: "#fff", minWidth: 48, minHeight: 48 }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contact Form — only shown after AI escalation */}
          <AnimatePresence>
            {showContactForm && (
              <motion.div
                ref={contactRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid var(--glass-border)", backdropFilter: "blur(12px)" }}>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-navy)", letterSpacing: "0.02em" }}>Get in Touch</h2>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.03em" }}>Our team will respond within 24 hours.</p>
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Your name" className="w-full rounded-2xl p-4 text-base" style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: "var(--color-navy)" }} />
                  <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email address" type="email" className="w-full rounded-2xl p-4 text-base" style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: "var(--color-navy)" }} />
                  <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder="How can we help?" className="w-full rounded-2xl p-4 text-base resize-none" style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: "var(--color-navy)", minHeight: 100 }} rows={4} />
                  <GradientButton size="lg" onClick={openSupportEmail} disabled={!contactMessage.trim()}>
                    <span className="flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> Send Message</span>
                  </GradientButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAQ */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-navy)", letterSpacing: "0.02em" }}>Frequently Asked Questions</h2>
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,23,47,0.08)", backdropFilter: "blur(12px)" }}>
                <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left" style={{ minHeight: 48 }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{item.q}</span>
                  {expanded === i ? <ChevronUp className="w-4 h-4" style={{ color: "#9aa5b4" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#9aa5b4" }} />}
                </button>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-4 pb-4 text-sm" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.03em", lineHeight: 1.6 }}>{item.a}</p>
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
