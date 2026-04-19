import { setRequestLocale } from "next-intl/server";
import { getAvailableRegions } from "@/app/actions/find-club";
import { FindClubWizard } from "@/components/find-club-wizard";
import { Metadata } from "next";

const siteUrl = "https://powerplay.kr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  return {
    title: isKo
      ? "나에게 맞는 하키클럽 찾기 | 파워플레이"
      : "Find Your Hockey Club | PowerPlay",
    description: isKo
      ? "4가지 질문으로 나에게 딱 맞는 아이스하키 동호회를 추천받아 보세요."
      : "Answer 4 questions and get personalized ice hockey club recommendations.",
    openGraph: {
      title: isKo
        ? "나에게 맞는 하키클럽 찾기"
        : "Find Your Hockey Club",
      description: isKo
        ? "4가지 질문으로 나에게 딱 맞는 아이스하키 동호회를 추천받아 보세요."
        : "Answer 4 questions and get personalized ice hockey club recommendations.",
      url: `${siteUrl}/${locale}/find-club`,
      images: [{ url: `${siteUrl}/og-new.png`, width: 1200, height: 630 }],
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/find-club`,
      languages: {
        ko: `${siteUrl}/ko/find-club`,
        en: `${siteUrl}/en/find-club`,
      },
    },
  };
}

export default async function FindClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const regions = await getAvailableRegions();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
          {locale === "ko"
            ? "나에게 맞는 하키클럽 찾기"
            : "Find Your Hockey Club"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          {locale === "ko"
            ? "4가지 질문으로 딱 맞는 클럽을 추천해드려요"
            : "Get personalized recommendations with 4 simple questions"}
        </p>
      </div>

      {/* Wizard */}
      <FindClubWizard regions={regions} />
    </div>
  );
}
