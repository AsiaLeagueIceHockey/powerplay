import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AdminSuperuserMenu } from "@/components/admin-superuser-menu";
import { AdminUserMenu } from "@/components/admin-user-menu";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 병렬 데이터 페칭
  const supabase = await createClient();
  const [t, { data: { user } }] = await Promise.all([
    getTranslations("admin"),
    supabase.auth.getUser(),
  ]);

  // Check if user is superuser
  let isSuperUser = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isSuperUser = profile?.role === "superuser";
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-black px-4 py-3 md:hidden">
        <div className="flex items-center gap-1">
          <Image
            src="/long-logo-darkmode.png"
            alt="PowerPlay"
            width={110}
            height={38}
            className="h-7 w-auto object-contain"
            quality={100}
          />
          <span className="text-sm font-medium" style={{ color: '#F4A261' }}>관리자</span>
        </div>
        <AdminUserMenu user={user} locale={locale} />
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 md:block md:min-h-screen">
          <div className="mb-8 flex items-center gap-1">
            <Image
              src="/long-logo-darkmode.png"
              alt="PowerPlay"
              width={130}
              height={44}
              className="h-8 w-auto object-contain"
              quality={100}
            />
            <span className="text-sm font-medium" style={{ color: '#F4A261' }}>관리자</span>
          </div>
          <nav className="space-y-1">
            <Link
              href={`/${locale}/admin/matches`}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              🏒 {t("menu.matches")}
            </Link>
            <Link
              href={`/${locale}/admin/clubs`}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              👥 {t("menu.clubs")}
            </Link>
            <Link
              href={`/${locale}/admin/rinks`}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              🏟️ {t("menu.rinks")}
            </Link>
            <Link
              href={`/${locale}/admin/lounge`}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <span className="text-base">🏆</span>
              <span>{locale === "ko" ? "라운지" : "Lounge"}</span>
            </Link>

            {/* SuperUser Only Menus */}
            {isSuperUser && (
              <>
                <div className="border-t border-zinc-800 my-3"></div>
                <div className="px-4 py-1 text-xs text-amber-500 font-medium uppercase">SuperUser</div>
                <Link
                  href={`/${locale}/admin/admins`}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  👥 {t("menu.userManagement")}
                </Link>
                <Link
                  href={`/${locale}/admin/points`}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  💰 {t("menu.pointManagement")}
                </Link>
                <Link
                  href={`/${locale}/admin/all-matches`}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  🌎 {t("menu.allMatches")}
                </Link>
                <Link
                  href={`/${locale}/admin/lounge-management`}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  🏆 {locale === "ko" ? "라운지 관리" : "Lounge admin"}
                </Link>
                <Link
                  href={`/${locale}/admin/push-test`}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  🔔 Push Test
                </Link>
                <Link
                  href={`/${locale}/admin/audit-logs`}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  📜 운영 로그
                </Link>
              </>
            )}
          </nav>

          {/* User Menu at bottom of sidebar */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="border-t border-zinc-800 pt-4">
              <AdminUserMenu user={user} locale={locale} position="bottom" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 pb-28 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-zinc-800 bg-zinc-950 py-2 pb-safe md:hidden">
        <Link
          href={`/${locale}/admin/matches`}
          className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 hover:text-white"
        >
          <span className="text-xl">🏒</span>
          <span className="text-xs">{t("menu.matchesShort")}</span>
        </Link>
        <Link
          href={`/${locale}/admin/clubs`}
          className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 hover:text-white"
        >
          <span className="text-xl">👥</span>
          <span className="text-xs">{t("menu.clubsShort")}</span>
        </Link>
        <Link
          href={`/${locale}/admin/rinks`}
          className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 hover:text-white"
        >
          <span className="text-xl">🏟️</span>
          <span className="text-xs">{t("menu.rinksShort")}</span>
        </Link>
        <Link
          href={`/${locale}/admin/lounge`}
          className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 hover:text-white"
        >
          <span className="text-xl">🏆</span>
          <span className="text-xs">{locale === "ko" ? "라운지" : "Lounge"}</span>
        </Link>
        {isSuperUser ? <AdminSuperuserMenu locale={locale} /> : null}
      </nav>
    </div>
  );
}
