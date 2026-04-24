import { useCallback, useRef } from "react";

// AdMob IDs
const ADMOB_CONFIG = {
  android: {
    appId: "ca-app-pub-9591380465147865~4948107989",
    interstitialId: "ca-app-pub-9591380465147865/8859554738",
  },
  ios: {
    appId: "ca-app-pub-9591380465147865~7363598276",
    interstitialId: "ca-app-pub-9591380465147865/5858944911",
  },
  test: {
    interstitialId: "ca-app-pub-3940256099942544/1033173712",
  },
};

let admobInitialized = false;
let admobInitializing: Promise<void> | null = null;
let attRequested = false;
let adsConsentResolved = false;
let canRequestAds = true;
let requestNonPersonalizedAds = false;
let interstitialInProgress = false;

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
    if (admobInitializing) return admobInitializing;

    admobInitializing = (async () => {
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

        if (!canRequestAds) {
          requestNonPersonalizedAds = true;
          canRequestAds = true;
          console.warn("[AdMob] personalised ad consent unavailable; requesting non-personalised live ads.");
        }

        adsConsentResolved = true;
        console.log("[AdMob] consent resolved", {
          canRequestAds,
          requestNonPersonalizedAds,
          status: consentInfo.status,
          formAvailable: consentInfo.isConsentFormAvailable,
        });
      } catch (consentErr) {
        adsConsentResolved = true;
        canRequestAds = true;
        requestNonPersonalizedAds = true;
        console.warn("[AdMob] consent flow unavailable, continuing:", consentErr);
      }

      admobInitialized = true;
      console.log("[AdMob] initialised", {
        platform: window.Capacitor?.getPlatform?.(),
        mode: import.meta.env.MODE,
        usingTestAds: shouldUseTestAds(),
      });
    })().catch((err) => {
      admobInitialized = false;
      console.error("AdMob init error:", err);
    }).finally(() => {
      admobInitializing = null;
    });

    return admobInitializing;
  }, [requestATT]);

  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!isNative.current) {
      return false;
    }

    try {
      if (interstitialInProgress) return false;
      interstitialInProgress = true;

      const { AdMob, InterstitialAdPluginEvents } = await import("@capacitor-community/admob");

      if (!admobInitialized) {
        await initialize();
      }

      if (!admobInitialized) {
        interstitialInProgress = false;
        return false;
      }

      if (adsConsentResolved && !canRequestAds) {
        console.warn("[AdMob] interstitial blocked: consent not granted for ads yet");
        interstitialInProgress = false;
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
            interstitialInProgress = false;
            resolve(val);
          }
        };

        handles.push(await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => settle(true)));
        handles.push(await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => settle(false)));
        handles.push(await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => settle(false)));

        setTimeout(() => settle(false), 30000);

        try {
          console.log("[AdMob] loading live interstitial", { platform, adId, npa: requestNonPersonalizedAds });
          await AdMob.prepareInterstitial({
            adId,
            isTesting: shouldUseTestAds(),
            npa: requestNonPersonalizedAds,
            immersiveMode: true,
          });
          await AdMob.showInterstitial();
        } catch (err) {
          console.error("[AdMob] interstitial prepare/show failed:", err);
          settle(false);
        }
      });
    } catch (err) {
      interstitialInProgress = false;
      console.error("AdMob interstitial error:", err);
      return false;
    }
  }, [initialize]);

  return { initialize, showInterstitial, isNative: isNative.current };
}
