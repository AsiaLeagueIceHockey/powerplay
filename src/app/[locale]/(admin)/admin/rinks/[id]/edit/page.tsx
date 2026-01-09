import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getRink } from "@/app/actions/admin";
import { RinkForm } from "@/components/rink-form";
import Link from "next/link";

export default async function EditRinkPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const rink = await getRink(id);

  if (!rink) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/rinks`}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← 목록으로
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">🏟️ 링크 수정</h1>

      <RinkForm locale={locale} rink={rink} />
    </div>
  );
}
