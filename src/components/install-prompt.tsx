"use client";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/styles";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNotification } from "@/contexts/notification-context";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const copy = useTranslations("installUi");
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { openGuide, isOpen } = useNotification();

  useEffect(() => {
    // Check if mobile device
    const userAgent = window.navigator.userAgent || window.navigator.vendor;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

    // Don't show on desktop
    if (!isMobile) {
      return;
    }

    // Android / Desktop PWA Prompt
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as InstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS and In-App Browser Detection
    const ua = userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
                        window.matchMedia("(display-mode: standalone)").matches;

    // Detect In-App Browsers (KakaoTalk, Instagram, Facebook, Line, etc.)
    const isInApp = /kakaotalk|instagram|fban|fbav|line/i.test(ua);

    // Show prompt if:
    // 1. iOS and NOT standalone
    // 2. Any Mobile In-App Browser and NOT standalone (since beforeinstallprompt often fails there)
    const timer = window.setTimeout(() => { if (!isStandalone && (isIosDevice || isInApp)) {
        if (isIosDevice) setIsIOS(true);
        setIsVisible(true);
    } }, 0);

    const handleInstalled = () => {
      // Log app installed to analytics if needed
      setDeferredPrompt(null);
      setIsVisible(false);
    };
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    // If iOS or if Android in-app (no deferredPrompt), show the guide
    if (isIOS || !deferredPrompt) {
        // Show the guide modal in INSTALL mode
        openGuide("install");
        return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Optionally log outcome
    // console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (pathname.includes("/lounge-membership")) return null;
  if (!isVisible || isOpen) return null;

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className="pp-ui fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative bg-zinc-900 dark:bg-pp-surface text-white p-5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-pp-border ">

        {/* Close Button - Top Right */}
        <button type="button"
            aria-label="닫기 / Close"
            onClick={handleDismiss}
            className={buttonStyles({ variant: "outline", size: "compact" }) + " absolute -top-2 -right-2"}
        >
            <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-pp-border flex-shrink-0">
             <Image
               src="/favicon.png"
               alt="PowerPlay"
               fill
               className="object-cover"
             />
          </div>
          <div>
            <p className="font-bold text-base">{copy("title")}</p>
            <p className="text-xs text-pp-muted">
                {isIOS ? copy("iosHelp") : copy("help")}
            </p>
          </div>
        </div>

        <button type="button"
            onClick={handleInstallClick}
            className={buttonStyles({ variant: "primary", size: "compact" }) + " active:scale-95"}
          >
            {copy("install")}</button>
      </div>
    </div>
  );
}
