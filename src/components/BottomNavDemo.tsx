import { Home, ClipboardList, MessageSquareText, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/home" },
  { label: "My Issues", icon: ClipboardList, path: "/issues" },
  { label: "Forum", icon: MessageSquareText, path: "/forum" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function BottomNavDemo() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--glass-border)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        paddingTop: "8px",
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path || (path === "/home" && location.pathname === "/");
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 rounded-xl transition-all active:scale-90"
            style={{ minWidth: 56, minHeight: 48, background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px" }}
          >
            <Icon
              className="w-5 h-5 transition-colors"
              style={{ color: isActive ? "var(--color-primary)" : "#9aa5b4" }}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span
              className="text-[10px] font-semibold transition-colors"
              style={{ color: isActive ? "var(--color-primary)" : "#9aa5b4" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
