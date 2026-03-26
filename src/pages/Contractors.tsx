import { useState } from "react";
import { Plus, Star, Phone, Mail, Heart } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import PageHeader from "@/components/PageHeader";
import { MOCK_CONTRACTORS } from "@/data/mockData";

export default function Contractors() {
  const [contractors] = useState(MOCK_CONTRACTORS);

  return (
    <PageTransition>
      <div className="min-h-screen pb-8" style={{ background: "var(--color-bg)" }}>
        <PageHeader
          title="My Contractors"
          rightAction={
            <button className="flex items-center justify-center rounded-xl" style={{ minWidth: 44, minHeight: 44, color: "var(--color-primary)" }}>
              <Plus className="w-5 h-5" />
            </button>
          }
        />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-3">
          {contractors.map((c) => (
            <div key={c.id} className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{c.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,23,47,0.05)", color: "var(--color-text-secondary)" }}>{c.specialty}</span>
                </div>
                <Heart className="w-5 h-5" style={{ color: c.isFavorite ? "#DC2626" : "#9aa5b4", fill: c.isFavorite ? "#DC2626" : "none" }} />
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5" style={{ color: i < c.rating ? "#F59E0B" : "#E2E8F0", fill: i < c.rating ? "#F59E0B" : "none" }} />
                ))}
              </div>
              <div className="flex gap-2">
                <a href={`tel:${c.phone}`} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(0,23,47,0.03)", color: "var(--color-navy)", minHeight: 40 }}>
                  <Phone className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} /> Call
                </a>
                <a href={`mailto:${c.email}`} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(0,23,47,0.03)", color: "var(--color-navy)", minHeight: 40 }}>
                  <Mail className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} /> Email
                </a>
              </div>
              {c.notes && <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.notes}</p>}
            </div>
          ))}
        </main>
      </div>
    </PageTransition>
  );
}
