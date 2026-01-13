import { setRequestLocale } from "next-intl/server";
import { getClub } from "@/app/actions/clubs";
import { ClubForm } from "@/components/club-form";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditClubPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  
  const club = await getClub(id);
  
  if (!club) {
    notFound();
  }

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

      <h1 className="text-2xl font-bold mb-6">🏒 동호회 수정</h1>

      <ClubForm locale={locale} club={club} />
    </div>
  );
}
