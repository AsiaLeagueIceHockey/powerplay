import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAdminClubs, getPendingMembers } from "@/app/actions/clubs";
import Link from "next/link";
import { AdminClubCard } from "@/components/admin-club-card";

export default async function AdminClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const clubs = await getAdminClubs();

  // Fetch pending members for each club
  const clubsWithPending = await Promise.all(
    clubs.map(async (club) => {
      const pendingMembers = await getPendingMembers(club.id);
      return { club, pendingMembers };
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🏒 {t("admin.clubs.title")}</h1>
        <Link
          href={`/${locale}/admin/clubs/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + {t("admin.clubs.create")}
        </Link>
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
          {clubsWithPending.map(({ club, pendingMembers }) => (
            <AdminClubCard key={club.id} club={club} pendingMembers={pendingMembers} />
          ))}
        </div>
      )}
    </div>
  );
}
