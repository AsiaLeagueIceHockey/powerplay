import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser, getProfile } from "@/app/actions/auth";
import { getClubs } from "@/app/actions/clubs";
import { ProfileEditor } from "@/components/profile-editor";
import { MypageSubpageHeader } from "@/components/mypage-subpage-header";

export default async function MypageProfilePage() {
  const [profile, user, locale] = await Promise.all([getProfile(), getUser(), getLocale()]);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [t, clubsData] = await Promise.all([getTranslations(), getClubs()]);
  const clubs = clubsData.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="container mx-auto max-w-2xl px-4">
      <MypageSubpageHeader
        locale={locale}
        title={t("mypage.subpageTitle.profile")}
        backLabel={t("mypage.back")}
      />
      <ProfileEditor
        initialBio={profile?.bio || null}
        hockeyStartDate={profile?.hockey_start_date || null}
        primaryClubId={profile?.primary_club_id || null}
        detailedPositions={profile?.detailed_positions || null}
        stickDirection={profile?.stick_direction || null}
        phone={profile?.phone || null}
        fullName={profile?.full_name || null}
        clubs={clubs}
        cardIssuedAt={profile?.card_issued_at || null}
        updatedAt={profile?.updated_at || null}
      />
    </div>
  );
}
