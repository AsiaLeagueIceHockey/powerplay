"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Trophy } from "lucide-react";
import { trackLoungeClick, trackLoungeImpression } from "@/app/actions/lounge";

export interface FeedbackBannerItem {
  id: string;
  /** "sponsor" = paid Lounge business banner. PowerPlay's own links render separately (HouseLinks). */
  kind: "sponsor";
  href: string;
  /** Club-provided banner image (B). Without it the banner falls back to the navy layout (A). */
  coverImageUrl?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  title: string;
  description: string;
  durationMs?: number;
  businessId?: string;
  locale?: string;
}

function BannerLogo({ banner }: { banner: FeedbackBannerItem }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-pp-control bg-white text-pp-navy">
      {banner.imageUrl ? (
        <Image src={banner.imageUrl} alt={banner.imageAlt || banner.title} width={40} height={40} className="h-full w-full object-cover" />
      ) : (
        <Trophy className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      )}
    </span>
  );
}

function AdMark({ onImage }: { onImage: boolean }) {
  const t = useTranslations("common");
  return (
    <span className={`shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold leading-none ${onImage ? "bg-black/60 text-white" : "bg-white/15 text-white/85"}`}>
      {t("adLabel")}
    </span>
  );
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
    <div className="relative">
      <div className="relative overflow-hidden rounded-pp-card">
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

            // B: the club's own image, large (user content is a palette exception), text on a neutral scrim.
            // A: brand navy when no image was provided.
            const content = banner.coverImageUrl ? (
              <span className="relative block aspect-[16/7] w-full sm:aspect-[4/1]">
                <Image src={banner.coverImageUrl} alt="" fill sizes="(min-width: 1152px) 1120px, 100vw" className="object-cover" />
                <span className="absolute right-3 top-3"><AdMark onImage /></span>
                <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pb-3 pt-10 text-white">
                  <BannerLogo banner={banner} />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-bold">{banner.title}</span>
                    <span className="block truncate text-xs text-white/85">{banner.description}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
                </span>
              </span>
            ) : (
              <span className="flex w-full items-center gap-3 bg-pp-navy px-4 py-3 text-left text-white">
                <BannerLogo banner={banner} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{banner.title}</span>
                    <AdMark onImage={false} />
                  </span>
                  <span className="block truncate text-xs text-white/75">{banner.description}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
              </span>
            );

            return (
              <button data-ui-exception="compact-brand-banner"
                key={banner.id}
                type="button"
                onClick={() => {
                  handleBusinessBannerClick();
                  router.push(banner.href);
                }}
                className="block w-full flex-shrink-0 text-left"
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {banners.length > 1 ? (
        <p className="mt-2 text-xs text-pp-muted" aria-live="polite">
          {currentIndex + 1} / {banners.length}
        </p>
      ) : null}
    </div>
  );
}
