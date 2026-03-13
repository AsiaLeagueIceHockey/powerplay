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

  const showGate = data.membershipStatus !== "active";

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-amber-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_38%),linear-gradient(135deg,#fff8eb_0%,#ffffff_52%,#fff2f2_100%)] p-6 shadow-sm dark:border-amber-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_35%),linear-gradient(135deg,#18181b_0%,#09090b_70%,#1f0a0a_100%)]">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
            {locale === "ko" ? "PowerPlay Lounge Admin" : "PowerPlay Lounge Admin"}
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            {locale === "ko" ? "라운지에서 당신의 사업을 노출하세요" : "Promote your business in Lounge"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {locale === "ko"
              ? "월 구독 파트너는 대표 사업장 1개와 여러 개의 레슨/행사 일정을 올릴 수 있습니다. 전화, 카카오, 인스타그램, 웹사이트 유입도 추적합니다."
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "사업장 노출" : "Business impressions"}</p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{data.metrics.businessImpressions}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "사업장 클릭" : "Business clicks"}</p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{data.metrics.businessClicks}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "일정 노출" : "Event impressions"}</p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{data.metrics.eventImpressions}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "일정 클릭" : "Event clicks"}</p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{data.metrics.eventClicks}</p>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <LoungeBusinessForm locale={locale} business={data.business} />
            <LoungeEventForm locale={locale} events={data.events} />
          </div>

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
