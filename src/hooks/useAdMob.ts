import { useCallback, useRef } from "react";

// AdMob IDs
const ADMOB_CONFIG = {
  android: {
    appId: "ca-app-pub-9591380465147865~4948107989",
    interstitialId: "ca-app-pub-9591380465147865/8859554738",
  },
  ios: {
    appId: "ca-app-pub-9591380465147865~3443454625",
    interstitialId: "ca-app-pub-9591380465147865/2130372952",
  },
  test: {
    interstitialId: "ca-app-pub-3940256099942544/1033173712",
  },
};

let admobInitialized = false;

export function useAdMob() {
  const isNative = useRef(
    typeof window !== "undefined" &&
      window.Capacitor !== undefined &&
      window.Capacitor.isNativePlatform()
  );

  const initialize = useCallback(async () => {
    if (!isNative.current || admobInitialized) return;
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.initialize({
        initializeForTesting: import.meta.env.DEV,
      });
      admobInitialized = true;
    } catch (err) {
      console.error("AdMob init error:", err);
    }
  }, []);

  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!isNative.current) {
      return false;
    }

    try {
      const { AdMob, InterstitialAdPluginEvents } = await import(
        "@capacitor-community/admob"
      );

      if (!admobInitialized) {
        await initialize();
      }

      const platform =
        window.Capacitor?.getPlatform() === "ios" ? "ios" : "android";
      const adId = import.meta.env.DEV
        ? ADMOB_CONFIG.test.interstitialId
        : ADMOB_CONFIG[platform].interstitialId;

      return new Promise<boolean>(async (resolve) => {
        let settled = false;

        const settle = (val: boolean) => {
          if (!settled) {
            settled = true;
            // Remove all interstitial listeners to prevent leaks
            AdMob.removeAllListeners();
            resolve(val);
          }
        };

        AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => settle(true));
        AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => settle(false));
        AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => settle(false));

        // Timeout fallback — don't block forever
        setTimeout(() => settle(false), 30000);

        try {
          await AdMob.prepareInterstitial({ adId, isTesting: import.meta.env.DEV });
          await AdMob.showInterstitial();
        } catch {
          settle(false);
        }
      });
    } catch (err) {
      console.error("AdMob interstitial error:", err);
      return false;
    }
  }, [initialize]);

  return { initialize, showInterstitial, isNative: isNative.current };
}
