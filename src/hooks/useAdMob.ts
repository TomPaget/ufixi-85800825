import { useCallback, useRef } from "react";

// AdMob IDs
const ADMOB_CONFIG = {
  android: {
    appId: "ca-app-pub-9591380465147865~4948107989",
    interstitialId: "ca-app-pub-9591380465147865/8859554738",
    bannerId: "ca-app-pub-9591380465147865/3029144743",
  },
  ios: {
    appId: "ca-app-pub-9591380465147865~7363598276",
    interstitialId: "ca-app-pub-9591380465147865/5858944911",
    bannerId: "ca-app-pub-9591380465147865/3029144743",
  },
  test: {
    interstitialId: "ca-app-pub-3940256099942544/1033173712",
    bannerId: "ca-app-pub-3940256099942544/2934735716",
  },
};

let admobInitialized = false;
let attRequested = false;
let bannerVisible = false;
let adsConsentResolved = false;
let canRequestAds = true;

function shouldUseTestAds() {
  return false;
}

export function useAdMob() {
  const isNative = useRef(
    typeof window !== "undefined" &&
      window.Capacitor !== undefined &&
      window.Capacitor.isNativePlatform()
  );

  const requestATT = useCallback(async () => {
    if (attRequested) return;
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      if (window.Capacitor?.getPlatform() === "ios") {
        const { status } = await AdMob.trackingAuthorizationStatus();
        console.log("[AdMob ATT] current status:", status);
        if (status === "notDetermined") {
          await AdMob.requestTrackingAuthorization();
        }
      }
      attRequested = true;
    } catch (err) {
      console.warn("ATT not available via AdMob:", err);
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
        initializeForTesting: shouldUseTestAds(),
      });

      try {
        const consentInfo = await AdMob.requestConsentInfo();
        canRequestAds = consentInfo.canRequestAds;

        if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable) {
          const updatedConsentInfo = await AdMob.showConsentForm();
          canRequestAds = updatedConsentInfo.canRequestAds;
        }

        adsConsentResolved = true;
        console.log("[AdMob] consent resolved", {
          canRequestAds,
          status: consentInfo.status,
          formAvailable: consentInfo.isConsentFormAvailable,
        });
      } catch (consentErr) {
        adsConsentResolved = true;
        canRequestAds = true;
        console.warn("[AdMob] consent flow unavailable, continuing:", consentErr);
      }

      admobInitialized = true;
      console.log("[AdMob] initialised", {
        platform: window.Capacitor?.getPlatform?.(),
        mode: import.meta.env.MODE,
        usingTestAds: shouldUseTestAds(),
      });
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

      if (adsConsentResolved && !canRequestAds) {
        console.warn("[AdMob] interstitial blocked: consent not granted for ads yet");
        return false;
      }

      const platform =
        window.Capacitor?.getPlatform() === "ios" ? "ios" : "android";
      const adId = shouldUseTestAds()
        ? ADMOB_CONFIG.test.interstitialId
        : ADMOB_CONFIG[platform].interstitialId;

      return new Promise<boolean>(async (resolve) => {
        let settled = false;
        const handles: Array<{ remove: () => Promise<void> }> = [];

        const settle = (val: boolean) => {
          if (!settled) {
            settled = true;
            handles.forEach((handle) => {
              void handle.remove().catch(() => undefined);
            });
            resolve(val);
          }
        };

        handles.push(await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => settle(true)));
        handles.push(await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => settle(false)));
        handles.push(await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => settle(false)));

        setTimeout(() => settle(false), 30000);

        try {
          await AdMob.prepareInterstitial({ adId, isTesting: shouldUseTestAds() });
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
    if (bannerVisible) return true;

    try {
      const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
      if (!admobInitialized) await initialize();

      if (adsConsentResolved && !canRequestAds) {
        console.warn("[AdMob] banner blocked: consent not granted for ads yet");
        return false;
      }

      const platform = window.Capacitor?.getPlatform() === "ios" ? "ios" : "android";
      const adId = shouldUseTestAds() ? ADMOB_CONFIG.test.bannerId : ADMOB_CONFIG[platform].bannerId;
      if (!adId) return false;

      await AdMob.showBanner({
        adId,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: shouldUseTestAds(),
        margin: 0,
      });
      bannerVisible = true;
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
      bannerVisible = false;
    } catch (err) {
      console.warn("AdMob banner remove error:", err);
    }
  }, []);

  return { initialize, showInterstitial, showBanner, hideBanner, isNative: isNative.current };
}
