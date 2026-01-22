"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSubscriptionStatus } from "@/app/actions/push";

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
    const checkAndShowOnboarding = async () => {
      // Skip if not on main page
      if (pathname !== "/ko" && pathname !== "/en" && pathname !== "/") {
        return;
      }

      // Check if user is logged in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Check DB subscription status
      const status = await getSubscriptionStatus();
      setHasDbSubscription(status.count > 0);

      // Show onboarding if:
      // 1. No DB subscription exists (regardless of browser permission)
      // 2. Not iOS non-standalone (they need to add to home screen first)
      if (status.count === 0) {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                            (navigator as any).standalone === true;
        
        // If iOS and not standalone, don't auto-show (they need PWA first)
        if (isIos && !isStandalone) {
          return;
        }

        // Wait a bit before showing
        setTimeout(() => {
          setShouldShowOnboarding(true);
          setIsOpen(true);
        }, 2000);
      }
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
