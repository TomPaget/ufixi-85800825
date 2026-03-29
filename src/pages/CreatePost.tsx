import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import GradientButton from "@/components/GradientButton";

const CATEGORIES = ["General", "Plumbing", "Electrical", "DIY", "Landlord Advice", "Renter Advice"];

export default function CreatePost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ background: "var(--color-bg)", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <PageHeader title="Create Post" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question or topic?"
              className="w-full rounded-2xl p-4 text-sm"
              style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: "var(--color-navy)" }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share more details..."
              className="w-full rounded-2xl p-4 text-sm resize-none"
              style={{ background: "white", border: "1px solid rgba(0,23,47,0.1)", color: "var(--color-navy)", minHeight: 140 }}
              rows={6}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: category === c ? "var(--gradient-primary)" : "white",
                    color: category === c ? "white" : "var(--color-navy)",
                    border: category === c ? "none" : "1px solid rgba(0,23,47,0.08)",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-sm" style={{ background: "white", border: "1px dashed rgba(0,23,47,0.15)", color: "var(--color-text-secondary)" }}>
            <Image className="w-5 h-5" /> Add Image (optional)
          </button>

          <GradientButton size="lg" disabled={!title.trim() || !content.trim() || !category} onClick={() => navigate("/forum")}>
            Submit Post
          </GradientButton>
        </main>
      </div>
    </PageTransition>
  );
}
