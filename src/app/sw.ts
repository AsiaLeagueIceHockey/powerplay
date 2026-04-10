import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Keep Serwist's inject-manifest placeholder available for the build step
// without re-enabling install-time precaching on iOS PWA.
void self.__SW_MANIFEST;

const localeStartPath = /^\/(ko|en)\/?$/;

const startPageRuntimeCaching = [
  {
    matcher: ({
      request,
      sameOrigin,
      url,
    }: {
      request: Request;
      sameOrigin: boolean;
      url: URL;
    }) =>
      sameOrigin &&
      request.method === "GET" &&
      localeStartPath.test(url.pathname) &&
      request.headers.get("RSC") !== "1",
    handler: new NetworkFirst({
      cacheName: "app-start-page",
      networkTimeoutSeconds: 1,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: ({
      request,
      sameOrigin,
      url,
    }: {
      request: Request;
      sameOrigin: boolean;
      url: URL;
    }) =>
      sameOrigin &&
      request.method === "GET" &&
      localeStartPath.test(url.pathname) &&
      request.headers.get("RSC") === "1",
    handler: new NetworkFirst({
      cacheName: "app-start-rsc",
      networkTimeoutSeconds: 1,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 10 * 60,
        }),
      ],
    }),
  },
];

const serwist = new Serwist({
  // iOS PWA에서 precaching이 SW 설치를 블로킹하여 push 등록이 실패하는 문제 방지.
  // 시작 경로는 별도 runtime cache로 빠르게 복구하고, install 단계는 계속 가볍게 유지한다.
  precacheEntries: [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...startPageRuntimeCaching, ...defaultCache],
});

serwist.addEventListeners();

self.addEventListener("push", function (event: PushEvent) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/favicon.png",
      badge: "/favicon.png",
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
        url: data.url,
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event: NotificationEvent) {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url)
  );
});
