import { Home, ClipboardList, Bot, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/home" },
  { label: "My Issues", icon: ClipboardList, path: "/issues" },
  { label: "AI Help", icon: Bot, path: "/ai-help" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function BottomNavDemo() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--glass-border)",
        paddingBottom: "calc(var(--safe-bottom) + 4px)",
        paddingTop: "8px",
        paddingLeft: "calc(var(--safe-left) + 4px)",
        paddingRight: "calc(var(--safe-right) + 4px)",
        minHeight: "var(--app-bottom-nav-height)",
        gap: "2px",
      }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path || (path === "/home" && location.pathname === "/");
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 rounded-xl transition-all active:scale-90"
            style={{ minWidth: 60, minHeight: 52, background: "transparent", border: "none", cursor: "pointer", padding: "6px 10px", flex: "1 1 0" }}
          >
            <Icon
              className="w-6 h-6 transition-colors"
              style={{ color: isActive ? "var(--color-primary)" : "#9aa5b4" }}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span
              className="text-xs font-semibold transition-colors"
              style={{ color: isActive ? "var(--color-primary)" : "#9aa5b4", letterSpacing: "0.04em" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
