import { setRequestLocale, getTranslations } from "next-intl/server";
import { getRinks } from "@/app/actions/admin";
import { getClubs, getMyClubs } from "@/app/actions/clubs";
import { getAdminInfo } from "@/app/actions/admin-check";
import { MatchForm } from "@/components/match-form";
import type { Club } from "@/app/actions/types";
import Link from "next/link";

export default async function NewMatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, rinks, adminInfo] = await Promise.all([
    getTranslations(),
    getRinks(),
    getAdminInfo(),
  ]);

  let clubs: Club[] = [];
  if (adminInfo.isSuperuser) {
    // superuser는 전체 동호회 목록 표시
    clubs = await getClubs();
  } else {
    // admin은 본인이 속한 동호회만 표시
    const myClubs = await getMyClubs();
    clubs = myClubs
      .filter((m) => m.club != null)
      .map((m) => ({ id: m.club!.id, name: m.club!.name }) as Club);
  }

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

