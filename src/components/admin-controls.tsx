import { checkIsAdmin } from "@/app/actions/admin-check";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function AdminControls({
  matchId,
  locale,
}: {
  matchId: string;
  locale: string;
}) {
  const isAdmin = await checkIsAdmin();
  const t = await getTranslations(); // Assuming 'common' or similar, but simplified

  if (!isAdmin) return null;

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3 flex justify-between items-center border border-dashed border-zinc-300 dark:border-zinc-700 mb-6">
      <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
        🔒 {locale === "ko" ? "관리자 전용" : "Admin Only"}
      </span>
      <Link
        href={`/${locale}/admin/matches/${matchId}/edit`}
        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition"
      >
        ✏️ {locale === "ko" ? "수정" : "Edit"}
      </Link>
    </div>
  );
}
