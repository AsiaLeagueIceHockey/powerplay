import { useTranslations } from "next-intl";
import { TamagotchiAvatar } from "@/components/tamagotchi-avatar";
import type { ClubPlayer } from "@/app/actions/clubs";
import type { TamagotchiPetColors } from "@/lib/tamagotchi-types";

interface ClubPlayersGalleryProps {
  players: ClubPlayer[];
  clubLogoUrl?: string | null;
  /** Translations namespace; defaults to "clubs.players". */
  namespace?: string;
}

export function ClubPlayersGallery({
  players,
  clubLogoUrl,
  namespace = "clubs.players",
}: ClubPlayersGalleryProps) {
  const t = useTranslations(namespace);

  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {t("empty")}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          {t("heading")}
        </h2>
        <span className="flex-shrink-0 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {t("count", { count: players.length })}
        </span>
      </header>

      <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
        {players.map((player) => {
          const colors: TamagotchiPetColors = {
            helmet: player.pet.helmetColor,
            jersey: player.pet.jerseyColor,
            skate: player.pet.skateColor,
          };
          // 이 클럽 갤러리이므로, uniform_club_id가 본 클럽이면 로고 노출
          const showLogo = player.pet.uniformClubId !== null && clubLogoUrl;
          return (
            <li
              key={player.userId}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-sky-200/60 bg-sky-50/40 p-2 dark:border-sky-900/50 dark:bg-sky-950/20">
                <TamagotchiAvatar
                  size={80}
                  colors={colors}
                  alt={player.fullName ?? ""}
                  clubLogoUrl={showLogo ? clubLogoUrl : null}
                />
              </div>
              <p className="w-full truncate text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {player.fullName ?? "—"}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
