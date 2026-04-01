"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, BellOff, Download } from "lucide-react";
import { useNotification } from "@/contexts/notification-context";

type OsType = "ios" | "android" | "other";

export function ChatAccessBanner() {
  const t = useTranslations("chat");
  const {
    hasDbSubscription,
    openGuide,
    deferredPrompt,
    promptInstall,
    refreshSubscriptionStatus,
  } = useNotification();
  const [isMounted, setIsMounted] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [os, setOs] = useState<OsType>("other");

  useEffect(() => {
    let isActive = true;

    const syncState = async () => {
      const isPwa =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const ua = window.navigator.userAgent.toLowerCase();

      if (!isActive) return;

      setIsStandalone(isPwa);
      if (/iphone|ipad|ipod/.test(ua)) {
        setOs("ios");
      } else if (/android/.test(ua)) {
        setOs("android");
      } else {
        setOs("other");
      }

      await refreshSubscriptionStatus();

      if (isActive) {
        setIsMounted(true);
      }
    };

    syncState();

    return () => {
      isActive = false;
    };
  }, [refreshSubscriptionStatus]);

  if (!isMounted) {
    return null;
  }

  if (isStandalone && hasDbSubscription) {
    return null;
  }

  const needsInstall = !isStandalone;
  const needsPush = !hasDbSubscription;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/40">
      <div className="mx-auto flex w-full max-w-2xl items-start gap-3">
        <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          {needsInstall ? <Download className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {t("accessBannerTitle")}
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            {needsInstall && needsPush
              ? t("accessBannerDescAll")
              : needsInstall
                ? t("accessBannerDescInstall")
                : t("accessBannerDescPush")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {needsInstall && os === "android" ? (
              <button
                onClick={async () => {
                  if (deferredPrompt) {
                    await promptInstall();
                    return;
                  }

                  openGuide("install");
                }}
                className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                <span>{t("installPwa")}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            {needsInstall && os !== "android" ? (
              <button
                onClick={() => openGuide("install")}
                className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                <span>{t("installPwa")}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            {!needsInstall && needsPush ? (
              <button
                onClick={() => openGuide("notification")}
                className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                <span>{t("enablePush")}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
