import { setRequestLocale, getTranslations } from "next-intl/server";
import { getRinks } from "@/app/actions/admin";
import { getClubs } from "@/app/actions/clubs";
import { MatchForm } from "@/components/match-form";
import Link from "next/link";

export default async function NewMatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const [t, rinks, clubs] = await Promise.all([
    getTranslations(),
    getRinks(),
    getClubs(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/matches`}
          className="text-sm text-gray-600 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← {t("admin.matches.backToList")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">{t("admin.matches.createNew")}</h1>

      <MatchForm rinks={rinks} clubs={clubs} />
    </div>
  );
}

