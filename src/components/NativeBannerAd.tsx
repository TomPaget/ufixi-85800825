import { useEffect } from "react";
import { useAdMob } from "@/hooks/useAdMob";
import { useSubscription } from "@/hooks/useSubscription";

export default function NativeBannerAd() {
  const { isPremium, loading } = useSubscription();
  const { showBanner, hideBanner, isNative } = useAdMob();

  useEffect(() => {
    if (!isNative || loading || isPremium) {
      void hideBanner();
      return;
    }

    void showBanner();
    return () => {
      void hideBanner();
    };
  }, [hideBanner, isNative, isPremium, loading, showBanner]);

  if (!isNative || loading || isPremium) return null;

  return <div aria-hidden="true" style={{ minHeight: 50 }} />;
}