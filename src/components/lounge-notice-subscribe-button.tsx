"use client";

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
          className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60 ${
            subscribed
              ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-zinc-300 bg-white text-zinc-800 hover:border-amber-400 hover:bg-amber-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-amber-700 dark:hover:bg-amber-950/30"
          }`}
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
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Smartphone className="h-4 w-4" />
            {t("deviceGuide")}
          </button>
        ) : null}
      </div>

      {isLoggedIn && subscribed && deviceStatusReady ? (
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {hasDbSubscription ? t("activeDescription") : t("deviceDescription")}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
