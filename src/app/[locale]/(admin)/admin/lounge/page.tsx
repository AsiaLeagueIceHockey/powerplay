import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { getLoungeAdminPageData } from "@/app/actions/lounge";
import { LoungeBusinessForm } from "@/components/lounge-business-form";
import { LoungeEventForm } from "@/components/lounge-event-form";
import { LoungeMembershipManager } from "@/components/lounge-membership-manager";

const inquiryLinks = {
  instagram: "https://www.instagram.com/powerplay.kr/",
  kakao: "https://open.kakao.com/o/gsvw6tei",
};

export default async function AdminLoungePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getLoungeAdminPageData();

  if (!data.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
        {locale === "ko" ? "관리자 권한이 필요합니다." : "Admin access required."}
      </div>
    );
  }

  const metrics = data.metrics!;
  const showGate = data.membershipStatus !== "active";
  const ctaStats = [
    {
      key: "detail",
      label: locale === "ko" ? "상세 보기" : "Detail views",
      value: metrics.ctaClicks.detail,
    },
    {
      key: "kakao",
      label: locale === "ko" ? "카카오" : "Kakao",
      value: metrics.ctaClicks.kakao,
    },
    {
      key: "instagram",
      label: "Instagram",
      value: metrics.ctaClicks.instagram,
    },
    {
      key: "website",
      label: locale === "ko" ? "웹사이트" : "Website",
      value: metrics.ctaClicks.website,
    },
    {
      key: "phone",
      label: locale === "ko" ? "전화" : "Phone",
      value: metrics.ctaClicks.phone,
    },
  ];
  const totalImpressions = metrics.businessImpressions + metrics.eventImpressions;
  const totalClicks = metrics.businessClicks + metrics.eventClicks;
  const clickThroughRate = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";
  const sourceStats = data.sourceMetrics ?? [];
  const eventDateFormatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-amber-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_38%),linear-gradient(135deg,#fff8eb_0%,#ffffff_52%,#fff2f2_100%)] p-6 shadow-sm dark:border-amber-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_35%),linear-gradient(135deg,#18181b_0%,#09090b_70%,#1f0a0a_100%)]">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
            {locale === "ko" ? "PowerPlay Lounge Admin" : "PowerPlay Lounge Admin"}
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            {locale === "ko" ? "라운지에서 당신의 비즈니스를 노출하세요" : "Promote your business in Lounge"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {locale === "ko"
              ? "월 구독 파트너는 대표 비즈니스 1개와 여러 개의 레슨/행사 일정을 올릴 수 있습니다. 전화, 카카오, 인스타그램, 웹사이트 유입도 추적합니다."
              : "Monthly subscribers can manage one representative business and multiple lesson or promo schedules with tracked CTA clicks."}
          </p>
        </div>
      </section>

      {showGate ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="max-w-2xl space-y-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {data.membershipStatus === "expired"
                  ? (locale === "ko" ? "라운지 구독이 만료되었습니다" : "Your lounge membership has expired")
                  : (locale === "ko" ? "라운지 프리미엄 멤버십이 필요합니다" : "Lounge premium membership required")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {locale === "ko"
                  ? "예상 월 구독료는 약 100,000원입니다. 문의 후 계좌이체 확인이 완료되면 슈퍼유저가 구독 기간을 등록합니다."
                  : "Expected monthly subscription is around 100,000 KRW. After inquiry and manual transfer confirmation, a superuser assigns your contract period."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={inquiryLinks.kakao} target="_blank" className="rounded-xl bg-[#FEE500] px-4 py-2.5 text-sm font-semibold text-[#3B1E1E]">
                {locale === "ko" ? "카카오로 문의하기" : "Contact via Kakao"}
              </Link>
              <Link href={inquiryLinks.instagram} target="_blank" className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {locale === "ko" ? "인스타 DM 문의" : "Contact via Instagram DM"}
              </Link>
            </div>
            {data.membership && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {locale === "ko"
                  ? `최근 계약 기간: ${data.membership.starts_at.slice(0, 10)} ~ ${data.membership.ends_at.slice(0, 10)}`
                  : `Latest contract: ${data.membership.starts_at.slice(0, 10)} ~ ${data.membership.ends_at.slice(0, 10)}`}
              </p>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "비즈니스 노출" : "Business impressions"}</p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{metrics.businessImpressions}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "비즈니스 클릭" : "Business clicks"}</p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{metrics.businessClicks}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "일정 노출" : "Event impressions"}</p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{metrics.eventImpressions}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "일정 클릭" : "Event clicks"}</p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{metrics.eventClicks}</p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {locale === "ko" ? "CTA 클릭 분해" : "CTA click breakdown"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {locale === "ko"
                      ? "어떤 문의 채널로 유입되는지 바로 확인할 수 있습니다."
                      : "See which contact channels drive the most traffic."}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-right dark:bg-amber-900/20">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    CTR
                  </p>
                  <p className="text-lg font-black text-amber-800 dark:text-amber-200">{clickThroughRate}%</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {ctaStats.map((item) => (
                  <div key={item.key} className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{item.label}</p>
                      <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {locale === "ko" ? "해석 가이드" : "Reading guide"}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                <p>
                  {locale === "ko"
                    ? "상세 보기 클릭이 높으면 카드 훅은 먹히고 있는 겁니다. 이 수치가 낮으면 대표 문구와 커버 이미지를 먼저 손보는 편이 맞습니다."
                    : "High detail clicks mean the card hook is working. If this is low, improve the headline and cover image first."}
                </p>
                <p>
                  {locale === "ko"
                    ? "카카오/전화 클릭이 높으면 즉시 문의형 니즈가 강한 업종입니다. 웹사이트 클릭이 높으면 비교 검토형 유저가 많다고 보면 됩니다."
                    : "High Kakao or phone clicks indicate urgent inquiry intent. Higher website clicks usually mean users want to compare before contacting."}
                </p>
                <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {locale === "ko" ? "유입 소스" : "Source attribution"}
                  </p>
                  {sourceStats.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {locale === "ko" ? "아직 기록된 유입 소스가 없습니다." : "No attributed sources yet."}
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {sourceStats.map((item) => (
                        <div key={item.source} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                              {item.source}
                            </span>
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                              CTR {item.ctr}%
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                            <span>{locale === "ko" ? "노출" : "Imp"} {item.impressions}</span>
                            <span>{locale === "ko" ? "클릭" : "Clk"} {item.clicks}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p>
                  {locale === "ko"
                    ? "다음 단계에서는 날짜별 추이, 이벤트별 전환, 배너별 유입 경로를 붙일 수 있습니다."
                    : "Next iteration can add date trends, event-level conversion, and source attribution by banner entry."}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <LoungeBusinessForm locale={locale} business={data.business} />
            <LoungeEventForm locale={locale} events={data.events} />
          </div>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {locale === "ko" ? "최근 7일 추이" : "Last 7 days"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {locale === "ko"
                    ? "노출과 클릭이 날짜별로 어떻게 움직였는지 봅니다."
                    : "Review impression and click movement by day."}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {data.dailyMetrics.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {locale === "ko" ? "아직 집계된 데이터가 없습니다." : "No trend data yet."}
                  </p>
                ) : (
                  data.dailyMetrics.map((item) => (
                    <div key={item.date} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{item.date}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {locale === "ko" ? "노출" : "Imp"} <strong className="text-zinc-900 dark:text-zinc-100">{item.impressions}</strong>
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {locale === "ko" ? "클릭" : "Clk"} <strong className="text-zinc-900 dark:text-zinc-100">{item.clicks}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {locale === "ko" ? "일정별 성과" : "Event performance"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {locale === "ko"
                    ? "어떤 일정이 실제 유입을 만들고 있는지 확인합니다."
                    : "See which schedules actually drive engagement."}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {data.eventMetrics.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {locale === "ko" ? "등록된 일정 또는 집계 데이터가 없습니다." : "No events or event metrics yet."}
                  </p>
                ) : (
                  data.eventMetrics.slice(0, 6).map((item) => (
                    <div key={item.eventId} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{eventDateFormatter.format(new Date(item.startTime))}</p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                          CTR {item.ctr}%
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                        <span>{locale === "ko" ? "노출" : "Impressions"} {item.impressions}</span>
                        <span>{locale === "ko" ? "클릭" : "Clicks"} {item.clicks}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <p className="font-semibold text-zinc-700 dark:text-zinc-200">{locale === "ko" ? "추가 프리미엄 기능 TODO" : "Future premium extras TODO"}</p>
            <p className="mt-2">{locale === "ko" ? "상단 고정 노출, 추천 배지, CTA별 전환 리포트, 파트너 전용 배너, 상세 통계 대시보드는 다음 단계에서 확장합니다." : "Pinned exposure, featured badges, richer CTA conversion reports, partner banners, and advanced dashboards will come next."}</p>
          </section>
        </>
      )}

      {data.isSuperUser ? (
        <LoungeMembershipManager locale={locale} admins={data.admins} memberships={data.memberships} />
      ) : null}
    </div>
  );
}
