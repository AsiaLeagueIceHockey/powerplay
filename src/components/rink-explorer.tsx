import { useState } from "react";
import { Rink, Club } from "@/app/actions/types";
import { Match } from "@/app/actions/match";
import { useTranslations } from "next-intl";
import { Map as MapIcon, List, Search, MapPin } from "lucide-react";
import Link from "next/link";
import { DynamicRinkMap } from "@/components/dynamic-rink-map";

interface RinkExplorerProps {
  rinks: Rink[];
  matches: Match[]; // Needed to show match counts or passed to map
  clubs: Club[];
}

export function RinkExplorer({ rinks, matches, clubs }: RinkExplorerProps) {
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
      {/* Search & Toggle Bar */}
      <div className="flex flex-col gap-3 sticky top-0 z-10 bg-white dark:bg-zinc-950 pb-2">
        {/* View Toggle */}
        <div className="flex justify-end">
            <div className="flex bg-zinc-100 p-1 rounded-lg dark:bg-zinc-800">
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

        {/* Search Input (Only relevant for list view) */}
        {viewMode === "list" && (
            <div className="relative animate-in fade-in slide-in-from-top-1 duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
                type="text"
                placeholder="링크장 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-shadow"
            />
            </div>
        )}
      </div>

      {/* Content Area */}
      <div className={`flex-1 relative rounded-xl overflow-hidden ${viewMode === 'map' ? 'border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900' : ''}`}>
        {viewMode === "map" ? (
          <DynamicRinkMap rinks={rinks} matches={matches} clubs={clubs} />
        ) : (
          <div className="h-full overflow-y-auto pb-4 no-scrollbar">
            {filteredRinks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                    검색 결과가 없습니다.
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                {filteredRinks.map((rink) => {
                    const rinkMatches = matches
                        .filter(m => m.rink?.id === rink.id && m.status === 'open')
                        .filter((m) => new Date(m.start_time) >= new Date())
                        .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                        .slice(0, 2);
                    
                    const rinkClubs = clubs.filter(c => c.rinks?.some(r => r.id === rink.id));
                    const hasContent = rinkMatches.length > 0 || rinkClubs.length > 0;

                    return (
                        <div key={rink.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                             {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">{rink.name_ko}</h3>
                                    <p className="text-sm text-zinc-500 flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        {rink.address || "주소 미등록"}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                     {rink.rink_type && (
                                        <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded whitespace-nowrap">
                                            {rink.rink_type === 'FULL' ? '정규 규격' : '미니 링크'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content Sections */}
                            <div className="space-y-4">
                                {/* Matches */}
                                {rinkMatches.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">예정된 경기</h4>
                                        <div className="space-y-2">
                                            {rinkMatches.map(match => (
                                                <Link key={match.id} href={`/match/${match.id}`} className="block">
                                                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                                {new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short", hour: "2-digit", minute:"2-digit", hour12: false }).format(new Date(match.start_time))}
                                                            </span>
                                                            <span className="text-xs text-zinc-500 line-clamp-1">{match.description || "친선 경기"}</span>
                                                        </div>
                                                        <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded whitespace-nowrap">신청 가능</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Clubs */}
                                {rinkClubs.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">주 이용 동호회</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {rinkClubs.map(club => (
                                                <Link key={club.id} href={`/clubs/${club.id}`} className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{club.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {!hasContent && (
                                    <div className="text-xs text-zinc-400 py-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-2">
                                        현재 등록된 경기나 동호회가 없습니다.
                                    </div>
                                )}
                            </div>
                            
                            {/* Actions */}
                             <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <a 
                                    href={rink.map_url || `https://map.naver.com/v5/search/${rink.name_ko}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center text-sm font-bold bg-[#03C75A] text-white py-3 rounded-xl hover:bg-[#02b351] transition-colors"
                                >
                                    네이버 지도
                                </a>
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
