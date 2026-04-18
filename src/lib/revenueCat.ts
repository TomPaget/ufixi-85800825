// RevenueCat helper — used on native iOS/Android only.
// Web continues to use Stripe via existing edge functions.
import { Purchases, LOG_LEVEL, type CustomerInfo, type PurchasesOffering } from "@revenuecat/purchases-capacitor";

// PUBLISHABLE keys — safe to ship in the client.
// (RevenueCat publishable keys are not secrets; they identify the app to RC.)
const REVENUECAT_IOS_KEY = "appl_WaXjCvKSQUwZNmQfPqwqxyBtVLG";
const REVENUECAT_ANDROID_KEY = "goog_PASTE_ANDROID_KEY_HERE";

export const PREMIUM_ENTITLEMENT_ID = "premium";
export const PREMIUM_PRODUCT_ID = "premium_subscription";

let initialized = false;

function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  return window.Capacitor?.getPlatform?.() ?? "web";
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
    console.warn("[RevenueCat] API key not configured for", platform);
    return;
  }
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey, appUserID: appUserId ?? undefined });
    initialized = true;
    console.log("[RevenueCat] Initialised", { platform, appUserId });
  } catch (err) {
    // Never let RC init crash the app on launch — log and continue.
    console.error("[RevenueCat] Init failed (non-fatal):", err);
  }
}

export async function setRevenueCatUser(userId: string | null): Promise<void> {
  if (!isRevenueCatPlatform() || !initialized) return;
  try {
    if (userId) {
      await Purchases.logIn({ appUserID: userId });
    } else {
      await Purchases.logOut();
    }
  } catch (err) {
    console.warn("[RevenueCat] setUser failed:", err);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatPlatform() || !initialized) return null;
  try {
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
  try {
    const { current } = await Purchases.getOfferings();
    return current ?? null;
  } catch (err) {
    console.warn("[RevenueCat] getOfferings failed:", err);
    return null;
  }
}

export async function purchasePremium(): Promise<RcStatus> {
  if (!isRevenueCatPlatform() || !initialized) {
    throw new Error("RevenueCat not available on this platform");
  }
  const offering = await getCurrentOffering();
  const pkg = offering?.availablePackages?.find(
    (p) => p.product?.identifier === PREMIUM_PRODUCT_ID,
  ) ?? offering?.monthly ?? offering?.availablePackages?.[0];
  if (!pkg) throw new Error("No subscription package available");
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return statusFromCustomerInfo(customerInfo);
}

export async function restorePurchases(): Promise<RcStatus> {
  if (!isRevenueCatPlatform() || !initialized) {
    return { isPremium: false, expiresAt: null, willRenew: false, hasEverSubscribed: false };
  }
  const { customerInfo } = await Purchases.restorePurchases();
  return statusFromCustomerInfo(customerInfo);
}
