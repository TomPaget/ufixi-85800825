import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ufixiLogo from "@/assets/ufixi-logo.svg";

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack = true, showLogo = true, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30" style={{ background: "rgba(253,246,238,0.85)", backdropFilter: "blur(12px)", paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)", paddingBottom: 10 }}>
      <div className="max-w-lg mx-auto px-4 flex items-center relative" style={{ minHeight: 52 }}>
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ color: "var(--color-navy)", minWidth: 48, minHeight: 48 }}
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
        ) : <div style={{ minWidth: 44 }} />}

        {showLogo ? (
          <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
            <img src={ufixiLogo} alt="Ufixi" className="h-7 object-contain" />
          </div>
        ) : title ? (
          <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-lg" style={{ color: "var(--color-navy)", letterSpacing: "-0.02em" }}>{title}</span>
          </div>
        ) : null}

        <div className="ml-auto flex-shrink-0">
          {rightAction || <div style={{ minWidth: 44 }} />}
        </div>
      </div>
    </header>
  );
}
