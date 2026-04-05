import { getTranslations } from "next-intl/server";
import { getPublicHomeBannerBusinesses } from "@/app/actions/lounge";
import { FeedbackBannerClient, type FeedbackBannerItem } from "./feedback-banner-client";

export async function FeedbackBanner({ locale }: { locale: string }) {
  const t = await getTranslations();
  const businessBanners = await getPublicHomeBannerBusinesses();

  const banners: FeedbackBannerItem[] = [
    ...businessBanners.map((business) => ({
      id: `lounge-business-${business.id}`,
      href: `/${locale}/lounge/${business.slug}?source=home-banner`,
      internal: true,
      businessId: business.id,
      locale,
      bgClass: "bg-[linear-gradient(135deg,#111827_0%,#7c2d12_52%,#f59e0b_100%)] hover:opacity-90",
      iconBg: "bg-white/95 shadow-sm",
      iconType: "business" as const,
      imageUrl: business.logo_url,
      imageAlt: business.name,
      iconColor: "text-amber-500",
      title: business.home_banner_title?.trim() || business.name,
      description: business.home_banner_description?.trim() || business.description?.trim() || business.name,
      durationMs: 14000,
    })),
    {
      id: "instagram",
      href: "https://www.instagram.com/p/DWu4WLTj7tv/",
      internal: false,
      bgClass: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90",
      iconBg: "bg-white",
      iconColor: "text-[#E1306C]",
      iconType: "instagram" as const,
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
      iconType: "kakao" as const,
      title: t("common.feedback.title"),
      description: t("common.feedback.description"),
    },
  ];

  return <FeedbackBannerClient banners={banners} />;
}
