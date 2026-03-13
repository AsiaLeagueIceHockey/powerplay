"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Instagram, Sparkles } from "lucide-react";

export function FeedbackBanner() {
  const t = useTranslations();
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);

  const banners = [
    {
      id: "lounge",
      href: `/${locale}/lounge`,
      internal: true,
      bgClass: "bg-[linear-gradient(135deg,#111827_0%,#7c2d12_52%,#f59e0b_100%)] hover:opacity-90",
      iconBg: "bg-white/10 backdrop-blur",
      iconColor: "text-amber-200",
      icon: <Sparkles className="w-5 h-5" strokeWidth={2.5} />,
      title: t("common.loungeBanner.title"),
      description: t("common.loungeBanner.description"),
    },
    {
      id: "instagram",
      href: "https://www.instagram.com/powerplay.kr/",
      internal: false,
      bgClass: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90",
      iconBg: "bg-white",
      iconColor: "text-[#E1306C]",
      icon: <Instagram className="w-5 h-5" strokeWidth={2.5} />,
      title: t("common.instagram.title"),
      description: t("common.instagram.description"),
    },
    {
      id: "kakao",
      href: "https://open.kakao.com/o/gsvw6tei",
      internal: false,
      bgClass: "bg-[#3A1D1D] hover:bg-[#2d1616]",
      iconBg: "bg-[#FFEB3B]",
      iconColor: "text-[#3A1D1D]",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 3.1 1.76 5.86 4.46 7.54L4 22l6.54-1.54c.48.09.97.14 1.46.14 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
      ),
      title: t("common.feedback.title"),
      description: t("common.feedback.description"),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative mb-2">
      <div className="overflow-hidden rounded-xl shadow-sm relative">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => {
            const content = (
              <div className="flex items-center gap-3">
                <div
                  className={`${banner.iconBg} ${banner.iconColor} w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0`}
                >
                  {banner.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm leading-tight mb-0.5">
                    {banner.title}
                  </p>
                  <p className="text-zinc-200 text-xs truncate pr-8">
                    {banner.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-white/50"
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
                <Link
                  key={banner.id}
                  href={banner.href}
                  className={`w-full flex-shrink-0 block py-3 px-4 transition-colors text-white ${banner.bgClass}`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <a
                key={banner.id}
                href={banner.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex-shrink-0 block py-3 px-4 transition-colors text-white ${banner.bgClass}`}
              >
                {content}
              </a>
            );
          })}
        </div>

        <div className="absolute bottom-2.5 right-3 z-10 pointer-events-none bg-black/20 text-white/90 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full backdrop-blur-[2px]">
          {currentIndex + 1} / {banners.length}
        </div>
      </div>
    </div>
  );
}
