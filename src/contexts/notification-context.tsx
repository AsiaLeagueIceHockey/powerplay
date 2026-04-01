"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSubscriptionStatusByEndpoint, saveSubscription } from "@/app/actions/push";
import {
  urlBase64ToUint8Array,
  serializePushSubscription,
} from "@/lib/push-subscription";

interface NotificationContextType {
  isOpen: boolean;
  guideType: "notification" | "install";
  openGuide: (type?: "notification" | "install") => void;
  closeGuide: () => void;
  shouldShowOnboarding: boolean;
  markOnboardingComplete: () => void;
  hasDbSubscription: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  deferredPrompt: any;
  promptInstall: () => Promise<boolean>;
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    return outcome === "accepted";
  };

  // Fetch DB subscription status (current device)
  const refreshSubscriptionStatus = async () => {
    try {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          // navigator.serviceWorker.ready는 iOS PWA에서 hang될 수 있으므로 사용하지 않음
          const reg = await navigator.serviceWorker.getRegistration("/");
          if (reg?.active) {
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              const result = await getSubscriptionStatusByEndpoint(sub.endpoint);
              setHasDbSubscription(result.exists);
              return;
            }
          }
        } catch { /* fall through */ }
      }
      setHasDbSubscription(false);
    } catch {
      setHasDbSubscription(false);
    }
  };

  useEffect(() => {
    // Auto-show onboarding for logged-in users without DB subscription
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

      if (typeof window === "undefined" || !("Notification" in window)) return;

      const permission = Notification.permission;

      // Case 1: Granted - Ensure Subscription Exists (Self-Healing)
      // 주의: 여기서 ensurePushSubscription을 호출하면 SW 등록과 충돌할 수 있으므로,
      // 이미 active인 SW가 있을 때만 가볍게 처리한다.
      if (permission === "granted") {
        try {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (vapidKey && "serviceWorker" in navigator && "PushManager" in window) {
            // navigator.serviceWorker.ready 대신 getRegistration 사용 (iOS hang 방지)
            const reg = await navigator.serviceWorker.getRegistration("/");

            if (reg?.active) {
              let subscription = await reg.pushManager.getSubscription();

              // 구독이 없으면 새로 생성
              if (!subscription) {
                subscription = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });
              }

              if (subscription) {
                const epStatus = await getSubscriptionStatusByEndpoint(subscription.endpoint);
                if (!epStatus.exists) {
                  const result = await saveSubscription(
                    serializePushSubscription(subscription)
                  );
                  if (result.success) {
                    setHasDbSubscription(true);
                  }
                } else {
                  setHasDbSubscription(true);
                }
              }
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
      refreshSubscriptionStatus,
      deferredPrompt,
      promptInstall
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
