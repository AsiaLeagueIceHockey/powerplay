import { getClub } from "@/app/actions/clubs";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import ClubCardClient from "./page.client";

export default async function ClubCardPage({
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

  return <ClubCardClient club={club} />;
}
