import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProfile, getUser } from "@/app/actions/auth";
import { getClubs, getMyClubs } from "@/app/actions/clubs";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const [profile, clubs, myClubs] = await Promise.all([
    getProfile(),
    getClubs(),
    getMyClubs(),
  ]);

  // If already completed onboarding, redirect to home
  if (profile?.onboarding_completed) {
    redirect(`/${locale}`);
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <OnboardingForm 
        profile={profile} 
        clubs={clubs} 
        myClubs={myClubs}
        locale={locale} 
      />
    </div>
  );
}
