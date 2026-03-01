import { setRequestLocale, getTranslations } from "next-intl/server";
import { getRinks } from "@/app/actions/admin";
import { getClubs, getMyClubs } from "@/app/actions/clubs";
import { getAdminInfo } from "@/app/actions/admin-check";
import { BulkMatchForm } from "@/components/bulk-match-form";
import type { Club } from "@/app/actions/types";
import Link from "next/link";

export default async function BulkMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month } = await searchParams;
  setRequestLocale(locale);

  const [t, rinks, adminInfo] = await Promise.all([
    getTranslations(),
    getRinks(),
    getAdminInfo(),
  ]);

  let clubs: Club[] = [];
  if (adminInfo.isSuperuser) {
    clubs = await getClubs();
  } else {
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
          ← {t("admin.bulk.backToList")}
        </Link>
      </div>

      <BulkMatchForm rinks={rinks} clubs={clubs} initialMonth={month} />
    </div>
  );
}
