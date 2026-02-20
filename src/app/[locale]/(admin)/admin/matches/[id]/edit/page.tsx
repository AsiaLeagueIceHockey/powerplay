import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { getMatch } from "@/app/actions/match";
import { getRinks } from "@/app/actions/admin";
import { getAdminInfo } from "@/app/actions/admin-check";
import { getClubs, getMyClubs } from "@/app/actions/clubs";
import { MatchEditForm } from "@/components/match-edit-form";
import type { Club } from "@/app/actions/types";
import Link from "next/link";

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, match, rinks, adminInfo] = await Promise.all([
    getTranslations(),
    getMatch(id),
    getRinks(),
    getAdminInfo(),
  ]);

  if (!match) {
    notFound();
  }

  // Fetch clubs based on role (same pattern as new match page)
  let clubs: Club[] = [];
  if (adminInfo.isSuperuser) {
    clubs = await getClubs();
  } else {
    const myClubs = await getMyClubs();
    clubs = myClubs
      .filter((m) => m.club != null)
      .map((m) => ({ id: m.club!.id, name: m.club!.name }) as Club);
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
    description: match.description || null,
  };

  // Check if any participant (active) has opted in for rental
  const hasRentalParticipants = participantsForList.some(
    (p) => p.rental_opt_in === true
  );

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
          <MatchEditForm
            match={matchForForm}
            rinks={rinks}
            clubs={clubs}
            hasRentalParticipants={hasRentalParticipants}
          />
        </div>
      </div>
    </div>
  );
}
