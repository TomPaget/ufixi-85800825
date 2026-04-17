import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Browser } from "@capacitor/browser";
import { toast } from "sonner";
import { getInAppPath } from "@/lib/appNavigation";

interface SubscriptionState {
  isPremium: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  user: User | null;
  authReady: boolean;
  checkSubscription: () => Promise<void>;
  startCheckout: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  isPremium: false,
  subscriptionEnd: null,
  loading: true,
  user: null,
  authReady: false,
  checkSubscription: async () => {},
  startCheckout: async () => {},
  signOut: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsPremium(false);
        setSubscriptionEnd(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      const nowPremium = data?.subscribed === true;
      setIsPremium(nowPremium);
      setSubscriptionEnd(data?.subscription_end || null);

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please create an account first to subscribe");
      window.location.assign(getInAppPath("/auth?redirect=upgrade"));
      return;
    }

    try {
      toast.loading("Preparing checkout…", { id: "checkout" });
      const { data, error } = await supabase.functions.invoke("create-checkout");
      toast.dismiss("checkout");
      if (error) {
        console.error("create-checkout error:", error);
        throw error;
      }
      if (data?.error) {
        console.error("create-checkout returned error:", data.error);
        throw new Error(data.error);
      }
      if (data?.url) {
        const native = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
        if (native) {
          await Browser.open({ url: data.url });
        } else {
          const opened = window.open(data.url, "_blank", "noopener,noreferrer");
          if (!opened) {
            window.location.href = data.url;
          }
        }
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.dismiss("checkout");
      toast.error(err?.message || "Could not start checkout. Please try again.");
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
    setSubscriptionEnd(null);
  }, []);

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
    <SubscriptionContext.Provider value={{ isPremium, subscriptionEnd, loading, user, authReady, checkSubscription, startCheckout, signOut }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
