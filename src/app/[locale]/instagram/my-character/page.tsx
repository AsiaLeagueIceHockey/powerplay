import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getUser } from "@/app/actions/auth";
import { getTamagotchiState } from "@/app/actions/tamagotchi";
import { TamagotchiAvatar } from "@/components/tamagotchi-avatar";

export const metadata = {
  title: "PowerPlay - My Character",
  robots: { index: false, follow: false },
};

export default async function InstagramMyCharacterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [t, state] = await Promise.all([
    getTranslations(),
    getTamagotchiState(locale),
  ]);

  if (!state) {
    redirect(`/${locale}/mypage`);
  }

  const clubLogoUrl = state.pet.uniformClub?.logoUrl ?? null;
  const clubName = state.pet.uniformClub?.name ?? null;

  return (
    <div
      className="relative mx-auto flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-violet-50 font-sans"
      style={{ width: "1080px", height: "1080px", padding: "60px" }}
    >
      {/* Logo */}
      <div className="absolute left-0 top-0 flex w-full justify-center pt-10">
        <Image
          src="/long-logo.jpg"
          alt="PowerPlay"
          width={260}
          height={88}
          className="h-16 w-auto object-contain"
          priority
        />
      </div>

      {/* Avatar */}
      <div className="flex aspect-square w-[640px] items-center justify-center rounded-[48px] border border-sky-200/80 bg-white/80 shadow-sm">
        <TamagotchiAvatar
          size={520}
          colors={state.pet.colors}
          alt={state.displayName}
          clubLogoUrl={clubLogoUrl}
          priority
        />
      </div>

      {/* Name + Club */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <h1 className="text-[80px] font-black leading-none text-[#172554] tracking-tight">
          {state.displayName}
        </h1>
        {clubName ? (
          <p className="text-[28px] font-bold text-[#2563eb]">{clubName}</p>
        ) : null}
        <p className="mt-2 text-[24px] font-medium text-zinc-500">
          {t("instagramCharacter.tagline")}
        </p>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-10 left-0 flex w-full justify-center">
        <div className="flex items-center gap-3 rounded-full bg-[#172554] px-7 py-3 shadow-lg">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          <span className="text-[24px] font-bold tracking-tight text-white">
            @{t("instagramCharacter.watermark")}
          </span>
        </div>
      </div>
    </div>
  );
}
