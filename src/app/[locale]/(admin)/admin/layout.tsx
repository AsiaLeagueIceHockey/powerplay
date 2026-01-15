import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminUserMenu } from "@/components/admin-user-menu";

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
  const [, { data: { user } }] = await Promise.all([
    getTranslations("admin"),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="text-lg font-bold">🏒 파워플레이 관리자</span>
        <AdminUserMenu user={user} locale={locale} />
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 md:block md:min-h-screen">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xl font-bold">🏒 파워플레이 관리자</span>
          </div>
          <nav className="space-y-1">
            <Link
              href={`/${locale}/admin/matches`}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              🏒 경기 관리
            </Link>
            <Link
              href={`/${locale}/admin/clubs`}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              👥 동호회 관리
            </Link>
            <Link
              href={`/${locale}/admin/rinks`}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              🏟️ 링크 관리
            </Link>
          </nav>
          
          {/* User Menu at bottom of sidebar */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="border-t border-zinc-800 pt-4">
              <AdminUserMenu user={user} locale={locale} position="bottom" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-zinc-800 bg-zinc-950 py-2 md:hidden">
        <Link
          href={`/${locale}/admin/matches`}
          className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 hover:text-white"
        >
          <span className="text-xl">🏒</span>
          <span className="text-xs">경기</span>
        </Link>
        <Link
          href={`/${locale}/admin/clubs`}
          className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 hover:text-white"
        >
          <span className="text-xl">👥</span>
          <span className="text-xs">동호회</span>
        </Link>
        <Link
          href={`/${locale}/admin/rinks`}
          className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 hover:text-white"
        >
          <span className="text-xl">🏟️</span>
          <span className="text-xs">링크</span>
        </Link>
      </nav>
    </div>
  );
}
