import { useEffect, useRef, useState } from "react";
import { ExternalLink, Zap } from "lucide-react";

interface Props {
  url: string | null;
  onClose: () => void;
}

/**
 * Stripe Checkout sets X-Frame-Options: DENY, so it CANNOT load inside an iframe.
 * We must break out to the top-level window. If that fails (cross-origin), we
 * give the user a button that opens a real new tab via user gesture.
 */
export default function CheckoutRedirectModal({ url, onClose }: Props) {
  const [needsManualClick, setNeedsManualClick] = useState(false);
  const triedAuto = useRef(false);

  useEffect(() => {
    if (!url) {
      triedAuto.current = false;
      setNeedsManualClick(false);
      return;
    }
    if (triedAuto.current) return;
    triedAuto.current = true;

    // Try to break out of any iframe to top-level window
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = url;
        return;
      }
    } catch {
      // Cross-origin — top-level navigation blocked
    }

    // Try a same-window navigation (works when not in iframe)
    try {
      const inIframe = window.self !== window.top;
      if (!inIframe) {
        window.location.href = url;
        return;
      }
    } catch {
      /* ignore */
    }

    // Fall back to manual click required
    setNeedsManualClick(true);
  }, [url]);

  if (!url) return null;

  const handleManualOpen = () => {
    // User gesture — opens in a real new tab, escapes iframe
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      // Popup blocked too — last resort, navigate top
      try {
        if (window.top) window.top.location.href = url;
        else window.location.href = url;
      } catch {
        window.location.href = url;
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
      style={{ background: "rgba(0,23,47,0.6)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center space-y-4"
        style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        <div
          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>
          {needsManualClick ? "Open secure checkout" : "Redirecting…"}
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {needsManualClick
            ? "Tap below to open Stripe checkout in a new tab."
            : "Taking you to Stripe to complete payment."}
        </p>
        <button
          onClick={handleManualOpen}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ExternalLink className="w-4 h-4" />
          Continue to checkout
        </button>
        <button
          onClick={onClose}
          className="w-full text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
