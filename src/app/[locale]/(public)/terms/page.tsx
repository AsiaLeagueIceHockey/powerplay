import { getTranslations, setRequestLocale } from "next-intl/server";
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
    title: isKo ? "이용약관" : "Terms of Service",
    description: isKo
      ? "파워플레이 이용약관"
      : "PowerPlay Terms of Service",
    alternates: {
      canonical: `${siteUrl}/${locale}/terms`,
      languages: {
        ko: `${siteUrl}/ko/terms`,
        en: `${siteUrl}/en/terms`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile.terms");
  const isKo = locale === "ko";

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-3 text-zinc-900 dark:text-zinc-100">
            {isKo ? "이용약관" : "Terms of Service"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isKo
              ? "파워플레이 서비스 이용에 필요한 기본 약관을 안내합니다."
              : "This page explains the terms that apply to the use of PowerPlay."}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800">
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t("termsFullText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
