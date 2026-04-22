import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAdMob } from "@/hooks/useAdMob";
import { useSubscription } from "@/hooks/useSubscription";

const HIDDEN_PATHS = new Set(["/issues", "/my-issues", "/ai-help", "/settings"]);

export default function NativeBannerAd() {
  const { isPremium } = useSubscription();
  const { showBanner, hideBanner, isNative } = useAdMob();
  const { pathname } = useLocation();
  const shouldHide = HIDDEN_PATHS.has(pathname);

  useEffect(() => {
    if (!isNative || isPremium || shouldHide) {
      void hideBanner();
      return;
    }

    void showBanner();
    return () => {
      void hideBanner();
    };
  }, [hideBanner, isNative, isPremium, shouldHide, showBanner]);

  if (!isNative || isPremium || shouldHide) return null;

  return <div aria-hidden="true" style={{ minHeight: 50 }} />;
}