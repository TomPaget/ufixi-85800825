import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import BottomNavDemo from "@/components/BottomNavDemo";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageTransition from "@/components/PageTransition";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your Ufixi AI assistant. I can help you with home maintenance questions, diagnose issues, suggest fixes, or guide you through repairs. What do you need help with?",
  timestamp: new Date(),
};

export default function AIHelp() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

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
        body: JSON.stringify({ userMessage: text, conversationHistory, mode: "general" }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      const data = await resp.json();
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "I can't confidently solve that from text alone. Please scan the issue first, then come back with the diagnosis for follow-up help.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI help error:", err);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I can't connect right now. Please scan the issue first, then come back with the diagnosis for follow-up help.",
        timestamp: new Date(),
      }]);
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
          style={{ height: "calc(100dvh - var(--app-header-total) - var(--app-bottom-nav-total) - 96px)" }}
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
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className="rounded-2xl px-4 py-3 max-w-[80%] text-base"
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
                {msg.role === "user" && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: "var(--color-navy)" }}
                  >
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 items-start"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div
                className="rounded-2xl px-4 py-3 flex gap-1.5"
                style={{ background: "rgba(255,255,255,0.85)", border: "1px solid var(--glass-border)" }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Input bar */}
        <div
          className="fixed left-0 right-0 z-40 px-4 py-3"
          style={{
            bottom: "var(--app-bottom-nav-total)",
            background: "rgba(253,246,238,0.9)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid var(--glass-border)",
          }}
        >
          <div className="max-w-lg mx-auto flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about any home issue..."
              className="flex-1 rounded-2xl px-4 py-3 text-base outline-none"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid var(--glass-border)",
                color: "var(--color-navy)",
                letterSpacing: "0.03em",
                minHeight: 48,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
              style={{
                background: "var(--gradient-primary)",
                color: "#fff",
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        <BottomNavDemo />
      </div>
    </PageTransition>
  );
}
