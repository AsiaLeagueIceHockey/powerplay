"use client";

import { useState } from "react";
import { Rink } from "@/app/actions/types";
import { Match } from "@/app/actions/match";
import { RinkMap } from "@/components/rink-map";
import { useTranslations } from "next-intl";
import { Map as MapIcon, List, Search, MapPin } from "lucide-react";
import Link from "next/link";

interface RinkExplorerProps {
  rinks: Rink[];
  matches: Match[]; // Needed to show match counts or passed to map
}

export function RinkExplorer({ rinks, matches }: RinkExplorerProps) {
  const t = useTranslations("home"); // Assuming relevant keys are here or need adding
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter rinks for list view
  const filteredRinks = rinks.filter((rink) =>
    rink.name_ko.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rink.address && rink.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] gap-4">
      {/* Search & Toggle Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-10 bg-white dark:bg-zinc-950 py-2">
        {/* Search Input (Only relevant for list view) */}
        {viewMode === "list" ? (
            <div className="relative flex-1 max-w-md animate-in fade-in slide-in-from-left-2 duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
                type="text"
                placeholder="링크장 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            </div>
        ) : (
            <div className="flex-1" /> /* Spacer to keep Toggle on the right if needed, or just empty */
        )}

        {/* View Toggle */}
        <div className="flex bg-zinc-100 p-1 rounded-lg dark:bg-zinc-800 self-end sm:self-auto">
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
              viewMode === "map"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            지도
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
              viewMode === "list"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            <List className="w-4 h-4" />
            목록
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        {viewMode === "map" ? (
          <RinkMap rinks={rinks} matches={matches} />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            {filteredRinks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                    검색 결과가 없습니다.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRinks.map((rink) => {
                    const upcomingCount = matches.filter(m => m.rink?.id === rink.id && m.status === 'open').length;
                    return (
                        <div key={rink.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:border-blue-500 hover:shadow-md">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">{rink.name_ko}</h3>
                            <p className="text-sm text-zinc-500 flex items-start gap-1 mb-3">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                {rink.address || "주소 미등록"}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                {upcomingCount > 0 && (
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                        오픈 매치 {upcomingCount}개
                                    </span>
                                )}
                                {rink.rink_type && (
                                    <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                        {rink.rink_type === 'FULL' ? '정규 규격' : '미니 링크'}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <a 
                                    href={rink.map_url || `https://map.naver.com/v5/search/${rink.name_ko}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 text-center text-xs font-bold bg-[#03C75A] text-white rounded hover:bg-[#02b351] transition-colors"
                                >
                                    네이버 지도
                                </a>
                                {/* Could add a "View Matches" button that filters the match tab later, but for now map link is good */}
                            </div>
                        </div>
                    );
                })}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
