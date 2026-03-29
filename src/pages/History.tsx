import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import IssueCardDemo from "@/components/IssueCardDemo";
import { MOCK_ISSUES } from "@/data/mockData";

export default function History() {
  const navigate = useNavigate();
  const resolved = MOCK_ISSUES.filter((i) => i.status === "resolved");

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ background: "var(--color-bg)", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <PageHeader title="History" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-3">
          {resolved.length > 0 ? (
            resolved.map((issue) => (
              <div key={issue.id} onClick={() => navigate(`/issue/${issue.id}`)}>
                <IssueCardDemo issue={issue} />
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No resolved issues yet</p>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
