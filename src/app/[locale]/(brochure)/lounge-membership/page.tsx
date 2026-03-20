import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Crown,
  ExternalLink,
  MapPinned,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const siteUrl = "https://powerplay.kr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  const title = isKo
    ? "파워플레이 라운지 멤버십 소개"
    : "PowerPlay Lounge Membership";
  const description = isKo
    ? "하키 비즈니스를 위한 프리미엄 홍보 공간, 파워플레이 라운지 멤버십 소개 자료입니다."
    : "A premium promotion space for hockey businesses. Explore PowerPlay Lounge membership.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/lounge-membership`,
      languages: {
        ko: `${siteUrl}/ko/lounge-membership`,
        en: `${siteUrl}/en/lounge-membership`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/lounge-membership`,
      siteName: "PowerPlay",
      images: [{ url: `${siteUrl}/og-new.png`, width: 1200, height: 630 }],
    },
  };
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6814]">{eyebrow}</p>
      <h2 className="text-2xl font-black tracking-tight text-zinc-950 md:text-3xl">{title}</h2>
      <p className="text-sm leading-7 text-zinc-600 md:text-base">{body}</p>
    </div>
  );
}

function ScreenshotCard({
  src,
  alt,
  title,
  body,
  tall = true,
}: {
  src: string;
  alt: string;
  title: string;
  body: string;
  tall?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative bg-zinc-100">
        <div className={`relative w-full ${tall ? "aspect-[9/19.5]" : "aspect-[9/16]"}`}>
          <Image src={src} alt={alt} fill unoptimized className="object-cover object-top" />
        </div>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-lg font-black tracking-tight text-zinc-950">{title}</p>
        <p className="text-sm leading-6 text-zinc-600">{body}</p>
      </div>
    </div>
  );
}

function BrochurePage({ locale }: { locale: string }) {
  const isKo = locale === "ko";

  const strings = isKo
    ? {
        heroTitle: "파워플레이 라운지 멤버십 소개자료",
        heroBody:
          "레슨, 훈련장, 대회, 브랜드, 치료/재활까지. 하키 비즈니스를 위한 전용 홍보 공간을 통해 더 많은 하키인에게 안정적으로 노출하고, 일정 운영과 성과 추적까지 한 번에 관리할 수 있습니다.",
        primaryCta: "라운지 둘러보기",
        secondaryCta: "관리 화면 보기",
        eyebrow1: "Why Lounge",
        title1: "왜 파워플레이 라운지가 필요한가",
        body1:
          "하키 비즈니스는 SNS와 커뮤니티를 병행해야 하지만, 노출과 문의 흐름이 흩어지기 쉽습니다. 파워플레이 라운지는 이미 하키에 관심 있는 유저에게 비즈니스와 일정을 함께 보여주는 전용 허브입니다.",
        eyebrow2: "Who It's For",
        title2: "이런 운영자에게 맞습니다",
        body2:
          "유소년 레슨, 그룹 레슨, 지상훈련장, 대회, 브랜드, 치료/재활, 기타 하키 관련 서비스까지 폭넓게 소개할 수 있도록 설계했습니다.",
        eyebrow3: "What You Get",
        title3: "멤버십으로 바로 사용할 수 있는 기능",
        body3:
          "홍보만 가능한 페이지가 아니라, 실제 운영과 전환까지 이어지는 도구로 설계했습니다.",
        eyebrow4: "Product Screens",
        title4: "실제 앱 화면 예시",
        body4:
          "라운지 메인, 일정 카드, 상세 페이지 흐름을 기준으로 구성한 예시입니다. 다음 단계에서는 실제 운영 데이터 기반 스크린샷으로 교체할 수 있습니다.",
        eyebrow5: "Workflow",
        title5: "운영자는 이렇게 사용합니다",
        body5:
          "계약 등록 후 바로 비즈니스를 만들고, 일정을 등록하고, 공개 노출과 반응 데이터를 확인하는 흐름입니다.",
        eyebrow6: "Pricing",
        title6: "가격 및 운영 방식",
        body6:
          "처음부터 가격이 명확하고, 운영진이 직접 구독 등록을 관리하는 방식이라 상담과 안내 흐름도 단순합니다.",
        eyebrow7: "Value",
        title7: "재구매가 일어나는 이유",
        body7:
          "단순 노출이 아니라, 소개 페이지, 일정 관리, 공유 URL, 문의 채널, 성과 확인까지 한 세트로 제공되기 때문입니다.",
        priceTitle: "PowerPlay Lounge Membership",
        priceBody:
          "최초 등록: 200,000원 (첫 달)\n월 구독료: 100,000원 (둘째 달부터)\n\n신청 또는 문의 후 운영진이 계약 기간을 등록하면 바로 사용을 시작할 수 있습니다.",
      }
    : {
        heroTitle: "PowerPlay Lounge Membership Brochure",
        heroBody:
          "From lessons and training centers to tournaments, brands, and rehab services. PowerPlay Lounge helps hockey businesses reach the right audience, publish schedules, and track engagement in one place.",
        primaryCta: "Explore Lounge",
        secondaryCta: "Open Admin",
        eyebrow1: "Why Lounge",
        title1: "Why PowerPlay Lounge exists",
        body1:
          "Hockey businesses often split attention across SNS, chat communities, and ad hoc links. PowerPlay Lounge gives them a dedicated place where interested hockey users can discover businesses and schedules together.",
        eyebrow2: "Who It's For",
        title2: "Built for a broad range of hockey businesses",
        body2:
          "Youth lessons, group lessons, dryland centers, tournaments, brands, rehab and recovery, and other hockey-related services all fit the same structure.",
        eyebrow3: "What You Get",
        title3: "Included with the membership",
        body3:
          "It is not just a listing. It is a usable operating tool that connects discovery, schedule management, contact channels, and analytics.",
        eyebrow4: "Product Screens",
        title4: "Product screen examples",
        body4:
          "These examples reflect the actual Lounge UX structure. The next iteration can replace them with production screenshots.",
        eyebrow5: "Workflow",
        title5: "How partners use it",
        body5:
          "After the contract is registered, partners create the business page, publish schedules, and track incoming engagement.",
        eyebrow6: "Pricing",
        title6: "Pricing and operating model",
        body6:
          "Pricing is fixed and the onboarding flow is managed by the PowerPlay team, which keeps activation simple.",
        eyebrow7: "Value",
        title7: "Why partners keep renewing",
        body7:
          "Because the product combines a shareable landing page, schedule management, contact actions, and measurable performance in one package.",
        priceTitle: "PowerPlay Lounge Membership",
        priceBody:
          "Initial registration: KRW 200,000 (first month)\nMonthly subscription: KRW 100,000 (from second month)\n\nAfter inquiry or application, the PowerPlay team registers the contract period and activates the workspace.",
      };

  return (
    <div className="bg-[#f7f5ef] text-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-5 py-10 md:px-8 md:py-14 print:max-w-none print:gap-12 print:px-6 print:py-6">
        <section className="overflow-hidden rounded-[36px] border border-[#d4a017]/25 bg-[radial-gradient(circle_at_top_right,_rgba(243,210,122,0.28),_transparent_26%),linear-gradient(135deg,#0f172a_0%,#1e293b_52%,#d4a017_145%)] px-6 py-8 text-white md:px-10 md:py-12 print:rounded-3xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#f3d27a]">
                <Crown className="h-4 w-4" />
                PowerPlay Lounge
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Image src="/favicon.png" alt="PowerPlay" width={44} height={44} className="h-11 w-11 rounded-xl object-contain" />
                </div>
                <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
                  {strings.heroTitle}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-zinc-200 md:text-base">
                  {strings.heroBody}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 print:hidden">
                <Link
                  href={`/${locale}/lounge`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-950"
                >
                  {strings.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${locale}/admin/lounge`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white"
                >
                  {strings.secondaryCta}
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                isKo ? "대표 비즈니스 1개 운영" : "One business profile",
                isKo ? "여러 일정 등록 및 노출" : "Multiple schedules",
                isKo ? "문의 채널 통합 관리" : "Unified contact channels",
                isKo ? "노출/클릭 성과 추적" : "Exposure and click analytics",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-zinc-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <SectionHeader eyebrow={strings.eyebrow1} title={strings.title1} body={strings.body1} />
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: <MapPinned className="h-5 w-5" />,
                  title: isKo ? "하키 유저가 모이는 곳에 노출" : "Visible where hockey users already are",
                  body: isKo
                    ? "일반 광고보다 하키 관심 유저에게 직접 연결되기 쉬운 구조입니다."
                    : "Reach users already looking for hockey-related activities and services.",
                },
                {
                  icon: <CalendarDays className="h-5 w-5" />,
                  title: isKo ? "비즈니스와 일정이 함께 보임" : "Business and schedule shown together",
                  body: isKo
                    ? "소개만 노출되는 것이 아니라, 일정과 이벤트를 함께 운영할 수 있습니다."
                    : "Not just a listing. Partners can operate and expose actual schedules.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 inline-flex rounded-2xl bg-zinc-100 p-3 text-zinc-700">{item.icon}</div>
                  <p className="text-base font-bold text-zinc-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionHeader eyebrow={strings.eyebrow2} title={strings.title2} body={strings.body2} />
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                isKo ? "유소년 레슨" : "Youth lessons",
                isKo ? "그룹 레슨" : "Group lessons",
                isKo ? "지상훈련장" : "Dryland centers",
                isKo ? "대회 운영" : "Tournaments",
                isKo ? "브랜드" : "Brands",
                isKo ? "치료/재활" : "Recovery & Rehab",
                isKo ? "기타 하키 서비스" : "Other hockey services",
              ].map((item) => (
                <span key={item} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeader eyebrow={strings.eyebrow3} title={strings.title3} body={strings.body3} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: <Sparkles className="h-5 w-5" />,
                title: isKo ? "공유하기 좋은 URL" : "Shareable URL",
                body: isKo ? "인스타 프로필, 블로그, 카카오 채널에 붙이기 좋은 전용 비즈니스 페이지를 제공합니다." : "Each business gets a clean, shareable landing page.",
              },
              {
                icon: <CalendarDays className="h-5 w-5" />,
                title: isKo ? "일정 등록과 캘린더" : "Schedules and calendar",
                body: isKo ? "개별 일정과 반복 일정을 등록하고, 유저는 일정 탭과 상세에서 캘린더로 확인할 수 있습니다." : "Publish one-off and recurring schedules with a user-facing calendar view.",
              },
              {
                icon: <MessageSquareText className="h-5 w-5" />,
                title: isKo ? "문의 채널 통합" : "Unified inquiries",
                body: isKo ? "전화, 카카오톡, 인스타그램, 웹사이트까지 한 화면에서 바로 연결합니다." : "Connect phone, KakaoTalk, Instagram, and website actions in one place.",
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: isKo ? "노출/클릭 성과 확인" : "Performance tracking",
                body: isKo ? "비즈니스 노출, 클릭, 일정별 반응, CTA 클릭 흐름을 확인할 수 있습니다." : "Track exposures, clicks, schedule engagement, and CTA activity.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-3 inline-flex rounded-2xl bg-zinc-100 p-3 text-zinc-700">{item.icon}</div>
                <p className="text-base font-bold text-zinc-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeader eyebrow={strings.eyebrow4} title={strings.title4} body={strings.body4} />
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-4 py-3 text-xs leading-6 text-zinc-500">
            {isKo
              ? "실제 앱 화면을 넣어두었습니다. PDF 저장 시에는 브라우저 인쇄에서 '배경 그래픽' 옵션을 켜면 현재 톤이 그대로 유지됩니다."
              : "These are real product screenshots. Enable background graphics in the print dialog when saving as PDF."}
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ScreenshotCard
              src="/lounge-brochure/info_1.png"
              alt="Lounge information screen 1"
              title={isKo ? "하키 정보 탭 메인" : "Lounge info tab"}
              body={isKo ? "카테고리별 비즈니스 카드와 프리미엄한 톤의 메인 탐색 화면입니다." : "The main discovery screen for business categories and featured cards."}
            />
            <ScreenshotCard
              src="/lounge-brochure/info_2.png"
              alt="Lounge information screen 2"
              title={isKo ? "대회/브랜드 등 카테고리 탐색" : "Category-based browsing"}
              body={isKo ? "대회, 브랜드, 기타 서비스까지 같은 구조 안에서 노출할 수 있습니다." : "Tournament, brand, and other service categories fit the same discovery flow."}
            />
            <ScreenshotCard
              src="/lounge-brochure/schedule_1.png"
              alt="Lounge schedule screen 1"
              title={isKo ? "일정 탭과 목록형 노출" : "Schedule list view"}
              body={isKo ? "날짜 필터와 목록/캘린더 전환을 통해 유저가 일정 중심으로 탐색할 수 있습니다." : "Users can browse by date with list and calendar views."}
            />
            <ScreenshotCard
              src="/lounge-brochure/schedule_2.png"
              alt="Lounge schedule screen 2"
              title={isKo ? "연락 채널이 연결된 일정 카드" : "Schedule cards with direct contact actions"}
              body={isKo ? "일정 카드에서도 전화, 카카오톡, 인스타그램, 웹사이트로 바로 이어집니다." : "Schedule cards connect directly to phone, KakaoTalk, Instagram, and website actions."}
            />
            <ScreenshotCard
              src="/lounge-brochure/detail.png"
              alt="Lounge business detail screen"
              title={isKo ? "상세 페이지" : "Business detail page"}
              body={isKo ? "소개, 예정 일정, 지도, 공유, 연락하기가 한 화면 안에서 정리됩니다." : "Detail pages bring together intro, schedule count, maps, sharing, and contact actions."}
            />
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionHeader eyebrow={strings.eyebrow5} title={strings.title5} body={strings.body5} />
            <div className="mt-6 space-y-4">
              {[
                {
                  step: "01",
                  title: isKo ? "운영진이 구독 계약 등록" : "Contract registered by the team",
                  body: isKo ? "신청 또는 문의 후 운영진이 구독 기간을 등록합니다." : "After inquiry or application, the PowerPlay team activates the contract period.",
                },
                {
                  step: "02",
                  title: isKo ? "대표 비즈니스 1개 설정" : "Set up one representative business",
                  body: isKo ? "이름, 소개, 로고, 커버, 위치, 연락 채널, 공유 URL을 한 번에 관리합니다." : "Manage the name, intro, logo, cover, location, contact channels, and shareable URL.",
                },
                {
                  step: "03",
                  title: isKo ? "일정 등록 및 반복 일정 운영" : "Publish schedules and recurring events",
                  body: isKo ? "레슨, 대회, 프로모션 일정을 등록하고 반복 일정도 한 번에 올릴 수 있습니다." : "Publish events and recurring schedules for lessons, tournaments, and promotions.",
                },
                {
                  step: "04",
                  title: isKo ? "성과 확인 및 운영 개선" : "Track performance and optimize",
                  body: isKo ? "노출, 클릭, 문의 채널 반응을 보고 다음 일정과 운영 방식을 조정합니다." : "Review exposures, clicks, and inquiry actions to improve future operations.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-black text-white">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-base font-bold text-zinc-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
              <SectionHeader eyebrow={strings.eyebrow6} title={strings.title6} body={strings.body6} />
              <div className="mt-6 rounded-[28px] border border-[#d4a017]/25 bg-[radial-gradient(circle_at_top_left,_rgba(243,210,122,0.18),_transparent_28%),linear-gradient(180deg,#fff8eb_0%,#fffdf7_100%)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b6814]">{strings.priceTitle}</p>
                <p className="mt-4 whitespace-pre-line text-base font-semibold leading-8 text-zinc-900">{strings.priceBody}</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
              <SectionHeader eyebrow={strings.eyebrow7} title={strings.title7} body={strings.body7} />
              <div className="mt-6 grid gap-3">
                {[
                  {
                    title: isKo ? "인스타/블로그에 바로 붙일 수 있는 URL" : "A shareable URL for Instagram and blogs",
                    body: isKo ? "대표 비즈니스 페이지를 외부 채널과 연결해 유입을 하나로 모을 수 있습니다." : "Use one destination page from social, blog, and Kakao channels.",
                  },
                  {
                    title: isKo ? "일정 노출과 일정 상세 연결" : "Schedules connected to detail pages",
                    body: isKo ? "홍보가 소개 카드에만 머무르지 않고, 실제 이벤트와 일정으로 이어집니다." : "Promotion flows into actual events instead of stopping at a profile card.",
                  },
                  {
                    title: isKo ? "무엇이 잘 먹히는지 바로 확인" : "Know what is working",
                    body: isKo ? "노출과 클릭, CTA 반응을 확인해 운영 방향을 더 빠르게 잡을 수 있습니다." : "Exposure and click data makes it easier to adjust the next campaign or schedule.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8b6814]" />
                      <div>
                        <p className="text-base font-bold text-zinc-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-600">{item.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-zinc-200 bg-white px-6 py-8 shadow-sm md:px-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6814]">
                {isKo ? "Ready To Start" : "Ready To Start"}
              </p>
              <h2 className="text-2xl font-black tracking-tight text-zinc-950 md:text-3xl">
                {isKo ? "파워플레이 라운지로 하키 비즈니스를 더 선명하게 소개하세요" : "Present your hockey business more clearly with PowerPlay Lounge"}
              </h2>
              <p className="text-sm leading-7 text-zinc-600 md:text-base">
                {isKo
                  ? "공개 라운지, 일정 노출, 문의 채널 연결, 성과 추적까지. 파워플레이 안에서 한 번에 운영할 수 있습니다."
                  : "Public exposure, schedules, inquiry channels, and analytics in one operating flow."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/admin/lounge`}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white"
              >
                {isKo ? "멤버십 신청 화면 보기" : "Open membership screen"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/lounge`}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700"
              >
                {isKo ? "공개 라운지 보기" : "Open public lounge"}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default async function LoungeMembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BrochurePage locale={locale} />;
}
