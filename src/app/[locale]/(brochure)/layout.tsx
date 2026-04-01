import { setRequestLocale } from "next-intl/server";

export default async function BrochureLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <main className="min-h-screen">{children}</main>;
}
