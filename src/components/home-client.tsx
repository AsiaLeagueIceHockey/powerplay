"use client";

import { useState } from "react";
import { Match } from "@/app/actions/match";
import { Rink } from "@/app/actions/types";
import { DateFilter } from "@/components/date-filter";
import { MatchCard } from "@/components/match-card";
import { RinkExplorer } from "@/components/rink-explorer";
import { useTranslations } from "next-intl";
import { Calendar, Map as MapIcon } from "lucide-react";

interface HomeClientProps {
  matches: Match[]; // These are already filtered by date from the server if date param exists
  rinks: Rink[];
  allMatches: Match[]; // Unfiltered matches for the Rink Explorer counts? Or just reuse matches? 
                       // Actually Rink Explorer might want ALL future matches to show counts regardless of date filter selected in Match Tab.
                       // Let's assume we pass allMatches for RinkExplorer and filteredMatches for MatchList.
}

export function HomeClient({ matches: filteredMatches, rinks, allMatches }: HomeClientProps) {
  const t = useTranslations("home");
  const [activeTab, setActiveTab] = useState<"match" | "rink">("match");

  return (
    <div className="flex flex-col gap-6">
      {/* Top Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("match")}
          className={`flex-1 pb-3 text-lg font-bold transition-all relative ${
            activeTab === "match"
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            경기
            {/* Optional Badge */}
            {/* <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{filteredMatches.length}</span> */}
          </span>
          {activeTab === "match" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("rink")}
          className={`flex-1 pb-3 text-lg font-bold transition-all relative ${
            activeTab === "rink"
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            링크장
          </span>
          {activeTab === "rink" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "match" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Match Tab: Date Filter + Match Grid */}
             <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm py-2">
                <DateFilter />
             </div>
             
             {filteredMatches.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-zinc-500">{t("noMatches")}</p>
                </div>
             ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
             )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Rink Tab: Rink Explorer */}
             <RinkExplorer rinks={rinks} matches={allMatches} />
          </div>
        )}
      </div>
    </div>
  );
}
