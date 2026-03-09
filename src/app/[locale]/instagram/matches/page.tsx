import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMatchesByDate } from "@/app/actions/instagram";
import { InstagramMatchCard } from "@/components/instagram-match-card";
import { Suspense } from "react";
import Image from "next/image";

export const metadata = {
  title: "PowerPlay - Instagram Capture",
  robots: {
    index: false,
    follow: false,
  },
};

// Next.js Server Component for rendering 9:16 Instagram Story
async function InstagramStoryContent({ locale, date, page = "1" }: { locale: string; date: string; page: string }) {
  const matches = await getMatchesByDate(date);
  const t = await getTranslations({ locale, namespace: "match" });

  const pageNum = parseInt(page, 10) || 1;
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(matches.length / ITEMS_PER_PAGE);
  
  // Slice matches for current page
  const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
  const pageMatches = matches.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Parse date for title
  const targetDate = new Date(date + "T00:00:00+09:00");
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  });
  const formattedDate = dateFormatter.format(targetDate);

  return (
    <div 
      className="flex flex-col bg-[#ffffff] text-[#172554] relative items-center justify-start overflow-hidden mx-auto font-sans"
      style={{
        width: "1080px",
        height: "1920px",
        padding: "100px 70px",
      }}
    >
      {/* Background is pure white now */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#172554]" />
      
      {/* Header */}
      <div className="w-full flex-none mb-16 z-10 flex flex-col items-center">
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

        <h2 className="text-[46px] font-black text-[#172554] tracking-tight leading-tight">
          {formattedDate} <span className="text-zinc-300 font-light mx-2">|</span> 경기 일정
        </h2>
        
        {totalPages > 1 && (
          <div className="mt-8 flex items-center gap-3 bg-zinc-50 px-6 py-2 rounded-full text-zinc-400 font-bold text-xl border border-zinc-100">
            <span className="text-sm uppercase tracking-widest opacity-60">Listing</span>
            <span className="text-[#172554]">{pageNum}</span>
            <span className="text-zinc-200">/</span>
            <span className="text-zinc-400">{totalPages}</span>
          </div>
        )}
      </div>

      {/* Matches List */}
      <div className="w-full flex flex-col gap-10 z-10 flex-1 justify-center">
        {pageMatches.length > 0 ? (
          pageMatches.map((match) => (
            <InstagramMatchCard key={match.id} match={match} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-zinc-50 rounded-[40px] border border-zinc-100">
            <h3 className="text-4xl font-black text-zinc-300 mb-4 opacity-50">NO MATCHES</h3>
            <p className="text-2xl text-zinc-400 font-medium tracking-tight">현재 예정된 경기가 없습니다</p>
          </div>
        )}
      </div>

      {/* Footer watermark - Light theme subtle style */}
      <div className="w-full flex-none mt-16 z-10 flex flex-col items-center">
        <div className="flex items-center gap-3 bg-[#172554] px-8 py-4 rounded-full shadow-lg border border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
          <span className="text-2xl font-bold text-white tracking-tight">@powerplay.kr</span>
        </div>
      </div>
    </div>
  );
}


export default async function InstagramStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { date, page } = await searchParams;
  
  setRequestLocale(locale);

  // Default to tomorrow if no date is provided
  let targetDateStr = date;
  if (!targetDateStr) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    targetDateStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  return (
    <Suspense fallback={<div className="w-full h-screen bg-white flex items-center justify-center text-[#172554] text-3xl font-bold">로딩 중...</div>}>
      <InstagramStoryContent locale={locale} date={targetDateStr} page={page || "1"} />
    </Suspense>
  );
}
