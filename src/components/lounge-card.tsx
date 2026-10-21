"use client";
import { surfaceStyles, badgeStyles } from "@/components/ui/styles";

import { ArrowRight, Trophy } from "lucide-react";
import type { LoungeBusiness } from "@/app/actions/lounge";
import { getLoungeBusinessCategoryLabel } from "@/lib/lounge-business-category";
import { extractRegion } from "@/lib/rink-utils";
import { LoungeContactMenu } from "./lounge-contact-menu";
import { LoungeDetailLink } from "./lounge-detail-link";
import { LoungeImpressionTracker } from "./lounge-impression-tracker";
import { getLoungeBusinessCategoryTheme } from "./lounge-theme";

export function LoungeCard({
  business,
  locale,
  source,
}: {
  business: LoungeBusiness;
  locale: string;
  source?: string;
}) {
  const upcomingCount = business.upcoming_events?.length ?? 0;
  const detailHref = `/${locale}/lounge/${business.slug}${source ? `?source=${encodeURIComponent(source)}` : ""}`;
  const isFeatured = business.is_featured;
  const region = extractRegion(business.address ?? undefined);
  const categoryLabel = getLoungeBusinessCategoryLabel(locale, business.category);
  const categoryTheme = getLoungeBusinessCategoryTheme(business.category);
  const availableLinks = [
    {
      key: "phone",
      url: business.phone ? `tel:${business.phone}` : null,
    },
    {
      key: "kakao",
      url: business.kakao_open_chat_url,
    },
    {
      key: "instagram",
      url: business.instagram_url,
    },
    {
      key: "website",
      url: business.website_url,
    },
  ].filter((item): item is { key: "phone" | "kakao" | "instagram" | "website"; url: string } => Boolean(item.url));

  return (
    <article
      className={surfaceStyles({ interactive: true, density: "comfortable" }) + ` relative overflow-hidden ${categoryTheme.hoverBorder}`}
    >
      <LoungeImpressionTracker entityType="business" businessId={business.id} locale={locale} source={source} />
      <div className={`absolute inset-x-0 top-0 h-1 ${categoryTheme.accentLine}`} />
      <LoungeDetailLink
        entityType="business"
        businessId={business.id}
        href={detailHref}
        locale={locale}
        source={source}
        className="mb-4 block w-full rounded-xl text-left transition-colors"
      >
        <div className="flex items-start justify-between gap-3 rounded-xl">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${categoryTheme.badge}`}
              >
                <Trophy className="h-3 w-3" />
                {categoryLabel}
              </span>
              {isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-pp-surface-muted dark:text-pp-text">
                  {locale === "ko" ? "파워플레이 추천" : "Featured"}
                </span>
              ) : null}
              {region ? <span className={badgeStyles()}>{region}</span> : null}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-pp-text ">{business.name}</h3>
                {business.tagline ? (
                  <p className="mt-1 text-sm font-medium text-pp-muted ">{business.tagline}</p>
                ) : null}
              </div>
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="h-14 w-14 rounded-xl border border-pp-border object-cover " />
              ) : null}
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-pp-muted ">
              {business.description || (locale === "ko" ? "등록된 소개가 없습니다." : "No introduction yet.")}
            </p>
            {upcomingCount > 0 ? (
              <p className="mt-3 text-xs font-medium text-pp-muted ">
                {locale === "ko" ? `예정 일정 ${upcomingCount}개` : `${upcomingCount} upcoming events`}
              </p>
            ) : null}
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-pp-muted" />
        </div>
      </LoungeDetailLink>

      <div className="flex justify-end">
        <LoungeContactMenu
          locale={locale}
          items={availableLinks}
          entityType="business"
          businessId={business.id}
          source={source}
        />
      </div>
    </article>
  );
}
