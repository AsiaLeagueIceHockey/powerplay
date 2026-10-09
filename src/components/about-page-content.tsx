import Link from "next/link";
import { CalendarDays, Globe2, Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";

const siteUrl = "https://powerplay.kr";
const contactEmail = "founder@powerplay.kr";
const instagramUrl = "https://www.instagram.com/powerplay.kr";

type AboutPageContentProps = {
  locale: string;
};

export function AboutPageContent({ locale }: AboutPageContentProps) {
  const isKo = locale === "ko";
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PowerPlay",
    alternateName: "파워플레이",
    url: `${siteUrl}/${locale}/about`,
    logo: `${siteUrl}/long-logo.jpg`,
    foundingDate: "2026-03",
    foundingLocation: {
      "@type": "Country",
      name: "South Korea",
    },
    founder: {
      "@type": "Person",
      name: "Yeongsang Jo",
    },
    email: contactEmail,
    sameAs: [instagramUrl],
  };

  const facts = [
    {
      icon: CalendarDays,
      label: isKo ? "시작" : "Founded",
      value: isKo ? "2026년 3월" : "March 2026",
    },
    {
      icon: Globe2,
      label: isKo ? "기반 지역" : "Based in",
      value: isKo ? "대한민국" : "South Korea",
    },
    {
      icon: ShieldCheck,
      label: isKo ? "성장 단계" : "Stage",
      value: isKo ? "부트스트랩" : "Bootstrapped",
    },
    {
      icon: UserRound,
      label: isKo ? "창업자" : "Founder",
      value: "Yeongsang Jo",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="mx-auto max-w-4xl py-6 sm:py-12">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-blue-50 via-white to-zinc-50 px-6 py-10 dark:border-zinc-800 dark:from-blue-950/30 dark:via-zinc-950 dark:to-zinc-900 sm:px-10 sm:py-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            {isKo ? "회사 소개" : "About the company"}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
            {isKo
              ? "한국 아이스하키 커뮤니티를 더 가깝게 연결합니다"
              : "Bringing Korea’s ice hockey community closer together"}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg sm:leading-8">
            {isKo
              ? "파워플레이는 2026년 3월 대한민국에서 시작한 부트스트랩 소프트웨어 스타트업입니다. 아마추어 아이스하키 선수와 운영진이 경기, 동호회, 링크장 정보를 한곳에서 찾고 관리할 수 있는 서비스를 만듭니다."
              : "PowerPlay is a bootstrapped software startup founded in South Korea in March 2026. We build practical tools that help amateur ice hockey players and organizers find and manage games, clubs, and rinks in one place."}
          </p>
        </section>

        <section className="grid gap-3 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label}
              </p>
              <p className="mt-1 font-semibold text-zinc-950 dark:text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 border-y border-zinc-200 py-10 dark:border-zinc-800 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {isKo ? "우리가 해결하는 문제" : "The problem we solve"}
            </h2>
            <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-300">
              {isKo
                ? "국내 아마추어 아이스하키 정보는 여러 메신저와 커뮤니티에 흩어져 있습니다. 선수는 참가할 경기를 찾기 어렵고, 운영진은 일정·명단·모집 공지를 반복해서 정리해야 합니다. 파워플레이는 이 과정을 하나의 연결된 흐름으로 바꿉니다."
                : "Amateur ice hockey information in Korea is scattered across messaging apps and community channels. Players struggle to find games, while organizers repeatedly manage schedules, rosters, and recruitment notices. PowerPlay brings those workflows together."}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {isKo ? "현재 제공하는 것" : "What we provide today"}
            </h2>
            <ul className="mt-4 space-y-3 text-zinc-600 dark:text-zinc-300">
              <li className="flex gap-3">
                <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>{isKo ? "경기 일정과 게스트 모집 정보" : "Game schedules and guest-player recruitment"}</span>
              </li>
              <li className="flex gap-3">
                <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>{isKo ? "전국 동호회와 링크장 탐색" : "Club and ice-rink discovery across Korea"}</span>
              </li>
              <li className="flex gap-3">
                <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>{isKo ? "한국어와 영어를 지원하는 운영 도구" : "Organizer tools with Korean and English support"}</span>
              </li>
            </ul>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 py-10">
          <div className="rounded-2xl bg-zinc-950 px-6 py-8 text-white dark:bg-white dark:text-zinc-950 sm:px-8">
            <p className="text-sm font-semibold text-blue-300 dark:text-blue-700">
              {isKo ? "문의" : "Contact"}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {isKo ? "파워플레이와 이야기해 보세요" : "Talk to PowerPlay"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 dark:text-zinc-600">
              {isKo
                ? "서비스, 파트너십 또는 회사 관련 문의는 창업자 이메일로 보내주세요."
                : "For product, partnership, or company inquiries, contact the founder directly."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {contactEmail}
              </a>
              <Link
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold transition-colors hover:bg-zinc-900 dark:border-zinc-300 dark:hover:bg-zinc-100"
              >
                Instagram @powerplay.kr
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
