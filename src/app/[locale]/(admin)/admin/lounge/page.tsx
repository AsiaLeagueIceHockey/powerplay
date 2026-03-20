import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { getLoungeAdminPageData } from "@/app/actions/lounge";
import { submitLoungeMembershipApplication } from "@/app/actions/lounge";
import { LoungeAdminDashboard } from "@/components/lounge-admin-dashboard";

const inquiryLinks = {
  instagram: "https://www.instagram.com/powerplay.kr/",
  kakao: "https://open.kakao.com/o/sMyvIIli",
};

function formatKstDate(input: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(new Date(input));

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

export default async function AdminLoungePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getLoungeAdminPageData();

  async function submitApplicationAction(formData: FormData) {
    "use server";

    const result = await submitLoungeMembershipApplication(formData);
    if (!result.success) {
      console.error("[lounge] failed to submit membership application:", result.error);
    }
  }

  if (!data.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
        {locale === "ko" ? "관리자 권한이 필요합니다." : "Admin access required."}
      </div>
    );
  }

  const metrics = data.metrics!;
  const showGate = data.membershipStatus !== "active";
  const latestApplication = data.latestApplication;

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/admin/lounge/guide`}
        className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-amber-400/50 hover:bg-amber-500/15"
      >
        <span>{locale === "ko" ? "📢 라운지 OPEN 안내!" : "📢 Lounge OPEN guide!"}</span>
        <span className="text-xs text-amber-200">{locale === "ko" ? "확인하기" : "Open"}</span>
      </Link>

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
                    : data.membershipStatus === "upcoming"
                      ? (locale === "ko" ? "라운지 구독 시작 전입니다" : "Your lounge membership has not started yet")
                      : (locale === "ko" ? "라운지 프리미엄 멤버십이 필요합니다" : "Lounge premium membership required")}
                </h2>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  {data.membershipStatus === "upcoming"
                    ? locale === "ko"
                      ? "등록된 계약 기간이 아직 시작되지 않았습니다. 시작일이 되면 라운지 비즈니스와 일정 관리 기능을 바로 사용할 수 있습니다."
                      : "Your contract period is registered but has not started yet. Lounge business and schedule management will unlock on the start date."
                    : locale === "ko"
                      ? "최초 등록비는 200,000원(첫 달), 월 구독료는 100,000원(둘째 달부터)입니다. 문의 또는 신청 후 확인이 완료되면 운영진이 구독 기간을 등록합니다."
                      : "Pricing is fixed at 200,000 KRW for the first month and 100,000 KRW monthly from the second month. After inquiry or application, the team registers your contract period."}
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {locale === "ko" ? "신청하기" : "Apply"}
                  </p>
                  <form action={submitApplicationAction}>
                    <button
                      type="submit"
                      disabled={latestApplication?.status === "pending" || latestApplication?.status === "contacted"}
                      className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {latestApplication?.status === "pending"
                        ? "멤버십 신청 완료"
                        : latestApplication?.status === "contacted"
                          ? "운영진 연락 대기 중"
                          : "멤버십 신청하기"}
                    </button>
                  </form>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {locale === "ko" ? "문의하기" : "Inquiry"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={inquiryLinks.kakao} target="_blank" className="rounded-xl bg-[#FEE500] px-4 py-2.5 text-sm font-semibold text-[#3B1E1E]">
                      {locale === "ko" ? "카카오톡 문의" : "KakaoTalk inquiry"}
                    </Link>
                    <Link href={inquiryLinks.instagram} target="_blank" className="rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-4 py-2.5 text-sm font-semibold text-white">
                      {locale === "ko" ? "인스타 DM 문의" : "Contact via Instagram DM"}
                    </Link>
                  </div>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                {latestApplication?.status === "pending"
                  ? "운영진이 신청 내역을 확인하고 등록하신 연락처로 안내드릴 예정입니다."
                  : latestApplication?.status === "contacted"
                    ? "운영진이 연락을 시작한 상태입니다. 프로필 연락처를 최신 상태로 유지해주세요."
                    : "카카오톡/인스타로 바로 문의하거나, 멤버십 신청을 남기면 운영진이 직접 연락드립니다."}
              </p>
              {data.membership && (
                <p className="text-sm text-zinc-400">
                  {locale === "ko"
                    ? `최근 계약 기간: ${formatKstDate(data.membership.starts_at)} ~ ${formatKstDate(data.membership.ends_at)}`
                    : `Latest contract: ${formatKstDate(data.membership.starts_at)} ~ ${formatKstDate(data.membership.ends_at)}`}
                </p>
              )}
              {latestApplication ? (
                <p className="text-xs text-zinc-500">
                  최근 신청 상태: {latestApplication.status}
                </p>
              ) : null}
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
