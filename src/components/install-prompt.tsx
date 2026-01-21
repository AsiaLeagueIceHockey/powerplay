"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

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

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-900 dark:bg-zinc-800 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-zinc-800 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">앱으로 더 편하게 이용하세요</p>
            <p className="text-xs text-zinc-400">홈 화면에 추가하여 앱처럼 사용하기</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition whitespace-nowrap"
          >
            설치하기
          </button>
        </div>
      </div>
    </div>
  );
}
