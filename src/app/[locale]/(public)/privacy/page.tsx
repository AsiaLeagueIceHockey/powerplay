import { surfaceStyles } from "@/components/ui/styles";
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
    title: isKo ? "개인정보 처리방침" : "Privacy Policy",
    description: isKo
      ? "파워플레이 개인정보 처리방침"
      : "PowerPlay Privacy Policy",
    alternates: {
      canonical: `${siteUrl}/${locale}/privacy`,
      languages: {
        ko: `${siteUrl}/ko/privacy`,
        en: `${siteUrl}/en/privacy`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage({
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
          <h1 className="text-3xl font-bold mb-3 text-pp-text ">
            {isKo ? "개인정보 처리방침" : "Privacy Policy"}
          </h1>
          <p className="text-sm text-pp-muted ">
            {isKo
              ? "파워플레이 서비스 이용 과정에서 수집되는 개인정보의 처리 방침을 안내합니다."
              : "This page explains how PowerPlay collects, uses, and retains personal information."}
          </p>
        </div>

        <div className={surfaceStyles({ density: "roomy" }) + " "}>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm text-pp-muted leading-relaxed">
              {t("privacyPolicySummary")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
