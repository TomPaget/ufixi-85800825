import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Lock, Crown, CheckCircle2, Play, Clock, Trash2, X, ArrowUpDown, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import BottomNavDemo from "@/components/BottomNavDemo";
import GradientButton from "@/components/GradientButton";
import LavaLampBackground from "@/components/LavaLampBackground";
import { useSubscription } from "@/hooks/useSubscription";
import { useInProgressScan, InProgressScan } from "@/hooks/useInProgressScan";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MAX_SAVED = 30;

const PREMIUM_BENEFITS = [
  "Save up to 30 diagnoses",
  "Access full scan history",
  "No ads during diagnosis",
  "Priority AI analysis",
  "Export diagnosis as PDF",
];

const URGENCY_RANK: Record<string, number> = {
  fix_now: 4, fix_soon: 3, monitor: 2, ignore: 1,
};

type SortKey = "new" | "old" | "severe" | "minor";

const SORT_LABELS: Record<SortKey, string> = {
  new: "Newest first",
  old: "Oldest first",
  severe: "Most severe",
  minor: "Least severe",
};

function daysUntilExpiry(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

export default function MyIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [inProgressScans, setInProgressScans] = useState<InProgressScan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("new");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const navigate = useNavigate();
  const { isPremium, hasEverSubscribed, startCheckout } = useSubscription();
  const { loadInProgressScans, deleteScan } = useInProgressScan();

  useEffect(() => { loadIssues(); }, [isPremium]);

  const loadIssues = async () => {
    if (!isPremium) { setLoading(false); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const [{ data }, scans] = await Promise.all([
        supabase
          .from("saved_issues")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        loadInProgressScans(),
      ]);
      setIssues(data || []);
      setInProgressScans(scans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInProgress = async (scanId: string) => {
    await deleteScan(scanId);
    setInProgressScans((prev) => prev.filter((s) => s.id !== scanId));
  };

  const handleDeleteIssues = async (ids: string[]) => {
    const { error } = await supabase.from("saved_issues").delete().in("id", ids);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setIssues((prev) => prev.filter((i) => !ids.includes(i.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    toast.success(ids.length === 1 ? "Issue deleted" : `${ids.length} issues deleted`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const navy = "#00172F";
  const textSec = "#5A6A7A";

  // Filter + sort (must run before any early return to keep hook order stable)
  const filtered = useMemo(() => {
    let list = issues.filter((i) =>
      i.issue_title?.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      switch (sortKey) {
        case "old": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "severe": return (URGENCY_RANK[b.urgency] || 0) - (URGENCY_RANK[a.urgency] || 0);
        case "minor": return (URGENCY_RANK[a.urgency] || 0) - (URGENCY_RANK[b.urgency] || 0);
        case "new":
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [issues, search, sortKey]);

  // Free user — show premium lock
  if (!isPremium) {
    return (
      <PageTransition>
        <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "var(--app-page-bottom-space)" }}>
          <LavaLampBackground />
          <PageHeader title="My Issues" showBack={false} showLogo />
          <main className="max-w-lg mx-auto px-5 py-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 space-y-6 text-center"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--gradient-primary)" }}>
                <Lock className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: navy }}>Premium Feature</h2>
                <p className="text-base" style={{ color: textSec }}>Saving and viewing your diagnosed issues requires a Premium membership.</p>
              </div>
              <div className="space-y-3 text-left">
                {PREMIUM_BENEFITS.map((b) => (
                  <div key={b} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,23,47,0.02)" }}>
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-success)" }} />
                    <span className="text-base" style={{ color: navy }}>{b}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <GradientButton size="lg" onClick={startCheckout}>
                  <span className="flex items-center justify-center gap-2">
                    <Crown className="w-5 h-5" /> Upgrade to Premium — {hasEverSubscribed ? "£1.99/mo" : "£0.99/mo"}
                  </span>
                </GradientButton>
                <p className="text-xs" style={{ color: textSec }}>Cancel anytime. No commitments.</p>
              </div>
            </motion.div>
          </main>
          <BottomNavDemo />
        </div>
      </PageTransition>
    );
  }

  // (filtered computed above before early return)

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ background: "var(--color-bg)", minHeight: "100dvh", paddingBottom: "var(--app-page-bottom-space)" }}>
        <PageHeader title="My Issues" showBack={false} showLogo />
        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          {/* Search + sort */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", minHeight: 44 }}>
              <Search className="w-4 h-4" style={{ color: textSec }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved issues..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: navy }}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center rounded-2xl px-3"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", minHeight: 44, minWidth: 44, color: navy }}
                  aria-label="Sort"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <DropdownMenuItem key={k} onClick={() => setSortKey(k)}>
                    <span className="flex-1">{SORT_LABELS[k]}</span>
                    {sortKey === k && <Check className="w-4 h-4 ml-2" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Capacity + select toolbar */}
          {issues.length > 0 && (
            <div className="flex items-center justify-between text-xs" style={{ color: textSec }}>
              <span>{issues.length} of {MAX_SAVED} saved</span>
              {selectMode ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} className="font-semibold" style={{ color: textSec }}>Cancel</button>
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={() => setConfirmDelete({ ids: Array.from(selectedIds), label: `${selectedIds.size} ${selectedIds.size === 1 ? "issue" : "issues"}` })}
                    className="font-semibold disabled:opacity-40"
                    style={{ color: "#DC2626" }}
                  >
                    Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                  </button>
                </div>
              ) : (
                <button onClick={() => setSelectMode(true)} className="font-semibold" style={{ color: "var(--color-primary)" }}>Select</button>
              )}
            </div>
          )}

          {/* In-progress scans */}
          {inProgressScans.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: textSec }}>In Progress</p>
              {inProgressScans.map((scan) => (
                <div
                  key={scan.id}
                  className="rounded-2xl p-4 space-y-2"
                  style={{ background: "rgba(232,83,10,0.04)", border: "1px solid rgba(232,83,10,0.15)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                      <h3 className="text-sm font-semibold" style={{ color: navy }}>
                        {scan.category ? `${scan.category.charAt(0).toUpperCase() + scan.category.slice(1)} Issue` : "Unfinished Scan"}
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(232,83,10,0.1)", color: "var(--color-primary)" }}>
                      Step {scan.step}/5
                    </span>
                  </div>
                  {scan.description && (
                    <p className="text-xs line-clamp-2" style={{ color: textSec }}>{scan.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: textSec }}>Expires in {daysUntilExpiry(scan.expires_at)} days</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteInProgress(scan.id)} className="p-1.5 rounded-lg" style={{ color: textSec }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate("/home", { state: { resumeScanId: scan.id, resumeData: scan } })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ background: "var(--gradient-primary)", color: "#fff" }}
                      >
                        <Play className="w-3 h-3" /> Resume
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: textSec }}>Loading...</p>
            </div>
          ) : filtered.length === 0 && inProgressScans.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-base font-semibold" style={{ color: navy }}>No saved issues yet</p>
              <p className="text-sm" style={{ color: textSec }}>Scan a new issue and save the diagnosis to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: textSec }}>Saved Issues</p>
              )}
              {filtered.map((issue) => {
                const selected = selectedIds.has(issue.id);
                return (
                  <div
                    key={issue.id}
                    onClick={() => {
                      if (selectMode) toggleSelect(issue.id);
                      else navigate(`/issue/${issue.id}`);
                    }}
                    className="relative rounded-2xl p-4 space-y-2 cursor-pointer transition-all active:scale-[0.98]"
                    style={{
                      background: "white",
                      border: selected ? "1px solid var(--color-primary)" : "1px solid rgba(0,23,47,0.08)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    {selectMode && (
                      <div
                        className="absolute top-3 left-3 w-5 h-5 rounded-md flex items-center justify-center"
                        style={{
                          background: selected ? "var(--color-primary)" : "white",
                          border: selected ? "none" : "1.5px solid rgba(0,23,47,0.2)",
                        }}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    )}
                    {!selectMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ ids: [issue.id], label: issue.issue_title }); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full transition-colors hover:bg-black/5"
                        aria-label="Delete issue"
                        style={{ color: textSec }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className={`flex items-center justify-between ${selectMode ? "pl-7" : "pr-6"}`}>
                      <h3 className="text-base font-semibold" style={{ color: navy }}>{issue.issue_title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: issue.urgency === "fix_now" ? "rgba(220,38,38,0.1)" : issue.urgency === "fix_soon" ? "rgba(240,144,10,0.1)" : "rgba(107,122,141,0.1)",
                        color: issue.urgency === "fix_now" ? "#DC2626" : issue.urgency === "fix_soon" ? "#F0900A" : "#6B7A8D",
                      }}>
                        {issue.urgency?.replace("_", " ") || "unknown"}
                      </span>
                    </div>
                    {issue.brief_description && (
                      <p className={`text-sm ${selectMode ? "pl-7" : ""}`} style={{ color: textSec }}>{issue.brief_description}</p>
                    )}
                    <div className={`flex items-center gap-2 ${selectMode ? "pl-7" : ""}`}>
                      <span className="text-xs" style={{ color: textSec }}>{issue.category}</span>
                      <span className="text-xs" style={{ color: textSec }}>•</span>
                      <span className="text-xs" style={{ color: textSec }}>{new Date(issue.created_at).toLocaleDateString("en-GB")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {confirmDelete?.label}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the diagnosis from your account. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmDelete) handleDeleteIssues(confirmDelete.ids);
                  setConfirmDelete(null);
                }}
                style={{ background: "#DC2626", color: "white" }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <BottomNavDemo />
      </div>
    </PageTransition>
  );
}
