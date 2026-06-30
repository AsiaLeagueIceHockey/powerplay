import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getUser, getProfile } from "@/app/actions/auth";
import { getClubs } from "@/app/actions/clubs";
import PlayerCardClient from "./page.client";

export default async function PlayerCardPage() {
  const user = await getUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const profile = await getProfile();
  
  if (!profile) {
    redirect(`/${locale}/mypage`);
  }

  // If the user hasn't issued a card yet, redirect back
  if (!profile.card_issued_at) {
    redirect(`/${locale}/mypage`);
  }

  const clubsData = await getClubs();
  const primaryClub = clubsData.find(c => c.id === profile.primary_club_id);

  let logoBase64 = null;
  if (primaryClub?.logo_url) {
    try {
      const res = await fetch(primaryClub.logo_url);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = res.headers.get("content-type") || "image/png";
        logoBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    } catch (err) {
      console.error("Failed to fetch club logo for card", err);
    }
  }

  // We pass the data directly to the client component instead of using an API route
  const cardData = {
    profile: {
      full_name: profile.full_name || user.email?.split("@")[0] || "Player",
      card_serial_number: profile.card_serial_number || 0,
      card_issued_at: profile.card_issued_at,
      hockey_start_date: profile.hockey_start_date,
      stick_direction: profile.stick_direction || "RIGHT",
      primary_club_id: profile.primary_club_id,
      position: profile.position,
      detailed_positions: profile.detailed_positions,
    },
    club: primaryClub ? {
      name: primaryClub.name,
      logo_url: primaryClub.logo_url || null,
      logo_base64: logoBase64
    } : null
  };

  return <PlayerCardClient initialData={cardData} />;
}
