import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, Users, Search, TrendingUp, CreditCard, Bell, Settings, Download,
  LogOut, ChevronDown, Filter, RefreshCw, Eye, Shield
} from "lucide-react";
import { toast } from "sonner";

type AdminPage = "overview" | "users" | "scans" | "insights" | "subscriptions" | "notifications" | "settings" | "export";

const NAV_ITEMS: { id: AdminPage; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "scans", label: "Scans & Issues", icon: Search },
  { id: "insights", label: "Data Insights", icon: TrendingUp },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "App Settings", icon: Settings },
  { id: "export", label: "Data Export", icon: Download },
];

export default function AdminDashboard() {
  const [page, setPage] = useState<AdminPage>("overview");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const navigate = useNavigate();

  // Stats
  const [insightCount, setInsightCount] = useState(0);
  const [insights, setInsights] = useState<any[]>([]);
  const [exportFilters, setExportFilters] = useState({ region: "", issueType: "", urgency: "", dateFrom: "", dateTo: "" });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/"); return; }
    setAdminEmail(user.email || "");
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin" as any);
    if (!data || data.length === 0) { navigate("/"); return; }
    setIsAdmin(true);
    loadData();
  };

  const loadData = async () => {
    const { count } = await supabase.from("anonymised_insights").select("*", { count: "exact", head: true });
    setInsightCount(count || 0);
    const { data } = await supabase.from("anonymised_insights").select("*").order("issue_date", { ascending: false }).limit(100);
    setInsights(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const exportCSV = () => {
    let filtered = insights;
    if (exportFilters.region) filtered = filtered.filter(i => i.region?.toLowerCase().includes(exportFilters.region.toLowerCase()));
    if (exportFilters.issueType) filtered = filtered.filter(i => i.issue_type === exportFilters.issueType);
    if (exportFilters.urgency) filtered = filtered.filter(i => i.urgency === exportFilters.urgency);

    const headers = ["issue_type","issue_title","category","urgency","severity_score","priority","diy_safe","diy_cost_estimate","pro_cost_estimate","postcode_area","region","property_category","user_tier","issue_date","status"];
    const csv = [headers.join(","), ...filtered.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ufixi-anonymised-data-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("CSV exported successfully");
  };

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F9FA" }}><RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#6B7A8D" }} /></div>;

  const navy = "#00172F";
  const textSec = "#6B7A8D";

  // Category stats
  const categoryBreakdown = insights.reduce((acc: Record<string, number>, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
  const urgencyBreakdown = insights.reduce((acc: Record<string, number>, i) => {
    acc[i.urgency || "unknown"] = (acc[i.urgency || "unknown"] || 0) + 1;
    return acc;
  }, {});
  const avgDiyCost = insights.length ? Math.round(insights.reduce((s, i) => s + (i.diy_cost_estimate || 0), 0) / insights.length) : 0;
  const avgProCost = insights.length ? Math.round(insights.reduce((s, i) => s + (i.pro_cost_estimate || 0), 0) / insights.length) : 0;

  return (
    <div className="min-h-screen flex" style={{ background: "#F8F9FA" }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: navy }}>
        <div className="p-5 flex items-center gap-2">
          <Shield className="w-6 h-6" style={{ color: "#E8530A" }} />
          <span className="text-lg font-bold text-white tracking-wide">Ufixi Admin</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
              style={{
                background: page === id ? "rgba(232,83,10,0.15)" : "transparent",
                color: page === id ? "#E8530A" : "rgba(255,255,255,0.7)",
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/50 truncate mb-2">{adminEmail}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between" style={{ background: "#F8F9FA", borderBottom: "1px solid rgba(0,23,47,0.06)" }}>
          <h1 className="text-xl font-bold" style={{ color: navy }}>{NAV_ITEMS.find(n => n.id === page)?.label}</h1>
          <button onClick={loadData} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", color: textSec }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </header>

        <div className="p-8">
          {/* OVERVIEW */}
          {page === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Total Records", value: insightCount, color: "#E8530A" },
                  { label: "Avg DIY Cost", value: `£${avgDiyCost}`, color: "#1D9E75" },
                  { label: "Avg Pro Cost", value: `£${avgProCost}`, color: "#3B82F6" },
                  { label: "Categories", value: Object.keys(categoryBreakdown).length, color: "#D93870" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl p-5" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <p className="text-xs font-semibold" style={{ color: textSec }}>{label}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-5" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: navy }}>Issue Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(categoryBreakdown).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-sm capitalize" style={{ color: navy }}>{cat}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 rounded-full" style={{ width: `${Math.max(((count as number) / insights.length) * 150, 20)}px`, background: "linear-gradient(135deg, #E8530A, #D93870)" }} />
                          <span className="text-xs font-semibold" style={{ color: textSec }}>{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: navy }}>Urgency Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(urgencyBreakdown).map(([urg, count]) => (
                      <div key={urg} className="flex items-center justify-between">
                        <span className="text-sm capitalize" style={{ color: navy }}>{urg.replace("_", " ")}</span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                          background: urg === "fix_now" ? "rgba(220,38,38,0.1)" : urg === "fix_soon" ? "rgba(240,144,10,0.1)" : "rgba(107,122,141,0.1)",
                          color: urg === "fix_now" ? "#DC2626" : urg === "fix_soon" ? "#F0900A" : "#6B7A8D",
                        }}>{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent records table */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(0,23,47,0.06)" }}>
                  <h3 className="text-sm font-semibold" style={{ color: navy }}>Recent Records</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "rgba(0,23,47,0.02)" }}>
                        {["Title", "Category", "Urgency", "DIY £", "Pro £", "Tier", "Date"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: textSec }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {insights.slice(0, 20).map((r) => (
                        <tr key={r.id} className="border-t hover:bg-gray-50" style={{ borderColor: "rgba(0,23,47,0.04)" }}>
                          <td className="px-4 py-3 font-medium" style={{ color: navy }}>{r.issue_title}</td>
                          <td className="px-4 py-3 capitalize" style={{ color: textSec }}>{r.category}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              background: r.urgency === "fix_now" ? "rgba(220,38,38,0.1)" : r.urgency === "fix_soon" ? "rgba(240,144,10,0.1)" : "rgba(107,122,141,0.1)",
                              color: r.urgency === "fix_now" ? "#DC2626" : r.urgency === "fix_soon" ? "#F0900A" : "#6B7A8D",
                            }}>{r.urgency?.replace("_", " ")}</span>
                          </td>
                          <td className="px-4 py-3" style={{ color: textSec }}>£{r.diy_cost_estimate || 0}</td>
                          <td className="px-4 py-3" style={{ color: textSec }}>£{r.pro_cost_estimate || 0}</td>
                          <td className="px-4 py-3 capitalize" style={{ color: textSec }}>{r.user_tier}</td>
                          <td className="px-4 py-3" style={{ color: textSec }}>{r.issue_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {insights.length === 0 && (
                    <p className="text-center py-8 text-sm" style={{ color: textSec }}>No records yet. Data will appear after users complete scans.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* INSIGHTS */}
          {page === "insights" && (
            <div className="space-y-6">
              <div className="rounded-2xl p-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <p className="text-sm" style={{ color: "#1E40AF" }}>
                  <Shield className="w-4 h-4 inline mr-1" />
                  GDPR Compliant — All data is fully anonymised. No PII is stored or exported.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Records", value: insightCount },
                  { label: "Avg DIY Cost", value: `£${avgDiyCost}` },
                  { label: "Avg Pro Cost", value: `£${avgProCost}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl p-5 text-center" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <p className="text-xs" style={{ color: textSec }}>{label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: navy }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-5" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: navy }}>DIY vs Professional Split</h3>
                <div className="space-y-3">
                  {insights.length > 0 && (() => {
                    const diySafe = insights.filter(i => i.diy_safe).length;
                    const proNeeded = insights.length - diySafe;
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-24" style={{ color: navy }}>DIY Safe</span>
                          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(0,23,47,0.05)" }}>
                            <div className="h-full rounded-full" style={{ width: `${(diySafe / insights.length) * 100}%`, background: "#1D9E75" }} />
                          </div>
                          <span className="text-sm font-semibold" style={{ color: textSec }}>{diySafe} ({Math.round(diySafe / insights.length * 100)}%)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-24" style={{ color: navy }}>Pro Needed</span>
                          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(0,23,47,0.05)" }}>
                            <div className="h-full rounded-full" style={{ width: `${(proNeeded / insights.length) * 100}%`, background: "#E8530A" }} />
                          </div>
                          <span className="text-sm font-semibold" style={{ color: textSec }}>{proNeeded} ({Math.round(proNeeded / insights.length * 100)}%)</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* DATA EXPORT */}
          {page === "export" && (
            <div className="space-y-6">
              <div className="rounded-2xl p-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <p className="text-sm" style={{ color: "#1E40AF" }}>
                  <Shield className="w-4 h-4 inline mr-1" />
                  GDPR Compliant — Anonymised aggregate data only. No personally identifiable information included.
                </p>
              </div>

              <div className="rounded-2xl p-5" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: navy }}>Export Anonymised Insights</h3>
                <p className="text-sm mb-4" style={{ color: textSec }}>
                  {insightCount} total records available
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: textSec }}>Region</label>
                    <input
                      value={exportFilters.region}
                      onChange={(e) => setExportFilters({ ...exportFilters, region: e.target.value })}
                      placeholder="e.g. London"
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: textSec }}>Issue Type</label>
                    <select
                      value={exportFilters.issueType}
                      onChange={(e) => setExportFilters({ ...exportFilters, issueType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                    >
                      <option value="">All</option>
                      {["plumbing","electrical","structural","appliance","hvac","roofing","damp","mould","other"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: textSec }}>Urgency</label>
                    <select
                      value={exportFilters.urgency}
                      onChange={(e) => setExportFilters({ ...exportFilters, urgency: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: "1px solid rgba(0,23,47,0.1)", color: navy }}
                    >
                      <option value="">All</option>
                      {["fix_now","fix_soon","monitor","ignore"].map(u => (
                        <option key={u} value={u}>{u.replace("_"," ")}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #E8530A, #D93870)" }}
                >
                  <Download className="w-4 h-4" /> Download CSV
                </button>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {page === "settings" && (
            <div className="space-y-4">
              {[
                { label: "Ads Enabled", key: "ads", type: "toggle" },
                { label: "Free Scan Limit", key: "scanLimit", type: "number" },
                { label: "Max Scans Per Day", key: "maxPerDay", type: "number" },
                { label: "Registrations Open", key: "regs", type: "toggle" },
                { label: "Maintenance Mode", key: "maintenance", type: "toggle" },
                { label: "Amazon Affiliate Tag", key: "amazonTag", type: "text" },
                { label: "Support Email", key: "supportEmail", type: "text" },
              ].map(({ label, type }) => (
                <div key={label} className="flex items-center justify-between rounded-2xl p-4" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <span className="text-sm font-medium" style={{ color: navy }}>{label}</span>
                  {type === "toggle" ? (
                    <div className="w-11 h-6 rounded-full relative cursor-pointer" style={{ background: "rgba(0,23,47,0.15)" }}>
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all" />
                    </div>
                  ) : type === "number" ? (
                    <input type="number" defaultValue={3} className="w-20 px-3 py-1.5 rounded-lg text-sm text-right" style={{ border: "1px solid rgba(0,23,47,0.1)", color: navy }} />
                  ) : (
                    <input type="text" defaultValue={label.includes("Amazon") ? "ufixi-21" : "support@ufixi.app"} className="w-48 px-3 py-1.5 rounded-lg text-sm" style={{ border: "1px solid rgba(0,23,47,0.1)", color: navy }} />
                  )}
                </div>
              ))}
              <button className="px-5 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #E8530A, #D93870)" }}>
                Save Changes
              </button>
            </div>
          )}

          {/* Placeholder pages */}
          {["users", "scans", "subscriptions", "notifications"].includes(page) && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p className="text-sm" style={{ color: textSec }}>
                {page === "users" && "User management will be available when users sign up. View profiles, roles, and subscription status here."}
                {page === "scans" && "All saved scans across users will appear here. Search, filter, and manage issues."}
                {page === "subscriptions" && "Stripe subscription data will appear here once payments are connected."}
                {page === "notifications" && "Send push/in-app notifications to all users, premium users, or individuals from here."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
