import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import BottomNavDemo from "@/components/BottomNavDemo";
import IssueCardDemo from "@/components/IssueCardDemo";
import { MOCK_ISSUES } from "@/data/mockData";

const FILTERS = ["All", "Active", "In Progress", "Resolved"];

export default function MyIssues() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = MOCK_ISSUES.filter((issue) => {
    const matchesFilter = activeFilter === "All" || issue.status === activeFilter.toLowerCase().replace(" ", "_");
    const matchesSearch = issue.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <PageTransition>
      <div className="min-h-screen pb-20" style={{ background: "var(--color-bg)" }}>
        <PageHeader title="My Issues" showBack={false} showLogo />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", minHeight: 44 }}>
              <Search className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--color-navy)" }}
              />
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
                style={{
                  background: activeFilter === f ? "var(--gradient-primary)" : "white",
                  color: activeFilter === f ? "white" : "var(--color-navy)",
                  border: activeFilter === f ? "none" : "1px solid rgba(0,23,47,0.08)",
                  minHeight: 36,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Issues list */}
          <div className="space-y-3">
            {filtered.map((issue) => (
              <div key={issue.id} onClick={() => navigate(`/issue/${issue.id}`)}>
                <IssueCardDemo issue={issue} />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No issues found</p>
              </div>
            )}
          </div>
        </main>

        <BottomNavDemo />
      </div>
    </PageTransition>
  );
}
