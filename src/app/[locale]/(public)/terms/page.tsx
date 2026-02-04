import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile.terms");

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
          
          <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">개인정보 처리방침 (Privacy Policy)</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t("privacyPolicySummary")}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">이용약관 (Terms of Service)</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t("termsFullText")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
