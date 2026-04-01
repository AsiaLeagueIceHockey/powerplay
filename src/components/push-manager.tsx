"use client";

import { useEffect, useState } from "react";
import { saveSubscription } from "@/app/actions/push";
import {
  ensurePushSubscription,
  serializePushSubscription,
} from "@/lib/push-subscription";

export function PushServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}

export function PushPermissionButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // navigator.serviceWorker.ready는 iOS PWA에서 hang될 수 있으므로 getRegistration 사용
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.getRegistration("/").then((registration) => {
        if (registration?.active) {
          registration.pushManager.getSubscription().then((subscription) => {
            if (subscription) {
              setIsSubscribed(true);
            }
          });
        }
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.error("VAPID Public Key needed");
      alert("알림 설정 오류: VAPID 키가 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const subscription = await ensurePushSubscription(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      );

      // Save to server
      const result = await saveSubscription(
        serializePushSubscription(subscription)
      );
      if (result.success) {
        setIsSubscribed(true);
        alert("알림이 설정되었습니다.");
      } else {
        alert(`알림 설정 실패: ${result.error}\n(잠시 후 다시 시도하거나, 브라우저의 알림 권한을 확인해주세요)`);
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      alert(
        error instanceof Error
          ? `알림 설정 실패: ${error.message}`
          : "알림 권한을 허용해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <button className={`${className} opacity-50 cursor-default`} disabled>
        {children || "알림 설정됨"}
      </button>
    );
  }

  return (
    <button onClick={handleSubscribe} disabled={loading} className={className}>
      {loading ? "..." : children || "알림 받기"}
    </button>
  );
}
