"use client";
import { buttonStyles } from "@/components/ui/styles";

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
    <div className="border-b border-pp-warning-border bg-pp-warning-soft px-4 py-3 ">
      <div className="mx-auto flex w-full max-w-2xl items-start gap-3">
        <div className="mt-0.5 rounded-full bg-pp-warning-soft p-2 text-pp-warning-text ">
          {needsInstall ? <Download className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-pp-warning-text ">
            {t("accessBannerTitle")}
          </p>
          <p className="mt-1 text-sm text-pp-warning-text ">
            {needsInstall && needsPush
              ? t("accessBannerDescAll")
              : needsInstall
                ? t("accessBannerDescInstall")
                : t("accessBannerDescPush")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {needsInstall && os === "android" ? (
              <button type="button"
                onClick={async () => {
                  if (deferredPrompt) {
                    await promptInstall();
                    return;
                  }

                  openGuide("install");
                }}
                className={buttonStyles({ variant: "warning", size: "compact", shape: "pill" })}
              >
                <span>{t("installPwa")}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            {needsInstall && os !== "android" ? (
              <button type="button"
                onClick={() => openGuide("install")}
                className={buttonStyles({ variant: "warning", size: "compact", shape: "pill" })}
              >
                <span>{t("installPwa")}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            {!needsInstall && needsPush ? (
              <button type="button"
                onClick={() => openGuide("notification")}
                className={buttonStyles({ variant: "warning", size: "compact", shape: "pill" })}
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
