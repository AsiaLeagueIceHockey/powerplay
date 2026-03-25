import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { DynamicRinkMap } from "@/components/dynamic-rink-map";
import { RinkPlaceJsonLd } from "@/components/json-ld";
import { getPublicRinkById, getPublicRinkIds } from "@/lib/public-rinks";
import { extractRegion } from "@/lib/rink-utils";
import { ArrowRight, Building2 } from "lucide-react";

const siteUrl = "https://powerplay.kr";

export const revalidate = 900;
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await getPublicRinkIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const rink = await getPublicRinkById(id);

  if (!rink) {
    return {};
  }

  const isKo = locale === "ko";
  const name = isKo ? rink.name_ko : rink.name_en || rink.name_ko;
  const region = extractRegion(rink.address);
  const description = isKo
    ? `${name}${region ? ` (${region})` : ""} 아이스하키 링크장 정보, 예정 경기 ${rink.upcoming_match_count}건, 활동 동호회 ${rink.club_count}개를 확인하세요.`
    : `Find rink details, ${rink.upcoming_match_count} upcoming matches, and ${rink.club_count} active clubs at ${name}.`;

  return {
    title: isKo ? `${name} 링크장 정보` : `${name} rink details`,
    description,
    openGraph: {
      title: isKo ? `${name} 링크장 정보` : `${name} rink details`,
      description,
      url: `${siteUrl}/${locale}/rinks/${id}`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/rinks/${id}`,
      languages: {
        ko: `${siteUrl}/ko/rinks/${id}`,
        en: `${siteUrl}/en/rinks/${id}`,
      },
    },
  };
}

export default async function RinkDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const rink = await getPublicRinkById(id);
  if (!rink) {
    notFound();
  }

  const isKo = locale === "ko";
  const name = isKo ? rink.name_ko : rink.name_en || rink.name_ko;
  const region = extractRegion(rink.address);
  const upcomingMatches = rink.matches.slice(0, 10);
  const activeClubs = rink.clubs.slice(0, 12);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <RinkPlaceJsonLd rink={rink} locale={locale} />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/rinks" className="hover:text-blue-600 dark:hover:text-blue-400">
            {isKo ? "링크장 디렉토리" : "Rink directory"}
          </Link>
          <span>/</span>
          <span>{region || name}</span>
        </div>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{name}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {isKo
            ? `${name} 링크장에서 뛸 경기와 활동 중인 동호회를 한눈에 확인해보세요. 위치와 일정, 팀 정보를 한 페이지에 모아 두었습니다.`
            : `This rink page collects address, active clubs, and upcoming match information in one place.`}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {isKo ? "지역" : "Region"}
            </div>
            <div className="mt-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
              {region || (isKo ? "정보 준비 중" : "TBD")}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {isKo ? "예정 경기" : "Upcoming matches"}
            </div>
            <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{rink.upcoming_match_count}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {isKo ? "활동 동호회" : "Active clubs"}
            </div>
            <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{rink.club_count}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          {rink.map_url ? (
            <a
              href={rink.map_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg bg-[#03C75A] px-3 py-2 font-semibold text-white transition-colors hover:bg-[#02b351]"
            >
              {isKo ? "네이버 지도 열기" : "Open in Naver Map"}
            </a>
          ) : null}
          <Link
            href="/rinks"
            className="inline-flex items-center rounded-lg border border-zinc-200 px-3 py-2 font-semibold text-zinc-700 transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
            {isKo ? "다른 링크장 보기" : "Browse more rinks"}
          </Link>
        </div>
      </section>

      {(rink.lat && rink.lng) ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {isKo ? "링크장 위치" : "Rink location"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {rink.address || (isKo ? "지도 좌표 기준 위치 정보" : "Location based on map coordinates")}
            </p>
          </div>
          <div className="h-[420px]">
            <DynamicRinkMap rinks={[rink]} matches={[]} clubs={[]} isCompact />
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {isKo ? "예정 경기" : "Upcoming matches"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {isKo
              ? `${name} 링크장에서 현재 참가 가능한 경기 일정입니다.`
              : `Current open matches available for this rink.`}
          </p>

          {upcomingMatches.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              {isKo
                ? "현재 등록된 예정 경기가 없습니다. 추후 일정이 등록되면 이 페이지에 자동으로 반영됩니다."
                : "No upcoming matches are listed yet."}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {upcomingMatches.map((match) => {
                const date = new Date(match.start_time);
                const formattedDate = date.toLocaleString(isKo ? "ko-KR" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Seoul",
                });

                return (
                  <article
                    key={match.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          <Link href={`/match/${match.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                            {match.description || (isKo ? "아이스하키 경기" : "Ice hockey match")}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{formattedDate}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                          {(match.entry_points || match.fee).toLocaleString()}
                          {isKo ? "원" : " KRW"}
                        </div>
                        {match.club ? (
                          <Link
                            href={`/clubs/${match.club.id}`}
                            className="mt-1 inline-flex text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {match.club.name}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {isKo ? "활동 동호회" : "Active clubs"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {isKo
                ? `${name} 링크장을 주 이용 링크장으로 등록한 동호회 목록입니다.`
                : `Clubs that use this rink as one of their main rinks.`}
            </p>

            {activeClubs.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                {isKo ? "현재 연결된 동호회가 없습니다." : "No clubs linked yet."}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {activeClubs.map((club) => (
                  <article
                    key={club.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500/60"
                  >
                    <Link href={`/clubs/${club.id}`} className="block">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                          {club.logo_url ? (
                            <Image
                              src={club.logo_url}
                              alt={club.name}
                              width={48}
                              height={48}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-bold text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400">
                              {club.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {isKo ? "동호회 보기" : "View club"}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                          {club.description ? (
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                              {club.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

        </div>
      </section>
    </div>
  );
}
