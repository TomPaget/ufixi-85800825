import { useEffect } from "react";
import { useAdMob } from "@/hooks/useAdMob";
import { useSubscription } from "@/hooks/useSubscription";

export default function NativeBannerAd() {
  const { isPremium } = useSubscription();
  const { showBanner, hideBanner, isNative } = useAdMob();

  useEffect(() => {
    if (!isNative || isPremium) {
      void hideBanner();
      return;
    }

    void showBanner();
    return () => {
      void hideBanner();
    };
  }, [hideBanner, isNative, isPremium, showBanner]);

  if (!isNative || isPremium) return null;

  return <div aria-hidden="true" style={{ minHeight: 50 }} />;
}