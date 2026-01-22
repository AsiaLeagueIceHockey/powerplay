"use client";

import { useEffect, useState } from "react";
import { useNotification } from "@/contexts/notification-context";
import { saveSubscription } from "@/app/actions/push";
import { X, Bell, Share, PlusSquare, CheckCircle, Download, RefreshCw } from "lucide-react";

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

export function NotificationGuideModal() {
  const { isOpen, closeGuide, markOnboardingComplete, guideType, hasDbSubscription, refreshSubscriptionStatus } = useNotification();
  const [os, setOs] = useState<"ios" | "android" | "other">("other");
  const [isStandalone, setIsStandalone] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Detect OS
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setOs("ios");
    } else if (/android/i.test(userAgent)) {
      setOs("android");
    }

    // Detect Standalone (PWA)
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Initial Permission Check
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }

    // Refresh DB subscription status when modal opens
    if (isOpen) {
      refreshSubscriptionStatus();
    }
  }, [isOpen, refreshSubscriptionStatus]);

  const handleSubscribe = async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      alert("알림 설정 오류: VAPID 키가 없습니다.");
      return;
    }

    setLoading(true);
    try {
      // 1. Request Permission (or use existing)
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
        setPermissionState(permission);
      }

      if (permission === "granted") {
        // 2. Register Service Worker & Subscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          ),
        });

        // 3. Save to Server
        const result = await saveSubscription(JSON.parse(JSON.stringify(subscription)));
        if (result.success) {
          markOnboardingComplete(); // Success!
          alert("알림이 설정되었습니다! 🎉");
          closeGuide();
        } else {
          alert("알림 설정 실패: " + result.error);
        }
      } else {
        alert("알림 권한이 차단되었습니다. 브라우저 설정에서 권한을 허용해주세요.");
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
    setLoading(false);
  };

  const handleClose = () => {
    markOnboardingComplete();
    closeGuide();
  };

  if (!isOpen) return null;

  // Determine if truly complete: permission granted AND DB subscription exists
  const isFullySubscribed = permissionState === "granted" && hasDbSubscription;
  // Permission granted but no DB subscription - needs re-registration
  const needsReRegistration = permissionState === "granted" && !hasDbSubscription;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {guideType === "install" ? (
                <>
                    <Download className="w-5 h-5 text-blue-500" />
                    앱 설치 방법
                </>
            ) : (
                <>
                    <Bell className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                    알림 설정 가이드
                </>
            )}
          </h2>
          <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Fully Subscribed - permission granted AND DB subscription exists */}
          {isFullySubscribed ? (
             <div className="flex flex-col items-center text-center py-6 mx-auto">
               <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold mb-2">이미 설정이 완료되었습니다!</h3>
               <p className="text-zinc-500 dark:text-zinc-400">
                 중요한 알림을 놓치지 않고 받아보실 수 있습니다.
               </p>
               <button onClick={handleClose} className="mt-6 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg font-medium">
                 확인
               </button>
             </div>
          ) : needsReRegistration ? (
            /* Permission granted but no DB subscription - re-registration needed */
            <div className="text-center py-4">
              <div className="mb-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">알림 재등록 필요</h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                  알림 권한은 허용되어 있지만<br/>기기 등록이 필요합니다.
                </p>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                {loading ? "설정 중..." : "기기 등록하기"}
                {!loading && <Bell className="w-5 h-5 fill-white/20" />}
              </button>
            </div>
          ) : (
            <>
              {/* Manual Install Instructions (iOS or explicitly requested) */}
              {(guideType === "install" || (os === "ios" && !isStandalone)) && (
                <div className="space-y-6">
                  {guideType === "install" ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                          앱을 설치하면 더 편리합니다!
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          아래 순서대로 <strong>홈 화면에 추가</strong>해주세요.
                        </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/50">
                        <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        ⚠️ 아이폰 알림 필수 조건
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                        아이폰에서는 <strong>홈 화면에 추가</strong>해야만 알림을 받을 수 있습니다.
                        </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                      <div>
                        <p className="font-medium mb-1">브라우저 하단 공유 버튼 클릭</p>
                        <Share className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                      <div>
                        <p className="font-medium mb-1">'홈 화면에 추가' 선택</p>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                           <PlusSquare className="w-4 h-4" />
                           <span>홈 화면에 추가</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                      <div>
                        <p className="font-medium mb-1">홈 화면의 아이콘으로 앱 실행</p>
                        <p className="text-sm text-zinc-500">새로 설치된 앱에서 다시 알림 설정을 눌러주세요.</p>
                      </div>
                    </div>
                  </div>
                  
                  {guideType === "install" && (
                    <button onClick={handleClose} className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl font-medium transition mt-4">
                        닫기
                    </button>
                  )}
                </div>
              )}

              {/* Push Permission Request (Only shown if NOT install mode AND (Not iOS OR Already Standalone)) */}
              {guideType !== 'install' && (os !== "ios" || isStandalone) && (
                <div className="text-center py-4">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">중요 알림 켜기</h3>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      경기 일정, 포인트 충전, 취소 등<br/>중요한 소식을 푸시 알림으로 받아보세요.
                    </p>
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                  >
                    {loading ? "설정 중..." : "알림 받기"}
                    {!loading && <Bell className="w-5 h-5 fill-white/20" />}
                  </button>
                  
                  {permissionState === "denied" && (
                     <p className="text-xs text-red-500 mt-3">
                       ※ 알림이 차단되어 있습니다. 브라우저 설정에서 초기화해주세요.
                     </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
