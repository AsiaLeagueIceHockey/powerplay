"use client";

type SerializablePushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Active 상태의 SW registration을 반환한다.
 *
 * iOS PWA에서 navigator.serviceWorker.ready가 hang되는 문제를 우회하기 위해
 * ready를 절대 사용하지 않는다.
 *
 * 전략:
 * 1. getRegistration()으로 이미 active인 SW가 있으면 즉시 반환 (가장 빠름)
 * 2. active가 아니면 register()로 (재)설치 후 활성화 대기
 * 3. "죽은" registration(active/installing/waiting 모두 없음)이면 unregister 후 재등록
 */
async function getActiveRegistration(timeoutMs: number): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("이 브라우저에서는 서비스 워커를 지원하지 않습니다.");
  }

  // 1단계: 이미 active인 SW가 있으면 즉시 반환
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) {
    return existing;
  }

  // 2단계: "죽은" registration 정리 (active/installing/waiting 모두 없는 상태)
  // iOS에서 앱 백그라운드 후 복귀 시 발생할 수 있음
  if (existing && !existing.installing && !existing.waiting) {
    console.log("[SW] 죽은 registration 감지, unregister 후 재등록");
    await existing.unregister();
  }

  // 3단계: register() 호출 (새 등록 또는 재등록)
  const registration = await withTimeout(
    navigator.serviceWorker.register("/sw.js"),
    timeoutMs,
    "서비스 워커 등록에 실패했습니다.\n앱을 완전히 종료 후 다시 실행해주세요."
  );

  if (registration.active) {
    return registration;
  }

  // 4단계: installing/waiting → activated 대기
  const pendingSw = registration.installing || registration.waiting;
  if (!pendingSw) {
    throw new Error(
      "서비스 워커를 활성화할 수 없습니다.\n앱을 완전히 종료 후 다시 실행해주세요."
    );
  }

  if (pendingSw.state === "activated") {
    return registration;
  }

  await withTimeout(
    new Promise<void>((resolve, reject) => {
      const onStateChange = () => {
        if (pendingSw.state === "activated") {
          pendingSw.removeEventListener("statechange", onStateChange);
          resolve();
        } else if (pendingSw.state === "redundant") {
          pendingSw.removeEventListener("statechange", onStateChange);
          reject(new Error("서비스 워커 설치에 실패했습니다."));
        }
      };
      pendingSw.addEventListener("statechange", onStateChange);
    }),
    timeoutMs,
    "서비스 워커 활성화 대기 시간이 초과되었습니다.\n앱을 완전히 종료 후 다시 실행해주세요."
  );

  return registration;
}

export async function ensurePushSubscription(
  vapidPublicKey: string,
  timeoutMs: number = 20000
) {
  if (!("PushManager" in window)) {
    throw new Error("이 브라우저에서는 푸시 알림이 지원되지 않습니다.");
  }

  const registration = await getActiveRegistration(timeoutMs);

  const existingSubscription = await withTimeout(
    registration.pushManager.getSubscription(),
    5000,
    "푸시 구독 상태 확인에 실패했습니다."
  );

  if (existingSubscription) {
    return existingSubscription;
  }

  return withTimeout(
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }),
    timeoutMs,
    "푸시 알림 구독에 실패했습니다."
  );
}

export function serializePushSubscription(
  subscription: PushSubscription
): SerializablePushSubscription {
  const json = subscription.toJSON();
  const endpoint = json.endpoint ?? subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Push subscription payload is incomplete.");
  }

  return {
    endpoint,
    keys: {
      p256dh,
      auth,
    },
  };
}
