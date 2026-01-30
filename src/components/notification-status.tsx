"use client";

import { useEffect, useState } from "react";
import { getSubscriptionStatus } from "@/app/actions/push";
import { useNotification } from "@/contexts/notification-context";
import { Bell, BellOff, Smartphone, BookOpen } from "lucide-react";

export function NotificationStatus() {
  const [status, setStatus] = useState<{
    count: number;
    lastSubscribed?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { openGuide } = useNotification();

  useEffect(() => {
    async function fetchStatus() {
      try {
        const result = await getSubscriptionStatus();
        setStatus(result);
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      }
      setLoading(false);
    }
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
      </div>
    );
  }

  const hasSubscription = status && status.count > 0;

  return (
    <div className={`rounded-xl p-4 border ${
      hasSubscription 
        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
    }`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          hasSubscription 
            ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" 
            : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
        }`}>
          {hasSubscription ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${
            hasSubscription 
              ? "text-green-800 dark:text-green-200" 
              : "text-amber-800 dark:text-amber-200"
          }`}>
            {hasSubscription ? "알림 설정됨" : "알림 미설정"}
          </h3>
          
          {hasSubscription ? (
            <div className="mt-1 space-y-1">
              <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                등록된 기기: {status.count}개
              </p>
              {status.lastSubscribed && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  마지막 등록: {new Date(status.lastSubscribed).toLocaleDateString("ko-KR")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              알림을 받으려면 기기를 등록해주세요.
            </p>
          )}
        </div>
      </div>

      {/* Button on new line to prevent truncation */}
      <button
        onClick={() => openGuide("notification")}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
          hasSubscription
            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60"
            : "bg-amber-500 text-white hover:bg-amber-600"
        }`}
      >
        {hasSubscription ? (
          <>
            <BookOpen className="w-4 h-4" />
            알림 설정 가이드
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            알림 받기
          </>
        )}
      </button>
    </div>
  );
}
