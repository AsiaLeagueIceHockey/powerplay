"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Match } from "@/app/actions/match";
import { Rink } from "@/app/actions/types";
import { DateFilter } from "@/components/date-filter";
import { MatchCard } from "@/components/match-card";
import { CalendarView } from "@/components/calendar-view";
import { RinkExplorer } from "@/components/rink-explorer";
import { useTranslations } from "next-intl";
import { List, CalendarDays } from "lucide-react";
import { Club } from "@/app/actions/types";
import { ClubCard } from "@/components/club-card";

interface HomeClientProps {
  matches: Match[]; // This is now ALL matches passed from server
  rinks: Rink[];
  clubs: Club[];
  allMatches?: Match[]; // Optional, for backward compatibility if needed, but we'll use 'matches' as source
  myClubIds?: string[];
  initialDate?: string;
}

export function HomeClient({ matches: allMatchesSource, rinks, clubs, myClubIds = [], initialDate }: HomeClientProps) {
  const t = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"match" | "rink" | "club">("match");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  // Client-side filtering state
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate || null);

  const handleDateSelect = (dateStr: string | null) => {
    setSelectedDate(dateStr);
    
    // Update URL without refresh
    const params = new URLSearchParams(searchParams.toString());
    if (dateStr) {
      params.set("date", dateStr);
    } else {
      params.delete("date");
    }
    window.history.replaceState(null, "", `?${params.toString()}`);

    if (dateStr) {
        setViewMode("list");
    }
  };

  // Filter matches based on selectedDate
  const filteredMatches = selectedDate
    ? allMatchesSource.filter((match) => {
        const matchDate = new Date(match.start_time);
        const year = matchDate.getFullYear();
        const month = String(matchDate.getMonth() + 1).padStart(2, "0");
        const day = String(matchDate.getDate()).padStart(2, "0");
        const matchDateString = `${year}-${month}-${day}`;
        return matchDateString === selectedDate;
      })
    : allMatchesSource;

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
        <button
          onClick={() => setActiveTab("club")}
          className={`flex-1 pb-3 text-lg font-bold transition-all relative ${
            activeTab === "club"
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            동호회
          </span>
          {activeTab === "club" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "match" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* View Mode Toggle */}
             <div className="flex items-center justify-end">
               <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                 <button
                   onClick={() => setViewMode("list")}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                     viewMode === "list"
                       ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                       : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                   }`}
                 >
                   <List className="w-4 h-4" />
                   {t("viewList")}
                 </button>
                 <button
                   onClick={() => setViewMode("calendar")}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                     viewMode === "calendar"
                       ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                       : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                   }`}
                 >
                   <CalendarDays className="w-4 h-4" />
                   {t("viewCalendar")}
                 </button>
               </div>
             </div>

             {viewMode === "list" ? (
               <>
                 {/* Date Filter (horizontal scrollable dates) */}
                 <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm py-2">
                   <DateFilter selectedDate={selectedDate} onSelect={handleDateSelect} />
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
               </>
             ) : (
               /* Calendar View */
               <CalendarView 
                 matches={allMatchesSource} 
                 onDateSelect={(date) => handleDateSelect(date)} 
               />
             )}
          </div>
        ) : activeTab === "rink" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Rink Tab: Rink Explorer */}
             <RinkExplorer rinks={rinks} matches={allMatchesSource} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Club Tab */}
             {clubs.length === 0 ? (
               <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                   <p className="text-zinc-500">등록된 동호회가 없습니다.</p>
               </div>
             ) : (
               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                   {clubs.map((club) => (
                       <ClubCard 
                          key={club.id} 
                          club={club} 
                          initialIsMember={myClubIds.includes(club.id)} 
                       />
                   ))}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

