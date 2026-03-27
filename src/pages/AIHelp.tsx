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

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: getSimulatedResponse(text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 60px)" }}>
        <LavaLampBackground />
        <PageHeader title="AI Help" showBack={false} showLogo />

        <div
          ref={scrollRef}
          className="max-w-lg mx-auto px-4 py-4 space-y-4 overflow-y-auto"
          style={{ height: "calc(100vh - 180px)" }}
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
            bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
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

function getSimulatedResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("leak") || lower.includes("water"))
    return "Water leaks can range from minor to serious. First, try to identify the source — check under sinks, around toilets, and near water heaters. If you see active dripping, turn off the water supply valve nearest to the leak. For small pipe leaks, plumber's tape can be a temporary fix. Would you like me to walk you through a step-by-step diagnosis?";
  if (lower.includes("electric") || lower.includes("socket") || lower.includes("outlet"))
    return "Warning: Electrical issues can be dangerous. Never attempt to fix live wiring yourself. If a socket isn't working, first check your fuse box/consumer unit for any tripped breakers. If breakers keep tripping, this could indicate a fault that needs a qualified electrician. Want me to help you identify the issue further?";
  if (lower.includes("mould") || lower.includes("mold") || lower.includes("damp"))
    return "Mould is usually caused by excess moisture. Check for ventilation issues, condensation on windows, or hidden leaks. For small areas, a solution of white vinegar or specialist mould spray can help. Ensure rooms are well-ventilated — open windows or use extractor fans. For persistent mould, you may need a professional damp survey. Shall I help you assess the severity?";
  if (lower.includes("boiler") || lower.includes("heating") || lower.includes("radiator"))
    return "Heating issues are common, especially in winter. If your boiler shows an error code, note it down — I can help decode it. For cold radiators, try bleeding them using a radiator key. If your boiler isn't firing at all, check the pressure gauge (should be 1-1.5 bar) and try resetting it. What specific issue are you experiencing?";
  if (lower.includes("door") || lower.includes("lock") || lower.includes("window"))
    return "For doors that stick, check if the hinges are loose — tightening screws often fixes this. If a lock is stiff, try graphite lubricant (avoid WD-40 on locks). For draughty windows, self-adhesive foam strips or silicone sealant can help. What's the specific problem you're dealing with?";
  return "I'd be happy to help with that! Could you describe the issue in a bit more detail? For example: where in your home is it, when did you first notice it, and has it been getting worse? If you have a photo, you can use the Scan feature on the home page for an AI-powered diagnosis.";
}
