"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NotificationContextType {
  isOpen: boolean;
  guideType: "notification" | "install";
  openGuide: (type?: "notification" | "install") => void;
  closeGuide: () => void;
  shouldShowOnboarding: boolean;
  markOnboardingComplete: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [guideType, setGuideType] = useState<"notification" | "install">("notification");
  const pathname = usePathname();

  const openGuide = (type: "notification" | "install" = "notification") => {
    setGuideType(type);
    setIsOpen(true);
  };
  const closeGuide = () => setIsOpen(false);

  // Onboarding Logic
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen the guide
    const hasSeenGuide = localStorage.getItem("notification_guide_seen");
    
    // Check if user is already subscribed (if so, no need for onboarding popup, but manual access still ok)
    // verification logic inside component will handle "already subscribed" UI
    
    // Auto-show only on first visit (main page) if not seen
    if (!hasSeenGuide && (pathname === "/ko" || pathname === "/en" || pathname === "/")) {
       // Wait a bit before showing to not overwhelm
       const timer = setTimeout(async () => {
         // Check if user is logged in
         const supabase = createClient();
         const { data: { user } } = await supabase.auth.getUser();

         // Only show if logged in AND permission is default
         if (user && Notification.permission === "default") {
             setShouldShowOnboarding(true);
             setIsOpen(true); 
         }
       }, 2000);
       return () => clearTimeout(timer);
    }
  }, [pathname]);

  const markOnboardingComplete = () => {
    localStorage.setItem("notification_guide_seen", "true");
    setShouldShowOnboarding(false);
  };

  return (
    <NotificationContext.Provider value={{ isOpen, guideType, openGuide, closeGuide, shouldShowOnboarding, markOnboardingComplete }}>
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
