import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { getRink } from "@/app/actions/admin";
import { RinkForm } from "@/components/rink-form";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function EditRinkPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    redirect(`/${locale}/admin/rinks`);
  }

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
