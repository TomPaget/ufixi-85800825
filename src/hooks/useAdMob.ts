import { useCallback, useRef } from "react";

// AdMob IDs
const ADMOB_CONFIG = {
  android: {
    appId: "ca-app-pub-9591380465147865~4948107989",
    interstitialId: "ca-app-pub-9591380465147865/8859554738",
    bannerId: "",
  },
  ios: {
    appId: "ca-app-pub-9591380465147865~7363598276",
    interstitialId: "ca-app-pub-9591380465147865/5858944911",
    bannerId: "",
  },
  test: {
    interstitialId: "ca-app-pub-3940256099942544/1033173712",
    bannerId: "ca-app-pub-3940256099942544/2934735716",
  },
};

let admobInitialized = false;
let attRequested = false;

export function useAdMob() {
  const isNative = useRef(
    typeof window !== "undefined" &&
      window.Capacitor !== undefined &&
      window.Capacitor.isNativePlatform()
  );

  const requestATT = useCallback(async () => {
    if (attRequested) return;
    if (window.Capacitor?.getPlatform() !== "ios") {
      attRequested = true;
      return;
    }
    try {
      const mod: any = await (Function('return import("capacitor-plugin-app-tracking-transparency")')() as Promise<any>);
      const ATT = mod?.AppTrackingTransparency;
      if (!ATT) throw new Error("ATT plugin not found");
      const { status } = await ATT.getStatus();
      console.log("[ATT] current status:", status);
      if (status === "notDetermined") {
        const res = await ATT.requestPermission();
        console.log("[ATT] permission result:", res?.status);
      }
      attRequested = true;
    } catch (err) {
      console.warn("ATT not available:", err);
      attRequested = true;
    }
  }, []);

  const initialize = useCallback(async () => {
    if (!isNative.current || admobInitialized) return;
    try {
      // Request ATT before initialising AdMob (required by Apple)
      await requestATT();

      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.initialize({
        initializeForTesting: import.meta.env.DEV,
      });
      admobInitialized = true;
    } catch (err) {
      console.error("AdMob init error:", err);
    }
  }, [requestATT]);

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
            (AdMob as any).removeAllListeners?.();
            resolve(val);
          }
        };

        AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => settle(true));
        AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => settle(false));
        AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => settle(false));

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

  const showBanner = useCallback(async (): Promise<boolean> => {
    if (!isNative.current) return false;

    try {
      const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
      if (!admobInitialized) await initialize();

      const platform = window.Capacitor?.getPlatform() === "ios" ? "ios" : "android";
      const adId = import.meta.env.DEV ? ADMOB_CONFIG.test.bannerId : ADMOB_CONFIG[platform].bannerId;
      if (!adId) return false;

      await AdMob.showBanner({
        adId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: import.meta.env.DEV,
      });
      return true;
    } catch (err) {
      console.error("AdMob banner error:", err);
      return false;
    }
  }, [initialize]);

  const hideBanner = useCallback(async () => {
    if (!isNative.current) return;
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.removeBanner();
    } catch (err) {
      console.warn("AdMob banner remove error:", err);
    }
  }, []);

  return { initialize, showInterstitial, showBanner, hideBanner, isNative: isNative.current };
}
