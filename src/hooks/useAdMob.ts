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
  // Test IDs for development
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
      console.log("AdMob initialized");
    } catch (err) {
      console.error("AdMob init error:", err);
    }
  }, []);

  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!isNative.current) {
      // On web, fall back to the existing countdown ad screen
      return false;
    }

    try {
      const { AdMob, AdOptions, InterstitialAdPluginEvents } = await import(
        "@capacitor-community/admob"
      );

      if (!admobInitialized) {
        await initialize();
      }

      const platform =
        window.Capacitor.getPlatform() === "ios" ? "ios" : "android";
      const adId = import.meta.env.DEV
        ? ADMOB_CONFIG.test.interstitialId
        : ADMOB_CONFIG[platform].interstitialId;

      const options: AdOptions = {
        adId,
        isTesting: import.meta.env.DEV,
      };

      // Wait for the ad to load, then show it
      return new Promise<boolean>((resolve) => {
        let dismissed = false;

        const onDismissed = AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          () => {
            dismissed = true;
            onDismissed.remove();
            resolve(true);
          }
        );

        const onFailedToLoad = AdMob.addListener(
          InterstitialAdPluginEvents.FailedToLoad,
          () => {
            onFailedToLoad.remove();
            if (!dismissed) resolve(false);
          }
        );

        const onFailedToShow = AdMob.addListener(
          InterstitialAdPluginEvents.FailedToShow,
          () => {
            onFailedToShow.remove();
            if (!dismissed) resolve(false);
          }
        );

        AdMob.prepareInterstitial(options)
          .then(() => AdMob.showInterstitial())
          .catch(() => resolve(false));
      });
    } catch (err) {
      console.error("AdMob interstitial error:", err);
      return false;
    }
  }, [initialize]);

  return { initialize, showInterstitial, isNative: isNative.current };
}
