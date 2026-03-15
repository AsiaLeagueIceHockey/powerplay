import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { getLoungeAdminPageData } from "@/app/actions/lounge";
import { LoungeAdminDashboard } from "@/components/lounge-admin-dashboard";

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
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-zinc-700 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_40%),linear-gradient(135deg,#3f3f46_0%,#27272a_48%,#18181b_100%)] px-5 py-4 shadow-sm">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900">
            {locale === "ko" ? "PowerPlay Lounge Admin" : "PowerPlay Lounge Admin"}
          </span>
          <h1 className="mt-3 text-xl font-black tracking-tight text-zinc-100 md:text-2xl">
            {locale === "ko" ? "라운지에서 당신의 비즈니스를 노출하세요" : "Promote your business in Lounge"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            {locale === "ko"
              ? "월 구독 파트너는 대표 비즈니스 1개와 여러 개의 레슨/행사 일정을 올릴 수 있습니다. 전화, 카카오, 인스타그램, 웹사이트 유입도 추적합니다."
              : "Monthly subscribers can manage one representative business and multiple lesson or promo schedules with tracked CTA clicks."}
          </p>
        </div>
      </section>

      {showGate ? (
        <section className="rounded-3xl border border-zinc-700 bg-zinc-800 p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-2xl space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">
                  {data.membershipStatus === "expired"
                    ? (locale === "ko" ? "라운지 구독이 만료되었습니다" : "Your lounge membership has expired")
                    : (locale === "ko" ? "라운지 프리미엄 멤버십이 필요합니다" : "Lounge premium membership required")}
                </h2>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  {locale === "ko"
                    ? "예상 월 구독료는 약 100,000원입니다. 문의 후 계좌이체 확인이 완료되면 운영진이 구독 기간을 등록합니다."
                    : "Expected monthly subscription is around 100,000 KRW. After inquiry and transfer confirmation, the team assigns your contract period."}
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
                <p className="text-sm text-zinc-400">
                  {locale === "ko"
                    ? `최근 계약 기간: ${data.membership.starts_at.slice(0, 10)} ~ ${data.membership.ends_at.slice(0, 10)}`
                    : `Latest contract: ${data.membership.starts_at.slice(0, 10)} ~ ${data.membership.ends_at.slice(0, 10)}`}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: locale === "ko" ? "대표 비즈니스 1개 운영" : "One business profile",
                  body: locale === "ko"
                    ? "공유하기 좋은 URL로 대표 비즈니스 1개를 운영하고, 나만의 비즈니스 페이지처럼 소개와 연락 채널을 관리할 수 있습니다."
                    : "Run one representative business with a shareable URL and manage it like your own business landing page.",
                },
                {
                  title: locale === "ko" ? "여러 일정 등록" : "Multiple schedules",
                  body: locale === "ko" ? "레슨, 훈련, 대회, 프로모션 일정을 직접 올릴 수 있습니다." : "Publish lessons, training sessions, tournaments, and promotions.",
                },
                {
                  title: locale === "ko" ? "클릭/노출 추적" : "Track engagement",
                  body: locale === "ko" ? "카카오, 전화, 인스타, 웹사이트 클릭과 유입을 확인합니다." : "Monitor clicks and traffic to Kakao, phone, Instagram, and website links.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4">
                  <p className="font-semibold text-zinc-100">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <LoungeAdminDashboard
          locale={locale}
          business={data.business}
          events={data.events}
          metrics={metrics}
          dailyMetrics={data.dailyMetrics}
          eventMetrics={data.eventMetrics}
          membership={data.membership}
          isSuperUser={data.isSuperUser}
          featuredBusinesses={data.featuredBusinesses}
        />
      )}
    </div>
  );
}
