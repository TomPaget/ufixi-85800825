import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Browser } from "@capacitor/browser";
import { toast } from "sonner";
import { getInAppPath } from "@/lib/appNavigation";
import CheckoutRedirectModal from "@/components/CheckoutRedirectModal";

interface SubscriptionState {
  isPremium: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasEverSubscribed: boolean;
  loading: boolean;
  user: User | null;
  authReady: boolean;
  checkSubscription: () => Promise<void>;
  startCheckout: () => Promise<void>;
  renewSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  isPremium: false,
  subscriptionEnd: null,
  cancelAtPeriodEnd: false,
  hasEverSubscribed: false,
  loading: true,
  user: null,
  authReady: false,
  checkSubscription: async () => {},
  startCheckout: async () => {},
  renewSubscription: async () => {},
  signOut: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);
  const [checkoutRedirectUrl, setCheckoutRedirectUrl] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsPremium(false);
        setSubscriptionEnd(null);
        setCancelAtPeriodEnd(false);
        setHasEverSubscribed(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      const nowPremium = data?.subscribed === true;
      setIsPremium(nowPremium);
      setSubscriptionEnd(data?.subscription_end || null);
      setCancelAtPeriodEnd(!!data?.cancel_at_period_end);
      setHasEverSubscribed(!!data?.has_ever_subscribed);

      if (nowPremium && !welcomeEmailSent) {
        setWelcomeEmailSent(true);
        const fullName = session.user.user_metadata?.full_name;
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "welcome-to-premium",
            recipientEmail: session.user.email,
            idempotencyKey: `welcome-premium-${session.user.id}`,
            templateData: { name: fullName || undefined },
          },
        }).catch((err) => console.warn("Welcome email failed:", err));
      }
    } catch (err) {
      console.error("Subscription check failed:", err);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  }, [welcomeEmailSent]);

  const startCheckout = useCallback(async () => {
    const native = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
    const inIframe = typeof window !== "undefined" && window.self !== window.top;

    // Try to open a placeholder tab synchronously so popup blockers allow it.
    // Skip in iframes (preview) and native apps where this pattern doesn't apply.
    let checkoutWindow: Window | null = null;
    if (!native && !inIframe) {
      try {
        checkoutWindow = window.open("about:blank", "_blank");
      } catch {
        checkoutWindow = null;
      }
    }

    const navigateTo = (url: string) => {
      if (native) {
        Browser.open({ url }).catch(() => { window.location.href = url; });
        return;
      }
      if (checkoutWindow && !checkoutWindow.closed) {
        try {
          checkoutWindow.location.href = url;
          return;
        } catch { /* fall through */ }
      }
      let opened: Window | null = null;
      try {
        opened = window.open(url, "_blank", "noopener,noreferrer");
      } catch { opened = null; }
      if (opened) return;

      if (inIframe) {
        try {
          if (window.top) {
            window.top.location.href = url;
            return;
          }
        } catch { /* cross-origin blocked */ }
        // Last resort in iframe: clickable toast with the checkout link
        toast.message("Tap to continue to secure checkout", {
          duration: 20000,
          action: {
            label: "Open Checkout",
            onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
          },
        });
        return;
      }
      window.location.href = url;
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        checkoutWindow?.close();
        toast.error("Please create an account first to subscribe");
        window.location.assign(getInAppPath("/auth?redirect=upgrade"));
        return;
      }

      toast.loading("Preparing checkout…", { id: "checkout" });
      const { data, error } = await supabase.functions.invoke("create-checkout");
      toast.dismiss("checkout");

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("No checkout URL returned");

      navigateTo(data.url);
    } catch (err: any) {
      console.error("Checkout error:", err);
      checkoutWindow?.close();
      toast.dismiss("checkout");
      toast.error(err?.message || "Could not start checkout. Please try again.");
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
    setSubscriptionEnd(null);
    setCancelAtPeriodEnd(false);
    setHasEverSubscribed(false);
  }, []);

  const renewSubscription = useCallback(async () => {
    try {
      toast.loading("Renewing subscription…", { id: "renew" });
      const { data, error } = await supabase.functions.invoke("renew-subscription");
      toast.dismiss("renew");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.success === false) {
        toast.info(data?.error || "Could not renew. Starting fresh checkout.");
        return;
      }
      toast.success("Subscription renewed!");
      await checkSubscription();
    } catch (err: any) {
      toast.dismiss("renew");
      toast.error(err?.message || "Could not renew subscription");
    }
  }, [checkSubscription]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
      if (session?.user) {
        checkSubscription();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSubscription();
      } else {
        setIsPremium(false);
        setSubscriptionEnd(null);
        setLoading(false);
      }
    });

    const interval = setInterval(checkSubscription, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ isPremium, subscriptionEnd, cancelAtPeriodEnd, hasEverSubscribed, loading, user, authReady, checkSubscription, startCheckout, renewSubscription, signOut }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
