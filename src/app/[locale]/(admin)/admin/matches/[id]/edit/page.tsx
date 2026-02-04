import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { getMatch } from "@/app/actions/match";
import { getRinks } from "@/app/actions/admin";
import { MatchEditForm } from "@/components/match-edit-form";
import Link from "next/link";

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const match = await getMatch(id);
  const rinks = await getRinks();

  if (!match) {
    notFound();
  }

  // Transform participants for list
  const participantsForList =
    match.participants?.filter((p) => p.status !== "canceled") || [];

  // Calculate counts for validation (Consolidated logic)
  const fwCount = participantsForList.filter(
    (p) =>
      p.position === "FW" && ["applied", "confirmed", "pending_payment"].includes(p.status)
  ).length;
  const dfCount = participantsForList.filter(
    (p) =>
      p.position === "DF" && ["applied", "confirmed", "pending_payment"].includes(p.status)
  ).length;
  const gCount = participantsForList.filter(
    (p) =>
      p.position === "G" && ["applied", "confirmed", "pending_payment"].includes(p.status)
  ).length;

  // Transform rink for form and inject accurate counts
  const matchForForm = {
    ...match,
    rink: match.rink
      ? {
          id: match.rink.id || "",
          name_ko: match.rink.name_ko,
          name_en: match.rink.name_en,
        }
      : null,
    participants_count: {
      fw: fwCount,
      df: dfCount,
      g: gCount,
    },
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/matches`}
          className="text-sm text-gray-600 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← {t("admin.matches.backToList")}
        </Link>
      </div>

      <div className="grid gap-8">
        {/* Edit Form */}
        <div>
          <h1 className="text-2xl font-bold mb-6">{t("admin.matches.edit")}</h1>
          <MatchEditForm match={matchForForm} rinks={rinks} />
        </div>
      </div>
    </div>
  );
}
