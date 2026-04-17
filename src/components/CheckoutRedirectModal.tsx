import { useEffect, useState } from "react";
import { ExternalLink, Zap } from "lucide-react";

interface Props {
  url: string | null;
  onClose: () => void;
}

export default function CheckoutRedirectModal({ url, onClose }: Props) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!url) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          // Auto-redirect in same tab — guaranteed to work
          window.location.href = url;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [url]);

  if (!url) return null;

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
          Redirecting to secure checkout
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Taking you to Stripe in {countdown}…
        </p>
        <a
          href={url}
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ExternalLink className="w-4 h-4" />
          Continue to checkout now
        </a>
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
