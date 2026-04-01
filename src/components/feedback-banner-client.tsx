"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Instagram, Trophy } from "lucide-react";
import { trackLoungeClick, trackLoungeImpression } from "@/app/actions/lounge";

export interface FeedbackBannerItem {
  id: string;
  href: string;
  internal: boolean;
  bgClass: string;
  iconBg: string;
  iconColor?: string;
  iconType: "business" | "instagram" | "kakao";
  imageUrl?: string | null;
  imageAlt?: string;
  title: string;
  description: string;
  durationMs?: number;
  businessId?: string;
  locale?: string;
}

export function FeedbackBannerClient({
  banners,
}: {
  banners: FeedbackBannerItem[];
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const currentBanner = banners[currentIndex];
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, currentBanner?.durationMs ?? 7000);

    return () => clearTimeout(timer);
  }, [banners, currentIndex]);

  useEffect(() => {
    const currentBanner = banners[currentIndex];
    if (!currentBanner?.businessId || !currentBanner.locale) {
      return;
    }

    const sessionKey = `feedback-banner-impression:${currentBanner.locale}:${currentBanner.businessId}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    sessionStorage.setItem(sessionKey, "pending");
    void trackLoungeImpression(
      "business",
      currentBanner.businessId,
      undefined,
      currentBanner.locale,
      "home-banner-impression"
    )
      .then((result) => {
        if (result.success) {
          sessionStorage.setItem(sessionKey, "1");
          return;
        }
        sessionStorage.removeItem(sessionKey);
      })
      .catch(() => {
        sessionStorage.removeItem(sessionKey);
      });
  }, [banners, currentIndex]);

  return (
    <div className="relative mb-2">
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => {
            const handleBusinessBannerClick = () => {
              if (!banner.businessId || !banner.locale) {
                return;
              }

              void trackLoungeClick(
                "business",
                banner.businessId,
                "detail",
                undefined,
                banner.locale,
                "home-banner-click"
              ).catch(() => {});
            };

            const iconContent = banner.imageUrl ? (
              <Image
                src={banner.imageUrl}
                alt={banner.imageAlt || banner.title}
                width={40}
                height={40}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : banner.iconType === "instagram" ? (
              <Instagram className="h-5 w-5" strokeWidth={2.5} />
            ) : banner.iconType === "kakao" ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 3.1 1.76 5.86 4.46 7.54L4 22l6.54-1.54c.48.09.97.14 1.46.14 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            ) : (
              <Trophy className="h-5 w-5" strokeWidth={2.5} />
            );

            const content = (
              <div className="flex w-full items-center gap-3 text-left">
                <div
                  className={`${banner.iconBg} ${banner.iconColor ?? ""} flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px]`}
                >
                  {iconContent}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold leading-tight text-white">
                    {banner.title}
                  </p>
                  <p className="truncate pr-8 text-xs text-zinc-200">
                    {banner.description}
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-white/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            );

            if (banner.internal) {
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => {
                    handleBusinessBannerClick();
                    router.push(banner.href);
                  }}
                  className={`block w-full flex-shrink-0 px-4 py-3 text-left text-white transition-colors ${banner.bgClass}`}
                >
                  {content}
                </button>
              );
            }

            return (
              <a
                key={banner.id}
                href={banner.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleBusinessBannerClick}
                className={`block w-full flex-shrink-0 px-4 py-3 text-white transition-colors ${banner.bgClass}`}
              >
                {content}
              </a>
            );
          })}
        </div>

        <div className="pointer-events-none absolute bottom-2.5 right-3 z-10 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/90 backdrop-blur-[2px]">
          {currentIndex + 1} / {banners.length}
        </div>
      </div>
    </div>
  );
}
