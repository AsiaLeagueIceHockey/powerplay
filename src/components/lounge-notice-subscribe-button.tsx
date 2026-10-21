"use client";
import { buttonStyles } from "@/components/ui/styles";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  subscribeToLoungeNotices,
  unsubscribeFromLoungeNotices,
} from "@/app/actions/lounge-notices";
import { useNotification } from "@/contexts/notification-context";

interface LoungeNoticeSubscribeButtonProps {
  businessId: string;
  businessSlug: string;
  isLoggedIn: boolean;
  initialSubscribed: boolean;
}

export function LoungeNoticeSubscribeButton({
  businessId,
  businessSlug,
  isLoggedIn,
  initialSubscribed,
}: LoungeNoticeSubscribeButtonProps) {
  const locale = useLocale();
  const t = useTranslations("loungeNotices.subscription");
  const router = useRouter();
  const { hasDbSubscription, openGuide, refreshSubscriptionStatus } = useNotification();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [deviceStatusReady, setDeviceStatusReady] = useState(!isLoggedIn);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const promptAfterSubscribeRef = useRef(false);

  const loginPath = `/${locale}/login?next=${encodeURIComponent(
    `/${locale}/lounge/${businessSlug}`
  )}`;

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;
    void refreshSubscriptionStatus().finally(() => {
      if (!cancelled) setDeviceStatusReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, refreshSubscriptionStatus]);

  useEffect(() => {
    if (!promptAfterSubscribeRef.current || !deviceStatusReady) return;

    promptAfterSubscribeRef.current = false;
    if (!hasDbSubscription) openGuide("notification");
  }, [deviceStatusReady, hasDbSubscription, openGuide]);

  const handleToggle = () => {
    if (!isLoggedIn) {
      router.push(loginPath);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = subscribed
        ? await unsubscribeFromLoungeNotices(businessId)
        : await subscribeToLoungeNotices(businessId);

      if (!result.success) {
        setError(result.error || t("error"));
        return;
      }

      const nextSubscribed = !subscribed;
      setSubscribed(nextSubscribed);
      router.refresh();

      if (nextSubscribed) {
        promptAfterSubscribeRef.current = true;
        if (deviceStatusReady) {
          promptAfterSubscribeRef.current = false;
          if (!hasDbSubscription) openGuide("notification");
        }
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={isLoggedIn ? subscribed : undefined}
          className={buttonStyles({ variant: subscribed ? "warning" : "outline" })}
        >
          {subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {isPending
            ? t("processing")
            : !isLoggedIn
              ? t("login")
              : subscribed
                ? t("unsubscribe")
                : t("subscribe")}
        </button>

        {isLoggedIn && subscribed && deviceStatusReady && !hasDbSubscription ? (
          <button
            type="button"
            onClick={() => openGuide("notification")}
            className={buttonStyles({ variant: "secondary", size: "compact" }) + " inline-flex items-center justify-center gap-2"}
          >
            <Smartphone className="h-4 w-4" />
            {t("deviceGuide")}
          </button>
        ) : null}
      </div>

      {isLoggedIn && subscribed && deviceStatusReady ? (
        <p className="text-xs leading-5 text-pp-muted ">
          {hasDbSubscription ? t("activeDescription") : t("deviceDescription")}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-pp-danger-text ">
          {error}
        </p>
      ) : null}
    </div>
  );
}
