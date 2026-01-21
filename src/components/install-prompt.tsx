"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useNotification } from "@/contexts/notification-context";
import Image from "next/image";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { openGuide } = useNotification();

  useEffect(() => {
    // Android / Desktop PWA Prompt
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone;
    
    // Show prompt if iOS and NOT standalone (in browser)
    if (isIosDevice && !isStandalone) {
        setIsIOS(true);
        // Delay slightly to not annoy immediately? Or show immediately? 
        // User asked for "banner like android".
        // Check if previously dismissed?
        const dismissed = localStorage.getItem("install_prompt_dismissed");
        if (!dismissed) {
             setIsVisible(true);
        }
    }

    window.addEventListener("appinstalled", () => {
      // Log app installed to analytics if needed
      setDeferredPrompt(null);
      setIsVisible(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
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

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    if (isIOS) {
        localStorage.setItem("install_prompt_dismissed", "true");
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative bg-zinc-900 dark:bg-zinc-800 text-white p-5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-zinc-800 dark:border-zinc-700">
        
        {/* Close Button - Top Right */}
        <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-700 shadow-md transition"
        >
            <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700">
             <Image 
               src="/favicon.png" 
               alt="Power Play" 
               fill
               className="object-cover"
             />
          </div>
          <div>
            <p className="font-bold text-base">Power Play 앱 설치</p>
            <p className="text-xs text-zinc-400">
                {isIOS ? "홈 화면에 추가하여 앱처럼 사용하세요" : "더 빠르고 편리하게 이용하세요"}
            </p>
          </div>
        </div>
        
        <button
            onClick={handleInstallClick}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl text-sm font-bold transition whitespace-nowrap shadow-lg shadow-blue-900/20"
          >
            설치하기
        </button>
      </div>
    </div>
  );
}
