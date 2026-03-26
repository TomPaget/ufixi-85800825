import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Manages native push notification registration via Capacitor.
 * On native platforms, registers for push, stores the FCM/APNs token,
 * and handles incoming notifications (foreground + tap actions).
 */
export function usePushNotifications(onNotificationTap?: (actionUrl: string) => void) {
  const { user } = useSubscription();
  const registeredRef = useRef(false);

  const isNative =
    typeof window !== "undefined" &&
    window.Capacitor !== undefined &&
    window.Capacitor.isNativePlatform();

  const registerPush = useCallback(async () => {
    if (!isNative || !user || registeredRef.current) return;

    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");

      // Check / request permission
      let permResult = await PushNotifications.checkPermissions();
      if (permResult.receive === "prompt" || permResult.receive === "prompt-with-rationale") {
        permResult = await PushNotifications.requestPermissions();
      }

      if (permResult.receive !== "granted") {
        console.warn("Push notification permission not granted");
        return;
      }

      // Listen for registration success
      PushNotifications.addListener("registration", async (token) => {
        console.log("Push token:", token.value);
        const platform = window.Capacitor?.getPlatform() === "ios" ? "ios" : "android";

        // Upsert token to database
        const { error } = await supabase.from("push_tokens").upsert(
          {
            user_id: user.id,
            token: token.value,
            platform,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "user_id,token" }
        );
        if (error) console.error("Failed to save push token:", error);
      });

      // Listen for registration errors
      PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration error:", err);
      });

      // Handle foreground notifications
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("Push notification received in foreground:", notification);
        // The in-app real-time subscription handles UI updates,
        // so we just log here. Could show a toast if desired.
      });

      // Handle notification tap (app opened from notification)
      PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        const data = action.notification.data;
        if (data?.action_url && onNotificationTap) {
          onNotificationTap(data.action_url);
        }
      });

      // Register with FCM/APNs
      await PushNotifications.register();
      registeredRef.current = true;
    } catch (err) {
      console.error("Push notification setup error:", err);
    }
  }, [isNative, user, onNotificationTap]);

  useEffect(() => {
    registerPush();
  }, [registerPush]);

  return { isNative };
}
