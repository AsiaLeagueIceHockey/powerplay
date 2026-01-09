import { setRequestLocale } from "next-intl/server";
import { RinkForm } from "@/components/rink-form";
import Link from "next/link";

export default async function NewRinkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

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

      <h1 className="text-2xl font-bold mb-6">🏟️ 새 링크 추가</h1>

      <RinkForm locale={locale} />
    </div>
  );
}
