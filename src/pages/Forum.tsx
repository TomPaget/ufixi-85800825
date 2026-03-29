import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Heart, MessageCircle, BadgeCheck } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import BottomNavDemo from "@/components/BottomNavDemo";
import { MOCK_FORUM_POSTS } from "@/data/mockData";

const CATEGORIES = ["All", "General", "Plumbing", "Electrical", "DIY", "Landlord Advice"];

export default function Forum() {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  const filtered = activeCategory === "All" ? MOCK_FORUM_POSTS : MOCK_FORUM_POSTS.filter((p) => p.category === activeCategory);

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ background: "var(--color-bg)", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <PageHeader
          title="Community"
          showBack={false}
          showLogo
          rightAction={
            <button onClick={() => navigate("/forum/create")} className="flex items-center justify-center rounded-xl" style={{ minWidth: 44, minHeight: 44, color: "var(--color-primary)" }}>
              <Plus className="w-5 h-5" />
            </button>
          }
        />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
                style={{
                  background: activeCategory === c ? "var(--gradient-primary)" : "white",
                  color: activeCategory === c ? "white" : "var(--color-navy)",
                  border: activeCategory === c ? "none" : "1px solid rgba(0,23,47,0.08)",
                  minHeight: 36,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-3">
            {filtered.map((post) => (
              <button
                key={post.id}
                onClick={() => navigate(`/forum/${post.id}`)}
                className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
                style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{post.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(0,23,47,0.05)", color: "var(--color-text-secondary)" }}>{post.category}</span>
                </div>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{post.content}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {post.authorIsTrades && <BadgeCheck className="w-3 h-3" style={{ color: "var(--color-success)" }} />}
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <Heart className="w-3 h-3" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <MessageCircle className="w-3 h-3" /> {post.commentCount}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: "var(--color-text-secondary)" }}>{post.date}</span>
                </div>
              </button>
            ))}
          </div>
        </main>

        <BottomNavDemo />
      </div>
    </PageTransition>
  );
}
