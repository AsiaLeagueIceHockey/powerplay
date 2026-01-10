import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Geist, Geist_Mono } from "next/font/google";
import { Metadata } from "next";
import { ScrollToTop } from "@/components/scroll-to-top";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pphockey.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = locale === "ko" ? "파워플레이 - 아이스하키 경기 매칭" : "Power Play - Ice Hockey Match Management";
  const description =
    locale === "ko"
      ? "아이스하키 동호회 경기 운영 및 게스트 매칭 관리 플랫폼"
      : "Ice hockey club match management and player matching platform";

  return {
    title: {
      default: title,
      template: `%s | ${locale === "ko" ? "파워플레이" : "Power Play"}`,
    },
    description,
    metadataBase: new URL(siteUrl),
    icons: {
      icon: "/favicon.png",
      apple: "/favicon.png",
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: "Power Play",
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Power Play - Ice Hockey Match Management",
        },
      ],
      locale: locale === "ko" ? "ko_KR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}
      >
        <NextIntlClientProvider messages={messages}>
          <ScrollToTop />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
