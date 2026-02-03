"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSubscriptionStatus, saveSubscription } from "@/app/actions/push";

interface NotificationContextType {
  isOpen: boolean;
  guideType: "notification" | "install";
  openGuide: (type?: "notification" | "install") => void;
  closeGuide: () => void;
  shouldShowOnboarding: boolean;
  markOnboardingComplete: () => void;
  hasDbSubscription: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [guideType, setGuideType] = useState<"notification" | "install">("notification");
  const [hasDbSubscription, setHasDbSubscription] = useState(false);
  const pathname = usePathname();

  const openGuide = (type: "notification" | "install" = "notification") => {
    setGuideType(type);
    setIsOpen(true);
  };
  const closeGuide = () => setIsOpen(false);

  // Onboarding Logic
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  // Fetch DB subscription status
  const refreshSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setHasDbSubscription(status.count > 0);
    } catch {
      setHasDbSubscription(false);
    }
  };

  useEffect(() => {
    // Auto-show onboarding for logged-in users without DB subscription
    // Helper for VAPID key conversion
    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    const checkAndShowOnboarding = async () => {
      // Skip if not on main page
      if (pathname !== "/ko" && pathname !== "/en" && pathname !== "/") {
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const status = await getSubscriptionStatus();
      setHasDbSubscription(status.count > 0);

      if (typeof window === "undefined" || !("Notification" in window)) return;

      const permission = Notification.permission;

      // Case 1: Granted - Ensure Subscription Exists (Self-Healing)
      if (permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.ready;
          let subscription = await registration.pushManager.getSubscription();

          // 1-1. Silent Repair: If permission granted but no subscription, create one.
          if (!subscription) {
            console.log(
              "[Notification] Permission granted but no subscription. Attempting silent repair..."
            );
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (vapidKey) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
              });
            }
          }

          // 1-2. Sync to DB if we have a valid subscription
          if (subscription) {
            const result = await saveSubscription(
              JSON.parse(JSON.stringify(subscription))
            );
            if (result.success) {
              setHasDbSubscription(true);
            }
          }
        } catch (err) {
          console.error("[Notification] Sync/Repair failed:", err);
        }
        // If granted, we are done. No need to show modal.
        return;
      }

      // Case 2: Denied - Stop
      if (permission === "denied") return;

      // Case 3: Default (Device B case) - Show Modal
      const userAgent = navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent);
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;

      if (isIos && !isStandalone) {
        return;
      }

      setTimeout(() => {
        setShouldShowOnboarding(true);
        setIsOpen(true);
      }, 2000);
    };

    checkAndShowOnboarding();
  }, [pathname]);

  const markOnboardingComplete = () => {
    setShouldShowOnboarding(false);
    refreshSubscriptionStatus(); // Refresh status after completing
  };

  return (
    <NotificationContext.Provider value={{
      isOpen,
      guideType,
      openGuide,
      closeGuide,
      shouldShowOnboarding,
      markOnboardingComplete,
      hasDbSubscription,
      refreshSubscriptionStatus
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
