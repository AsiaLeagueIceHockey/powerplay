import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Building2 } from "lucide-react";
import { getUser } from "@/app/actions/auth";
import { getMyClubs } from "@/app/actions/clubs";
import { MypageSubpageHeader } from "@/components/mypage-subpage-header";
import { MyClubLeaveButton } from "@/components/my-club-leave-button";

export default async function MypageClubsPage() {
  const [user, locale] = await Promise.all([getUser(), getLocale()]);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [t, memberships] = await Promise.all([getTranslations(), getMyClubs()]);

  return (
    <div className="container mx-auto max-w-2xl px-4">
      <MypageSubpageHeader
        locale={locale}
        title={t("mypage.subpageTitle.clubs")}
        backLabel={t("mypage.back")}
      />

      {memberships.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {t("mypage.clubs.empty")}
          </p>
          <Link
            href={`/${locale}/clubs`}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            {t("mypage.clubs.browseCta")}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {memberships.map((m) => (
            <li key={m.id} className="flex items-center gap-4 px-5 py-4">
              <Link
                href={`/${locale}/clubs/${m.club_id}`}
                className="flex flex-1 items-center gap-3 min-w-0"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-50 dark:bg-sky-950/40">
                  {m.club?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.club.logo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-zinc-900 dark:text-white">
                    {m.club?.name ?? "—"}
                  </span>
                  {m.role === "admin" && (
                    <span className="block truncate text-xs text-blue-600 dark:text-blue-400">
                      admin
                    </span>
                  )}
                </span>
              </Link>
              <MyClubLeaveButton
                clubId={m.club_id}
                confirmLabel={t("mypage.clubs.leaveConfirm")}
                leaveLabel={t("mypage.clubs.leaveCta")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
