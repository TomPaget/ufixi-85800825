// RevenueCat helper — used on native iOS/Android only.
// Web continues to use Stripe via existing edge functions.
import type { CustomerInfo, PurchasesOffering } from "@revenuecat/purchases-capacitor";

// PUBLISHABLE keys — safe to ship in the client.
// (RevenueCat publishable keys are not secrets; they identify the app to RC.)
const REVENUECAT_IOS_KEY = "appl_WaXjCvKSQUwZNmQfPqwqxyBtVLG";
const REVENUECAT_ANDROID_KEY = "goog_PASTE_ANDROID_KEY_HERE";

export const PREMIUM_ENTITLEMENT_ID = "Ufixi Premium";
export const PREMIUM_PRODUCT_ID = "premium_subscription_v2";

type RevenueCatModule = typeof import("@revenuecat/purchases-capacitor");

let initialized = false;
let lastInitError: string | null = null;
let revenueCatModulePromise: Promise<RevenueCatModule> | null = null;

function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  return window.Capacitor?.getPlatform?.() ?? "web";
}

async function getRevenueCatModule(): Promise<RevenueCatModule | null> {
  if (!isRevenueCatPlatform()) return null;

  try {
    revenueCatModulePromise ??= import("@revenuecat/purchases-capacitor");
    return await revenueCatModulePromise;
  } catch (err) {
    revenueCatModulePromise = null;
    lastInitError = `Plugin load failed: ${(err as Error)?.message ?? err}`;
    console.error("[RevenueCat] Plugin load failed:", err);
    return null;
  }
}

export function isRevenueCatPlatform(): boolean {
  const p = getPlatform();
  return p === "ios" || p === "android";
}

export async function initRevenueCat(appUserId?: string | null): Promise<void> {
  if (!isRevenueCatPlatform() || initialized) return;

  const platform = getPlatform();
  const apiKey = platform === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  if (!apiKey || apiKey.includes("PASTE_")) {
    lastInitError = `API key not configured for ${platform}`;
    console.warn("[RevenueCat]", lastInitError);
    return;
  }

  const revenueCat = await getRevenueCatModule();
  if (!revenueCat) return;

  try {
    const { Purchases, LOG_LEVEL } = revenueCat;
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey, appUserID: appUserId ?? undefined });
    initialized = true;
    lastInitError = null;
    console.log("[RevenueCat] Initialised", { platform, appUserId });
  } catch (err) {
    lastInitError = `configure() failed: ${(err as Error)?.message ?? err}`;
    console.error("[RevenueCat] Init failed:", err);
  }
}

export async function setRevenueCatUser(userId: string | null): Promise<void> {
  if (!isRevenueCatPlatform() || !initialized) return;

  const revenueCat = await getRevenueCatModule();
  if (!revenueCat) return;

  try {
    const { Purchases } = revenueCat;
    const [{ appUserID }, { isAnonymous }] = await Promise.all([
      Purchases.getAppUserID(),
      Purchases.isAnonymous(),
    ]);

    if (userId) {
      if (!isAnonymous && appUserID === userId) return;
      await Purchases.logIn({ appUserID: userId });
    } else {
      if (isAnonymous) return;
      await Purchases.logOut();
    }
  } catch (err) {
    console.warn("[RevenueCat] setUser failed:", err);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatPlatform() || !initialized) return null;

  const revenueCat = await getRevenueCatModule();
  if (!revenueCat) return null;

  try {
    const { Purchases } = revenueCat;
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (err) {
    console.warn("[RevenueCat] getCustomerInfo failed:", err);
    return null;
  }
}

export interface RcStatus {
  isPremium: boolean;
  expiresAt: string | null;
  willRenew: boolean;
  hasEverSubscribed: boolean;
}

export function statusFromCustomerInfo(info: CustomerInfo | null): RcStatus {
  if (!info) return { isPremium: false, expiresAt: null, willRenew: false, hasEverSubscribed: false };
  const ent = info.entitlements.active[PREMIUM_ENTITLEMENT_ID]
    ?? info.entitlements.all[PREMIUM_ENTITLEMENT_ID];
  const active = !!info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  return {
    isPremium: active,
    expiresAt: ent?.expirationDate ?? null,
    willRenew: !!ent?.willRenew,
    hasEverSubscribed: Object.keys(info.entitlements.all).length > 0
      || (info.allPurchasedProductIdentifiers?.length ?? 0) > 0,
  };
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isRevenueCatPlatform() || !initialized) return null;

  const revenueCat = await getRevenueCatModule();
  if (!revenueCat) return null;

  try {
    const { Purchases } = revenueCat;
    const { current } = await Purchases.getOfferings();
    return current ?? null;
  } catch (err) {
    console.warn("[RevenueCat] getOfferings failed:", err);
    return null;
  }
}

export async function purchasePremium(): Promise<RcStatus> {
  if (!isRevenueCatPlatform()) {
    throw new Error("In-app purchases only available in the iOS/Android app");
  }

  if (!initialized) {
    await initRevenueCat();
  }

  const revenueCat = await getRevenueCatModule();
  if (!revenueCat || !initialized) {
    throw new Error(lastInitError ?? "RevenueCat failed to initialise. Please reinstall the app.");
  }

  const { Purchases } = revenueCat;
  const offering = await getCurrentOffering();
  const pkg = offering?.availablePackages?.find(
    (p) => p.product?.identifier === PREMIUM_PRODUCT_ID,
  ) ?? offering?.monthly ?? offering?.availablePackages?.[0];

  if (!pkg) throw new Error("No subscription package available");

  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return statusFromCustomerInfo(customerInfo);
}

export async function restorePurchases(): Promise<RcStatus> {
  if (!isRevenueCatPlatform()) {
    return { isPremium: false, expiresAt: null, willRenew: false, hasEverSubscribed: false };
  }

  if (!initialized) {
    await initRevenueCat();
  }

  const revenueCat = await getRevenueCatModule();
  if (!revenueCat || !initialized) {
    return { isPremium: false, expiresAt: null, willRenew: false, hasEverSubscribed: false };
  }

  const { Purchases } = revenueCat;
  const { customerInfo } = await Purchases.restorePurchases();
  return statusFromCustomerInfo(customerInfo);
}
