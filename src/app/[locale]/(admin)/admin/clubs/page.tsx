import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAdminClubs } from "@/app/actions/clubs";
import { getAdminInfo } from "@/app/actions/admin-check";
import Link from "next/link";
import { AdminClubCard } from "@/components/admin-club-card";

export default async function AdminClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, clubs, adminInfo] = await Promise.all([
    getTranslations(),
    getAdminClubs(),
    getAdminInfo(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.clubs.title")}</h1>
        <Link
          href={`/${locale}/admin/clubs/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + {t("admin.clubs.create")}
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-50">
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2 whitespace-nowrap text-[clamp(8px,2.55vw,14px)] leading-none tracking-tight">
            <span className="text-amber-300">•</span>
            <span>{t("admin.clubs.noticeLine1")}</span>
          </li>
          <li className="flex items-center gap-2 whitespace-nowrap text-[clamp(8px,2.55vw,14px)] leading-none tracking-tight">
            <span className="text-amber-300">•</span>
            <span>{t("admin.clubs.noticeLine2")}</span>
          </li>
        </ul>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800 rounded-lg">
          <p className="text-zinc-400">{t("admin.clubs.noClubs")}</p>
          <Link
            href={`/${locale}/admin/clubs/new`}
            className="mt-4 inline-block text-blue-400 hover:underline"
          >
            {t("admin.clubs.createFirst")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => (
            <AdminClubCard key={club.id} club={club} canDelete={adminInfo.isSuperuser} />
          ))}
        </div>
      )}
    </div>
  );
}
