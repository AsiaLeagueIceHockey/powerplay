import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Redirect to matches page - dashboard is not needed
  redirect(`/${locale}/admin/matches`);
}
