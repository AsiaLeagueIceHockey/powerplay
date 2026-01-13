"use client";

import { useEffect, useState } from "react";
import { saveSubscription } from "@/app/actions/push";

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          if (subscription) {
            setIsSubscribed(true);
          }
        });
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
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });

      // Save to server
      const result = await saveSubscription(JSON.parse(JSON.stringify(subscription)));
      if (result.success) {
        setIsSubscribed(true);
        alert("알림이 설정되었습니다.");
      } else {
        alert("알림 설정 실패: " + result.error);
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("알림 권한을 허용해주세요.");
    }
    setLoading(false);
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
