"use client";
import { useTranslations } from "next-intl";
import { buttonStyles, overlayStyles } from "@/components/ui/styles";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useNotification } from "@/contexts/notification-context";
import { saveSubscription } from "@/app/actions/push";
import {
  ensurePushSubscription,
  serializePushSubscription,
} from "@/lib/push-subscription";
import { captureClientOperationalError } from "@/lib/monitoring/client";
import { X, Bell, Share, PlusSquare, CheckCircle, Download, RefreshCw, Compass } from "lucide-react";

export function NotificationGuideModal() {
  const copy = useTranslations("notificationGuide");
  const pathname = usePathname();
  const { isOpen, closeGuide, markOnboardingComplete, guideType, hasDbSubscription, refreshSubscriptionStatus } = useNotification();
  const [os, setOs] = useState<"ios" | "android" | "other">("other");
  const [isStandalone, setIsStandalone] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Detect OS
    const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || "";
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as Window & { MSStream?: unknown }).MSStream) {
      setOs("ios");
    } else if (/android/i.test(userAgent)) {
      setOs("android");
    }

    // Detect Standalone (PWA)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
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
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      alert(copy("missingConfig"));
      return;
    }

    if (!("Notification" in window)) {
      alert(copy("unsupported"));
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
        const subscription = await ensurePushSubscription(vapidPublicKey, 20000);

        // 3. Save to Server
        const result = await saveSubscription(
          serializePushSubscription(subscription)
        );
        if (result.success) {
          await refreshSubscriptionStatus();
          markOnboardingComplete(); // Success!
          alert(copy("success"));
          closeGuide();
        } else {
          alert(copy("failed"));
        }
      } else {
        alert(copy("permissionHelp"));
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      void captureClientOperationalError(error, {
        domain: "push-client",
        operation: "guide-subscribe",
      });
      const errMsg = error instanceof Error ? error.message : "";
      const isSwError = errMsg.includes("서비스 워커") || errMsg.includes("service worker") || errMsg.includes("Timed out");
      const isUnsupported = errMsg.includes("푸시 알림이 지원") || errMsg.includes("push notifications");
      if (isSwError) {
        alert(
          copy("restart")
        );
      } else if (isUnsupported) {
        alert(
          copy("unsupportedBrowser")
        );
      } else {
        alert(copy("failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    markOnboardingComplete();
    closeGuide();
  };

  if (pathname.includes("/lounge-membership")) return null;
  if (!isOpen) return null;

  // Determine if truly complete: permission granted AND DB subscription exists
  const isFullySubscribed = permissionState === "granted" && hasDbSubscription;
  // Permission granted but no DB subscription - needs re-registration
  const needsReRegistration = permissionState === "granted" && !hasDbSubscription;

  return (
    <div className="pp-ui fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="notification-guide-title" className={overlayStyles() + " max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pp-border ">
          <h2 id="notification-guide-title" className="text-lg font-bold flex items-center gap-2">
            {guideType === "install" ? (
                <>
                    <Download className="w-5 h-5 text-pp-accent-text" />
                    {copy("installTitle")}</>
            ) : (
                <>
                    <Bell className="w-5 h-5 text-pp-accent-text fill-pp-accent/20" />
                    {copy("title")}</>
            )}
          </h2>
          <button type="button" aria-label="닫기 / Close" onClick={handleClose} className={buttonStyles({ variant: "ghost", size: "compact" }) + " pp-icon-button"}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Fully Subscribed - permission granted AND DB subscription exists (ONLY if not install mode) */}
          {isFullySubscribed && guideType !== "install" ? (
             <div className="flex flex-col items-center text-center py-6 mx-auto">
               <div className="w-16 h-16 bg-pp-success-soft text-pp-success-text rounded-full flex items-center justify-center mb-4">
                 <CheckCircle className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold mb-2">{copy("complete")}</h3>
               <p className="text-pp-muted ">
                 {copy("completeHelp")}</p>
               <button type="button" onClick={handleClose} className={buttonStyles({ variant: "secondary", size: "compact" }) + " mt-6"}>
                 {copy("confirm")}</button>
             </div>
          ) : needsReRegistration ? (
            /* Permission granted but no DB subscription - re-registration needed */
            <div className="text-center py-4">
              <div className="mb-6">
                <div className="w-16 h-16 bg-pp-warning-soft text-pp-warning-text rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">{copy("registerAgain")}</h3>
                <p className="text-pp-muted ">
                  {copy("permissionGranted")}<br/>{copy("deviceRequired")}</p>
              </div>

              <button type="button"
                onClick={handleSubscribe}
                disabled={loading}
                className={buttonStyles({ variant: "warning", size: "compact" }) + " w-full flex items-center justify-center gap-2"}
              >
                {loading ? copy("loading") : copy("register")}
                {!loading && <Bell className="w-5 h-5 fill-white/20" />}
              </button>
            </div>
          ) : (
            <>
              {/* Manual Install Instructions (iOS or explicitly requested) */}
              {(guideType === "install" || (os === "ios" && !isStandalone)) && (
                <div className="space-y-6">
                  {guideType === "install" ? (
                    <div className="p-4 bg-pp-accent-soft rounded-xl border border-pp-accent ">
                        <p className="font-semibold text-pp-accent-text mb-1">
                          {copy("installBenefit")}</p>
                        <p className="text-sm text-pp-accent-text ">
                          {copy("followSteps")}<strong>{copy("addHome")}</strong>{copy("please")}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-pp-warning-soft rounded-xl border border-pp-warning-border ">
                        <p className="font-semibold text-pp-warning-text mb-1">
                        {copy("iosRequired")}</p>
                        <p className="text-sm text-pp-warning-text ">
                        {copy("onIphone")}<strong>{copy("addHome")}</strong>{copy("iosRequirement")}</p>
                    </div>
                  )}

                  {os === "ios" ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pp-surface-muted rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                        <div>
                          <p className="font-medium mb-1">{copy("safari")}</p>
                          <div className="flex items-center gap-2 text-sm text-pp-muted">
                             <Compass className="w-4 h-4 shrink-0" />
                             <span>{copy("safariHelp")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pp-surface-muted rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                        <div>
                          <p className="font-medium mb-1">{copy("share")}</p>
                          <Share className="w-6 h-6 text-pp-accent-text" />
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pp-surface-muted rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                        <div>
                          <p className="font-medium mb-1">{copy("addHomeChoice")}</p>
                          <div className="flex items-center gap-2 text-sm text-pp-muted">
                             <PlusSquare className="w-4 h-4" />
                             <span>{copy("addHome")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pp-surface-muted rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                        <div>
                          <p className="font-medium mb-1">{copy("openHome")}</p>
                          <p className="text-sm text-pp-muted">{copy("openHomeHelp")}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pp-surface-muted rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                        <div>
                          <p className="font-medium mb-1">{copy("browser")}</p>
                          <div className="flex items-center gap-2 text-sm text-pp-muted">
                             <Compass className="w-4 h-4 shrink-0" />
                             <span>{copy("browserHelp")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pp-surface-muted rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                        <div>
                          <p className="font-medium mb-1">{copy("menu")}</p>
                          <p className="text-sm text-pp-muted">{copy("menuHelp")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pp-surface-muted rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                        <div>
                          <p className="font-medium mb-1">{copy("installChoice")}</p>
                          <div className="flex items-center gap-2 text-sm text-pp-muted">
                             <Download className="w-4 h-4" />
                             <span>{copy("installAction")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pp-surface-muted rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                        <div>
                          <p className="font-medium mb-1">{copy("openHome")}</p>
                          <p className="text-sm text-pp-muted">{copy("openHomeHelp")}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {guideType === "install" && (
                    <button type="button" onClick={handleClose} className={buttonStyles({ variant: "secondary", size: "compact" }) + " w-full mt-4"}>
                        {copy("close")}</button>
                  )}
                </div>
              )}

              {/* Push Permission Request (Only shown if NOT install mode AND (Not iOS OR Already Standalone)) */}
              {guideType !== 'install' && (os !== "ios" || isStandalone) && (
                <div className="text-center py-4">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-pp-accent-soft text-pp-accent-text rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{copy("enable")}</h3>
                    <p className="text-pp-muted ">
                      {copy("updates")}<br/>{copy("updatesHelp")}</p>
                  </div>

                  <button type="button"
                    onClick={handleSubscribe}
                    disabled={loading}
                    className={buttonStyles({ variant: "primary", size: "compact" }) + " w-full flex items-center justify-center gap-2"}
                  >
                    {loading ? copy("loading") : copy("subscribe")}
                    {!loading && <Bell className="w-5 h-5 fill-white/20" />}
                  </button>

                  {permissionState === "denied" && (
                     <p className="text-xs text-pp-danger-text mt-3">
                       {copy("blocked")}</p>
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
