import { ReactNode, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  /** Pixels the user must pull before refresh triggers. */
  threshold?: number;
}

/**
 * Lightweight pull to refresh wrapper. Works on native iOS/Android (Capacitor)
 * and on touch-capable web. Falls back to nothing on desktop.
 */
export default function PullToRefresh({ onRefresh, children, threshold = 70 }: PullToRefreshProps) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        setPull(Math.min(dy * 0.5, threshold * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pull >= threshold && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, refreshing, threshold, onRefresh]);

  const showIndicator = pull > 8 || refreshing;

  return (
    <div ref={containerRef}>
      {showIndicator && (
        <div
          className="flex items-center justify-center"
          style={{
            height: Math.max(pull, refreshing ? threshold : 0),
            transition: refreshing ? "height 0.2s ease-out" : "none",
            color: "var(--color-primary)",
          }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw
              className="w-5 h-5"
              style={{
                transform: `rotate(${Math.min(pull / threshold, 1) * 270}deg)`,
                transition: "transform 0.05s linear",
                opacity: Math.min(pull / threshold, 1),
              }}
            />
          )}
        </div>
      )}
      <div style={{ transform: `translateY(${refreshing ? 0 : 0}px)` }}>{children}</div>
    </div>
  );
}