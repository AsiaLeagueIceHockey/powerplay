import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Club } from "@/app/actions/types";
import { getKstMonthKey } from "@/lib/club-voting";
import { getClubRankingForMonth } from "@/lib/instagram/club-ranking-data";

export const metadata: Metadata = {
  title: "PowerPlay - Instagram Club Ranking Capture",
  robots: {
    index: false,
    follow: false,
  },
};

const RANK_MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
  4: "🏅",
  5: "🏅",
};

interface SlotProps {
  position: number;
  club: Club | null;
  voteCountLabel: (count: number) => string;
  tieBadgeLabel: string;
  rankPrefixLabel: (rank: number) => string;
  emptyClubLabel: string;
}

function ClubRankSlot({
  position,
  club,
  voteCountLabel,
  tieBadgeLabel,
  rankPrefixLabel,
  emptyClubLabel,
}: SlotProps) {
  const medal = RANK_MEDALS[position] ?? "🏅";
  const rank = club?.monthly_rank ?? position;
  const tied = Boolean(club?.monthly_rank_tied);
  const voteCount = club?.monthly_vote_count ?? 0;

  return (
    <div className="w-full flex items-center gap-8 rounded-3xl border border-zinc-100 bg-white px-10 py-8 shadow-sm">
      <div className="flex flex-col items-center justify-center w-32 flex-none">
        <span className="text-6xl leading-none">{medal}</span>
        <span className="mt-3 text-3xl font-black text-[#172554] tracking-tight">
          {tied ? rankPrefixLabel(rank) : `${rank}위`}
        </span>
      </div>

      <div className="flex items-center justify-center w-28 h-28 flex-none rounded-full bg-zinc-100 overflow-hidden">
        {club?.logo_url ? (
          // 외부 URL 일 수 있어 일반 img 사용 (matches 페이지 동일 정책)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={club.logo_url}
            alt={club.name}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <span className="text-3xl text-zinc-300">·</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-[44px] font-black text-[#172554] tracking-tight truncate">
          {club?.name ?? emptyClubLabel}
        </h3>
        <p className="mt-2 text-2xl font-semibold text-zinc-500 tracking-tight">
          {voteCountLabel(voteCount)}
        </p>
      </div>

      {tied ? (
        <div className="flex-none rounded-full bg-zinc-100 px-5 py-2 text-xl font-bold text-zinc-500 tracking-tight">
          {tieBadgeLabel}
        </div>
      ) : null}
    </div>
  );
}

async function ClubRankingStoryContent({
  locale,
  monthKst,
}: {
  locale: string;
  monthKst: string;
}) {
  const t = await getTranslations({
    locale,
    namespace: "instagram.clubRanking",
  });
  const { rankedClubs, monthLabel } = await getClubRankingForMonth(monthKst);

  // 5 슬롯 고정 (빈 자리는 placeholder)
  const slots: (Club | null)[] = Array.from(
    { length: 5 },
    (_, idx) => rankedClubs[idx] ?? null
  );

  const totalVotes = rankedClubs.reduce(
    (acc, club) => acc + (club.monthly_vote_count ?? 0),
    0
  );
  const isEmpty = totalVotes === 0;

  return (
    <div
      className="flex flex-col bg-[#ffffff] text-[#172554] relative items-center justify-start overflow-hidden mx-auto font-sans"
      style={{
        width: "1080px",
        height: "1920px",
        padding: "100px 70px",
      }}
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-[#172554]" />

      {/* Header */}
      <div className="w-full flex-none mb-12 z-10 flex flex-col items-center">
        <div className="flex items-center justify-center mb-6">
          <Image
            src="/long-logo.jpg"
            alt="PowerPlay Logo"
            width={380}
            height={130}
            className="h-24 w-auto object-contain"
            priority
          />
        </div>

        <h2 className="text-[54px] font-black text-[#172554] tracking-tight leading-tight text-center">
          {t("headerTitle", { month: monthLabel })}
        </h2>

        {isEmpty ? (
          <div className="mt-8 rounded-full bg-zinc-50 border border-zinc-100 px-8 py-3 text-2xl font-semibold text-zinc-400 tracking-tight">
            {t("emptyState")}
          </div>
        ) : null}
      </div>

      {/* Ranking slots */}
      <div className="w-full flex flex-col gap-6 z-10 flex-1 justify-center">
        {slots.map((club, index) => (
          <ClubRankSlot
            key={club?.id ?? `slot-${index}`}
            position={index + 1}
            club={club}
            voteCountLabel={(count) => t("voteCount", { count })}
            tieBadgeLabel={t("tieBadge")}
            rankPrefixLabel={(rank) => t("tiedRank", { rank })}
            emptyClubLabel={t("emptySlot")}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="w-full flex-none mt-12 z-10 flex flex-col items-center gap-4">
        <p className="text-2xl font-semibold text-zinc-500 tracking-tight">
          {t("footerTagline")}
        </p>
        <div className="flex items-center gap-3 bg-[#172554] px-8 py-4 rounded-full shadow-lg border border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-2xl font-bold text-white tracking-tight">
            {t("footerSite")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function InstagramClubRankingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month } = await searchParams;

  setRequestLocale(locale);

  // 잘못된 형식이면 silent fallback (오케스트레이터 결정)
  const monthKst =
    month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
      ? month
      : getKstMonthKey(new Date());

  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-white flex items-center justify-center text-[#172554] text-3xl font-bold">
          Loading…
        </div>
      }
    >
      <ClubRankingStoryContent locale={locale} monthKst={monthKst} />
    </Suspense>
  );
}
