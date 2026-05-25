import { Suspense } from "react";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { UserHeaderSkeleton } from "@/components/skeletons";
import { UserHeaderLoader } from "@/components/user-header-loader";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { BrandLogo } from "@/components/brand-logo";

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
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <BrandLogo locale={locale} />
          </div>

          {/* User Menu - Right (Suspense Streaming) */}
          <div className="flex-shrink-0">
            <Suspense fallback={<UserHeaderSkeleton />}>
              <UserHeaderLoader locale={locale} />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">{children}</main>

      {/* Bottom Navigation */}
      <BottomNav locale={locale} />
    </div>
  );
}
