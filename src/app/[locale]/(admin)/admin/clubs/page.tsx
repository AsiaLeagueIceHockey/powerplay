import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAdminClubs } from "@/app/actions/clubs";
import Link from "next/link";
import { Users, MessageCircle } from "lucide-react";

export default async function AdminClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const clubs = await getAdminClubs();

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
          {clubs.map((club) => (
            <div
              key={club.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-zinc-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-lg">{club.name}</div>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {t("admin.clubs.members", { count: club.member_count || 0 })}
                  </span>
                  {club.kakao_open_chat_url && (
                    <a
                      href={club.kakao_open_chat_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-yellow-400 hover:underline"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t("admin.clubs.openChat")}
                    </a>
                  )}
                </div>
              </div>
              <Link
                href={`/${locale}/admin/clubs/${club.id}/edit`}
                className="text-sm text-blue-400 hover:underline"
              >
                {t("admin.clubs.edit")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
