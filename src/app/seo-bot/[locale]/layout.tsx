import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

export default async function SeoBotLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isKo = locale === "ko";

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
              <Link
                href={`/${locale}`}
                className="flex items-center flex-shrink-0"
                style={{ marginTop: "5px" }}
              >
                <Image
                  src="/long-logo.jpg"
                  alt="PowerPlay"
                  width={146}
                  height={50}
                  className="h-10 w-auto object-contain rounded-sm dark:hidden"
                  priority
                />
                <Image
                  src="/long-logo-darkmode.png"
                  alt="PowerPlay"
                  width={146}
                  height={50}
                  className="hidden h-10 w-auto object-contain rounded-sm dark:block"
                  priority
                />
              </Link>
              <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                <Link
                  href={`/${locale}/clubs`}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {isKo ? "동호회" : "Clubs"}
                </Link>
                <Link
                  href={`/${locale}/rinks`}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {isKo ? "링크장" : "Rinks"}
                </Link>
                <Link
                  href={`/${locale}/lounge`}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {isKo ? "라운지" : "Lounge"}
                </Link>
                <Link
                  href={`/${locale}/find-club`}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {isKo ? "동호회 찾기" : "Find Club"}
                </Link>
              </nav>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8 pb-24">{children}</main>

          <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6">
            <div className="container mx-auto px-4 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
              <p>
                {isKo
                  ? "파워플레이 — 한국 아이스하키 커뮤니티 플랫폼"
                  : "PowerPlay — Korea's Ice Hockey Community Platform"}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href={`/${locale}/privacy`}
                  className="hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  {isKo ? "개인정보처리방침" : "Privacy"}
                </Link>
                <span aria-hidden="true">|</span>
                <Link
                  href={`/${locale}/terms`}
                  className="hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  {isKo ? "이용약관" : "Terms"}
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
