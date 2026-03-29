import { useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, BadgeCheck, Send } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import { MOCK_FORUM_POSTS } from "@/data/mockData";

const MOCK_COMMENTS = [
  { id: "1", author: "Tom B.", content: "Had the same issue — replacing the cartridge fixed it for me. Cost about £12 from Screwfix.", likes: 5, date: "Mar 21, 2026", isTrades: false },
  { id: "2", author: "PlumbPro Dave", content: "This is usually a ceramic disc issue. Make sure you get the exact same size cartridge. Take the old one to the shop.", likes: 8, date: "Mar 21, 2026", isTrades: true },
];

export default function ForumPost() {
  const { id } = useParams();
  const post = MOCK_FORUM_POSTS.find((p) => p.id === id);
  const [comment, setComment] = useState("");

  if (!post) return <div className="p-6 text-center" style={{ color: "var(--color-text-secondary)" }}>Post not found</div>;

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ background: "var(--color-bg)", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <PageHeader title="Post" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,23,47,0.05)", color: "var(--color-text-secondary)" }}>{post.category}</span>
            <h1 className="text-xl" style={{ color: "var(--color-navy)" }}>{post.title}</h1>
            <p className="text-sm" style={{ color: "var(--color-navy)" }}>{post.content}</p>
            <div className="flex items-center gap-3 pt-2">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {post.authorIsTrades && <BadgeCheck className="w-3 h-3" style={{ color: "var(--color-success)" }} />}
                {post.author}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                <Heart className="w-3 h-3" /> {post.likes}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{post.date}</span>
            </div>
          </div>

          <h3 className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Comments ({MOCK_COMMENTS.length})</h3>

          <div className="space-y-3">
            {MOCK_COMMENTS.map((c) => (
              <div key={c.id} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--color-navy)" }}>
                    {c.isTrades && <BadgeCheck className="w-3 h-3" style={{ color: "var(--color-success)" }} />}
                    {c.author}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>{c.date}</span>
                </div>
                <p className="text-sm" style={{ color: "var(--color-navy)" }}>{c.content}</p>
                <button className="flex items-center gap-1 mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  <Heart className="w-3 h-3" /> {c.likes}
                </button>
              </div>
            ))}
          </div>

          {/* Add comment */}
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-2xl px-4 py-3 text-sm"
              style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: "var(--color-navy)" }}
            />
            <button className="rounded-2xl flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, background: "var(--gradient-primary)", color: "white" }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
