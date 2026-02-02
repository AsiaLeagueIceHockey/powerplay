import { setRequestLocale } from "next-intl/server";
import { ClubForm } from "@/components/club-form";
import { getRinks } from "@/app/actions/rink";
import Link from "next/link";

export default async function NewClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rinks = await getRinks();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/clubs`}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← 목록으로
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">🏒 새 동호회 등록</h1>

      <ClubForm locale={locale} allRinks={rinks} />
    </div>
  );
}
