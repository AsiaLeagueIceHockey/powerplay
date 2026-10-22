"use client";
import { useTranslations } from "next-intl";

import { badgeStyles, buttonStyles, fieldStyles, surfaceStyles, segmentedItemStyles } from "@/components/ui/styles";

import { useState } from "react";
import { Rink, Club } from "@/app/actions/types";
import { Match } from "@/app/actions/match";
import { useLocale } from "next-intl";
import { Map as MapIcon, List, Search, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DynamicRinkMap } from "@/components/dynamic-rink-map";

interface RinkExplorerProps {
  rinks: Rink[];
  matches: Match[]; // Needed to show match counts or passed to map
  clubs: Club[];
}

export function RinkExplorer({ rinks, matches, clubs }: RinkExplorerProps) {
  const copy = useTranslations("rinkExplorer");
  const locale = useLocale();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter rinks for list view
  const filteredRinks = rinks.filter((rink) =>
    rink.name_ko.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rink.address && rink.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Toggle Bar */}
      {/* Search & Toggle Bar */}
      <div className="flex flex-col gap-3 sticky top-0 z-10 bg-pp-surface pb-2">
        {/* View Toggle */}
        <div className="flex justify-end">
            <div className="flex bg-pp-surface-muted p-1 rounded-lg ">
            <button type="button"
                onClick={() => setViewMode("map")}
                className={`${segmentedItemStyles({ selected: viewMode === "map" })} flex items-center gap-2 `}
            >
                <MapIcon className="w-4 h-4" />
                {copy("map")}</button>
            <button type="button"
                onClick={() => setViewMode("list")}
                className={`${segmentedItemStyles({ selected: viewMode === "list" })} flex items-center gap-2 `}
            >
                <List className="w-4 h-4" />
                {copy("list")}</button>
            </div>
        </div>

        {/* Search Input (Only relevant for list view) */}
        {viewMode === "list" && (
            <div className="relative animate-in fade-in slide-in-from-top-1 duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pp-muted" />
            <input
                type="text"
                placeholder={copy("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${fieldStyles({ leadingIcon: true })} w-full`}
            />
            </div>
        )}
      </div>

      {/* Content Area */}
      <div className={`flex-1 relative rounded-xl overflow-hidden ${viewMode === 'map' ? 'h-[calc(100vh-200px)] min-h-[600px] border border-pp-border bg-pp-surface-muted ' : ''}`}>
        {viewMode === "map" ? (
          <DynamicRinkMap rinks={rinks} matches={matches} clubs={clubs} />
        ) : (
          <div className="pb-4">
            {filteredRinks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-pp-muted">
                    {copy("empty")}</div>
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
                        <div key={rink.id} className={surfaceStyles({ interactive: false, density: "default" })}>
                             {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-pp-text dark:text-white mb-1">{rink.name_ko}</h3>
                                    <p className="text-sm text-pp-muted flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        {rink.address || copy("noAddress")}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                     {rink.rink_type && (
                                        <span className={`${badgeStyles({ tone: "neutral" })} whitespace-nowrap`}>
                                            {rink.rink_type === 'FULL' ? copy("fullRink") : copy("miniRink")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content Sections */}
                            <div className="space-y-4">
                                {/* Matches */}
                                {rinkMatches.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-pp-text mb-2">{copy("upcoming")}</h4>
                                        <div className="space-y-2">
                                            {rinkMatches.map(match => (
                                                <Link key={match.id} href={`/match/${match.id}`} className="block">
                                                    <div className={`${surfaceStyles({ interactive: true, density: "default" })} flex items-center justify-between`}>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-pp-text ">
                                                                {new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short", hour: "2-digit", minute:"2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(new Date(match.start_time))}
                                                            </span>
                                                            <span className="text-xs text-pp-muted line-clamp-1">{match.description || copy("friendly")}</span>
                                                        </div>
                                                        <span className={`${badgeStyles({ tone: "brand" })} ml-2 whitespace-nowrap`}>{copy("available")}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Clubs */}
                                {rinkClubs.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-pp-text mb-2">{copy("clubs")}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {rinkClubs.map(club => (
                                                <Link key={club.id} href={`/clubs/${club.id}`} className={`${surfaceStyles({ interactive: true, density: "none" })} flex items-center gap-2 px-3 py-2`}>
                                                    <span className="text-sm font-medium text-pp-muted ">{club.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!hasContent && (
                                    <div className="text-xs text-pp-muted py-2 border-t border-dashed border-pp-border mt-2">
                                        {copy("noActivity")}</div>
                                )}
                            </div>

                            {/* Actions */}
                             <div className="mt-5 pt-3 border-t border-pp-border ">
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        href={`/rinks/${rink.id}`}
                                        className={`${buttonStyles({ variant: "primary", size: "default" })} w-full`}
                                    >
                                        {locale === "ko" ? "링크장 상세" : "Rink details"}
                                    </Link>
                                    <a
                                        href={rink.map_url || `https://map.naver.com/v5/search/${rink.name_ko}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${buttonStyles({ variant: "naver", size: "default" })} w-full`}
                                    >
                                        {copy("naver")}</a>
                                </div>
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
