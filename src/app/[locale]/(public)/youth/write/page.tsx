import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyParentApplication } from "@/app/actions/parent";
import { generateRandomNickname } from "@/lib/nickname";
import { YouthWriteClient } from "@/components/youth-write-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "youth" });
  return {
    title: `${t("writePost") || "글쓰기"} | PowerPlay`,
  };
}

export default async function YouthWritePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/youth/write`);
  }

  // Fetch profile to verify authorization
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, parent_verification_status, full_name, parent_nickname")
    .eq("id", user.id)
    .single();

  const isApproved = profile?.parent_verification_status === "approved";
  const isAdmin = ["admin", "superuser"].includes(profile?.role ?? "");

  if (!isApproved && !isAdmin) {
    redirect(`/${locale}/youth`);
  }

  if (profile && !profile.parent_nickname) {
    const newNickname = generateRandomNickname();
    await supabase
      .from("profiles")
      .update({ parent_nickname: newNickname })
      .eq("id", user.id);
    profile.parent_nickname = newNickname;
  }

  const myApplication = await getMyParentApplication();

  return (
    <YouthWriteClient
      locale={locale}
      user={user}
      userProfile={profile}
      myApplication={myApplication}
    />
  );
}
