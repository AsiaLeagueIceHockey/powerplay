import { getTranslations } from "next-intl/server";
import { Instagram, MessageCircle, ChevronRight } from "lucide-react";
import { getPublicLoungeData } from "@/lib/seo/public-lounge";
import { surfaceStyles } from "@/components/ui/styles";
import { FeedbackBannerClient, type FeedbackBannerItem } from "./feedback-banner-client";

/**
 * Home carousel: sponsor banners only (Lounge businesses with a home banner).
 * Banner kind is derived from the source without a schema change:
 * lounge business banners are "sponsor", hard-coded PowerPlay links are "house" (see HouseLinks).
 */
export async function FeedbackBanner({ locale }: { locale: string }) {
  const { businesses } = await getPublicLoungeData();
  const banners: FeedbackBannerItem[] = businesses
    .filter((business) => business.home_banner_enabled && business.home_banner_title?.trim() && business.home_banner_description?.trim())
    .sort((a, b) => a.home_banner_order - b.home_banner_order || a.name.localeCompare(b.name, "ko", { sensitivity: "base" }))
    .map((business) => ({
      id: `lounge-business-${business.id}`,
      kind: "sponsor" as const,
      href: `/${locale}/lounge/${business.slug}?source=home-banner`,
      businessId: business.id,
      locale,
      coverImageUrl: business.cover_image_url,
      imageUrl: business.logo_url,
      imageAlt: business.name,
      title: business.home_banner_title?.trim() || business.name,
      description: business.home_banner_description?.trim() || business.description?.trim() || business.name,
      durationMs: 14000,
    }));

  if (banners.length === 0) return null;
  return <FeedbackBannerClient banners={banners} />;
}

/** PowerPlay's own links ("house"): a quiet list at the end of the home lists, outside the sponsor carousel. */
export async function HouseLinks() {
  const t = await getTranslations();
  const links = [
    { id: "instagram", href: "https://www.instagram.com/p/DWu4WLTj7tv/", icon: Instagram, title: t("common.instagram.title"), description: t("common.instagram.description") },
    { id: "kakao", href: "https://open.kakao.com/o/gsvw6tei", icon: MessageCircle, title: t("common.feedback.title"), description: t("common.feedback.description") },
  ];

  return (
    <nav aria-label="PowerPlay" className={`${surfaceStyles({ density: "none" })} divide-y divide-pp-border overflow-hidden`}>
      {links.map(({ id, href, icon: Icon, title, description }) => (
        <a key={id} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-pp-surface-muted">
          <Icon className="h-5 w-5 shrink-0 text-pp-brand-strong" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-pp-text">{title}</span>
            <span className="block truncate text-xs text-pp-muted">{description}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-pp-muted" aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
}
