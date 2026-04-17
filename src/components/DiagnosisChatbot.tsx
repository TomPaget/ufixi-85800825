import { useState, useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Bot, User, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DiagnosisChatbotProps {
  issueTitle: string;
  category: string;
  briefDescription: string;
  causes: string[];
  fixes: string[];
  safetyWarnings: string[];
  diyCostRange: string;
  proCostRange: string;
}

const DiagnosisChatbot = forwardRef<HTMLDivElement, DiagnosisChatbotProps>(function DiagnosisChatbot({
  issueTitle,
  category,
  briefDescription,
  causes,
  fixes,
  safetyWarnings,
  diyCostRange,
  proCostRange,
}, forwardedRef) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Pre-populate first AI message on mount (always open)
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      const welcomeMsg: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: `I've analysed your ${issueTitle.toLowerCase()}. Ask me anything about causes, how to fix it, or whether you need a professional.`,
      };
      setMessages([welcomeMsg]);
    }
  }, [hasInitialized, issueTitle]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnosis-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            userMessage: text,
            conversationHistory: updatedMessages.filter(m => m.id !== "welcome").map(m => ({
              role: m.role,
              content: m.content,
            })),
            context: {
              issueTitle,
              category,
              briefDescription,
              causes,
              fixes,
              safetyWarnings,
              diyCostRange,
              proCostRange,
            },
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      const data = await resp.json();
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that. Please try again.",
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const navy = "#00172F";
  const textSecondary = "#5A6A7A";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)" }}>
      {/* Header (non-collapsible) */}
      <div className="flex items-center gap-2.5 p-5" style={{ minHeight: 56 }}>
        <MessageSquare className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
        <span className="text-base font-semibold" style={{ color: navy }}>
          Ask Ufixi AI about this issue
        </span>
      </div>

      <div className="px-4 pb-4">
              {/* Chat messages container */}
              <div
                ref={scrollRef}
                className="space-y-3 overflow-y-auto pr-1"
                style={{ height: 350, scrollbarWidth: "thin" }}
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className="rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed"
                        style={{
                          background: msg.role === "user" ? "var(--gradient-primary)" : "rgba(0,23,47,0.04)",
                          color: msg.role === "user" ? "#fff" : navy,
                          border: msg.role === "assistant" ? "1px solid rgba(0,23,47,0.06)" : "none",
                        }}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          style={{ background: navy }}
                        >
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 items-start"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div
                      className="rounded-2xl px-4 py-3 flex gap-1.5"
                      style={{ background: "rgba(0,23,47,0.04)", border: "1px solid rgba(0,23,47,0.06)" }}
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

              {/* Input field */}
              <div className="flex gap-2 mt-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask about this issue..."
                  className="flex-1 rounded-xl px-4 py-3 outline-none"
                  style={{
                    background: "rgba(0,23,47,0.03)",
                    border: "1px solid rgba(0,23,47,0.08)",
                    color: navy,
                    minHeight: 44,
                    fontSize: "16px",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                  style={{
                    background: "var(--gradient-primary)",
                    color: "#fff",
                    minWidth: 44,
                    minHeight: 44,
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
    </div>
  );
}
