import { useEffect } from "react";
import { useAdMob } from "@/hooks/useAdMob";
import { useSubscription } from "@/hooks/useSubscription";

export default function NativeBannerAd() {
  const { isPremium, loading } = useSubscription();
  const { showBanner, hideBanner, isNative } = useAdMob();

  useEffect(() => {
    if (!isNative || loading) {
      return;
    }

    if (isPremium) {
      void hideBanner();
      return;
    }

    const timer = window.setTimeout(() => {
      void showBanner();
    }, 2500);

    return () => {
      window.clearTimeout(timer);
      void hideBanner();
    };
  }, [hideBanner, isNative, isPremium, loading, showBanner]);

  if (!isNative || loading || isPremium) return null;

  return <div aria-hidden="true" style={{ minHeight: 50 }} />;
}