import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { UserHeaderSkeleton } from "@/components/skeletons";
import { UserHeaderLoader } from "@/components/user-header-loader";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // 병렬 데이터 페칭 - User 정보는 이제 Suspense로 처리하므로 여기서 기다리지 않음
  // const supabase = await createClient();
  // const [, { data: { user } }] = await Promise.all([
  //   getTranslations("common"),
  //   supabase.auth.getUser(),
  // ]);

  return (
    <div className="min-h-screen">
      {/* Header / GNB */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-2">
          {/* Logo - Left */}
          <a href={`/${locale}`} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-bold tracking-tight">
              🏒 Power Play
            </span>
          </a>

          {/* User Menu - Right (Suspense Streaming) */}
          <Suspense fallback={<UserHeaderSkeleton />}>
            <UserHeaderLoader locale={locale} />
          </Suspense>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>

      {/* Bottom Navigation */}
      <BottomNav locale={locale} />
    </div>
  );
}


