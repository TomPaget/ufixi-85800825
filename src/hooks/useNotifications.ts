import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  priority: string;
  action_url: string | null;
  created_at: string;
}

// Default promo notification shown to all users
const PROMO_NOTIFICATION: Omit<AppNotification, "user_id"> = {
  id: "promo-50-off",
  title: "Premium Offer",
  message: "Get over 50% off your first Premium month — just £0.99! Save scans, skip ads, and export reports.",
  type: "promo",
  read: false,
  priority: "normal",
  action_url: "/upgrade",
  created_at: new Date().toISOString(),
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isPremium } = useSubscription();

  const loadNotifications = useCallback(async () => {
    if (!user) {
      // Not logged in — show only promo
      setNotifications([{ ...PROMO_NOTIFICATION, user_id: "anon" } as AppNotification]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const dbNotifications = (data || []) as AppNotification[];

      // Always prepend the promo notification for non-premium users
      if (!isPremium) {
        setNotifications([{ ...PROMO_NOTIFICATION, user_id: user.id } as AppNotification, ...dbNotifications]);
      } else {
        setNotifications(dbNotifications);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setNotifications([{ ...PROMO_NOTIFICATION, user_id: user?.id || "anon" } as AppNotification]);
    } finally {
      setLoading(false);
    }
  }, [user, isPremium]);

  // Real-time subscription
  useEffect(() => {
    loadNotifications();

    if (!user) return;

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications((prev) => [newNotif, ...prev]);

          // Browser push notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(newNotif.title, { body: newNotif.message, icon: "/favicon.ico" });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  const markAsRead = useCallback(async (notifId: string) => {
    if (notifId === "promo-50-off") return; // Skip promo
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true } as any).eq("id", notifId);
  }, []);

  const requestPushPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markAsRead, requestPushPermission, refresh: loadNotifications };
}
