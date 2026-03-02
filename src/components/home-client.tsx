"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Match } from "@/app/actions/match";
import { Rink } from "@/app/actions/types";
import { DateFilter } from "@/components/date-filter";
import { MatchCard } from "@/components/match-card";
import { CalendarView } from "@/components/calendar-view";
import { RinkExplorer } from "@/components/rink-explorer";
import { useTranslations, useLocale } from "next-intl";
import { RinkFilterDrawer } from "@/components/rink-filter-drawer";
import { MatchTypeFilterDrawer } from "@/components/match-type-filter-drawer";
import { RegionFilterDrawer } from "@/components/region-filter-drawer";
import { List, CalendarDays, Loader2, ChevronDown, Search } from "lucide-react";
import { Club } from "@/app/actions/types";
import { ClubCard } from "@/components/club-card";
import { extractRegion, getUniqueRegions } from "@/lib/rink-utils";

interface HomeClientProps {
  matches: Match[]; // This is now ALL matches passed from server
  rinks: Rink[];
  clubs: Club[];
  allMatches?: Match[]; // Optional, for backward compatibility if needed, but we'll use 'matches' as source
  myClubIds?: string[];
  initialDate?: string;
  userRole?: string | null;
}

export function HomeClient({ matches: allMatchesSource, rinks, clubs, myClubIds = [], initialDate, userRole }: HomeClientProps) {
  const locale = useLocale();
  const t = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTabState] = useState<"match" | "rink" | "club">(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "rink") return "rink";
    if (tabParam === "club") return "club";
    return "match";
  });
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Client-side filtering state
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate || null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  
  // Rink Filter State
  const [selectedRinkIds, setSelectedRinkIds] = useState<string[]>([]);
  const [isRinkFilterOpen, setIsRinkFilterOpen] = useState(false);

  // Match Type Filter State
  const [selectedMatchTypes, setSelectedMatchTypes] = useState<string[]>([]);
  const [isMatchTypeFilterOpen, setIsMatchTypeFilterOpen] = useState(false);

  // Club Search & Region Filter State
  const [clubSearchQuery, setClubSearchQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [isRegionFilterOpen, setIsRegionFilterOpen] = useState(false);

  const setActiveTab = (tab: "match" | "rink" | "club") => {
    startTransition(() => {
        setActiveTabState(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        window.history.replaceState(null, "", `?${params.toString()}`);
    });
  }

  const handleDateSelect = (dateStr: string | null) => {
    startTransition(() => {
        setSelectedDate(dateStr);
        const params = new URLSearchParams(searchParams.toString());
        if (dateStr) {
          params.set("date", dateStr);
        } else {
          params.delete("date");
        }
        if (!params.has("tab")) {
           params.set("tab", activeTab);
        }
        window.history.replaceState(null, "", `?${params.toString()}`);

        if (dateStr) {
            setViewMode("list");
            if (activeTab !== "match") {
                setActiveTabState("match");
            }
        }
    });
  };

  // Helper to determining if a match is visible based on date filter
  const isMatchVisibleByDate = (match: Match) => {
    const matchDate = new Date(match.start_time);
    if (selectedDate) {
      const year = matchDate.getFullYear();
      const month = String(matchDate.getMonth() + 1).padStart(2, "0");
      const day = String(matchDate.getDate()).padStart(2, "0");
      const matchDateString = `${year}-${month}-${day}`;
      return matchDateString === selectedDate;
    } else {
      // Default: Show future matches only (strict current time)
      return matchDate >= new Date();
    }
  };

  // Filter matches based on selectedDate and activeFilters
  const filteredMatches = allMatchesSource.filter((match) => {
    // 1. Date Check
    const dateMatch = isMatchVisibleByDate(match);

    // 2. Filter Checks (Intersection / AND)
    let filterMatch = true;
    if (activeFilters.has("skater_spots")) {
      const currentSkaters = (match.participants_count?.fw || 0) + (match.participants_count?.df || 0);
      if (currentSkaters >= match.max_skaters) {
        filterMatch = false;
      }
    }
    if (activeFilters.has("goalie_spots")) {
      const currentGoalies = match.participants_count?.g || 0;
      if (currentGoalies >= match.max_goalies) {
        filterMatch = false;
      }
    }
    if (activeFilters.has("rental_available")) {
      if (!match.rental_available) {
        filterMatch = false;
      }
    }
    
    // 3. Rink Filter (Intersection / OR within Rinks)
    if (selectedRinkIds.length > 0) {
        const rinkId = match.rink?.id;
        if (!rinkId || !selectedRinkIds.includes(rinkId)) {
            filterMatch = false;
        }
    }

    // 4. Match Type Filter (OR within selected types)
    if (selectedMatchTypes.length > 0) {
        if (!selectedMatchTypes.includes(match.match_type || 'training')) {
            filterMatch = false;
        }
    }

    return dateMatch && filterMatch;
  });

  const filteredClubs = clubs.filter((club) => {
    // 1. Name search filter
    if (clubSearchQuery.trim()) {
      if (!club.name.toLowerCase().includes(clubSearchQuery.trim().toLowerCase())) {
        return false;
      }
    }
    // 2. Region filter
    if (selectedRegions.length > 0) {
      if (!club.rinks || club.rinks.length === 0) return false;
      const hasMatchingRegion = club.rinks.some(r => {
        const region = extractRegion(r.address);
        return selectedRegions.includes(region);
      });
      if (!hasMatchingRegion) return false;
    }
    // 3. Rink filter (AND with region)
    if (selectedRinkIds.length > 0) {
      if (!club.rinks || club.rinks.length === 0) return false;
      if (!club.rinks.some(r => selectedRinkIds.includes(r.id))) return false;
    }
    return true;
  });

  // Compute available regions from all clubs' rinks
  const allClubRinks = clubs.flatMap(c => c.rinks || []);
  const availableRegions = getUniqueRegions(allClubRinks);

  return (
    <div className="flex flex-col gap-6">
      {/* ... Top Tab Navigation ... */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("match")}
          className={`flex-1 pb-3 text-lg font-bold transition-all relative ${activeTab === "match"
            ? "text-zinc-900 dark:text-white"
            : "text-zinc-400 hover:text-zinc-600"
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            {t("tabs.match")}
            {/* Optional Badge */}
            {/* <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{filteredMatches.length}</span> */}
          </span>
          {activeTab === "match" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("rink")}
          className={`flex-1 pb-3 text-lg font-bold transition-all relative ${activeTab === "rink"
            ? "text-zinc-900 dark:text-white"
            : "text-zinc-400 hover:text-zinc-600"
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            {t("tabs.rink")}
          </span>
          {activeTab === "rink" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("club")}
          className={`flex-1 pb-3 text-lg font-bold transition-all relative ${activeTab === "club"
            ? "text-zinc-900 dark:text-white"
            : "text-zinc-400 hover:text-zinc-600"
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            {t("tabs.club")}
          </span>
          {activeTab === "club" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[500px]">
        {isPending && (
            <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm transition-all duration-300">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )}
        <div className={`transition-all duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {activeTab === "match" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-end">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === "list"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                  <List className="w-4 h-4" />
                  {t("viewList")}
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === "calendar"
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
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm pt-2 pb-0" style={{ marginBottom: "8px"}}>
                  <DateFilter selectedDate={selectedDate} onSelect={handleDateSelect} />
                </div>

                {/* Filter Chips */}
                <div className="flex overflow-x-auto gap-2 px-1 pb-2 no-scrollbar">
                  <button
                    onClick={() => setIsRinkFilterOpen(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                      selectedRinkIds.length > 0
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {locale === "ko" ? "링크장" : "Rink"} 
                    {selectedRinkIds.length > 0 && ` (${selectedRinkIds.length})`}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isRinkFilterOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Match Type Filter Button */}
                  <button
                    onClick={() => setIsMatchTypeFilterOpen(!isMatchTypeFilterOpen)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                      selectedMatchTypes.length > 0
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {t("filter.matchType")}
                    {selectedMatchTypes.length > 0 && ` (${selectedMatchTypes.length})`}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isMatchTypeFilterOpen ? "rotate-180" : ""}`} />
                  </button>

                  <button
                    onClick={() => {
                      const newFilters = new Set(activeFilters);
                      if (newFilters.has("rental_available")) {
                        newFilters.delete("rental_available");
                      } else {
                        newFilters.add("rental_available");
                      }
                      setActiveFilters(newFilters);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                      activeFilters.has("rental_available")
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {t("filter.rentalAvailable")}
                  </button>

                  <button
                    onClick={() => {
                      const newFilters = new Set(activeFilters);
                      if (newFilters.has("goalie_spots")) {
                        newFilters.delete("goalie_spots");
                      } else {
                        newFilters.add("goalie_spots");
                      }
                      setActiveFilters(newFilters);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                      activeFilters.has("goalie_spots")
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {t("filter.goalieSpots")}
                  </button>
                  <button
                    onClick={() => {
                      const newFilters = new Set(activeFilters);
                      if (newFilters.has("skater_spots")) {
                        newFilters.delete("skater_spots");
                      } else {
                        newFilters.add("skater_spots");
                      }
                      setActiveFilters(newFilters);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                      activeFilters.has("skater_spots")
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {t("filter.skaterSpots")}
                  </button>
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
            <RinkExplorer rinks={rinks} matches={allMatchesSource} clubs={clubs} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Club Tab */}
            <div className="mb-6">
              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={clubSearchQuery}
                  onChange={(e) => setClubSearchQuery(e.target.value)}
                  placeholder={t("filter.searchClub")}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex overflow-x-auto gap-2 px-1 pb-4 no-scrollbar">
                <button
                  onClick={() => setIsRegionFilterOpen(true)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                    selectedRegions.length > 0
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t("filter.region")}
                  {selectedRegions.length > 0 && ` (${selectedRegions.length})`}
                  <ChevronDown className={`w-3 h-3 transition-transform ${isRegionFilterOpen ? "rotate-180" : ""}`} />
                </button>
                <button
                  onClick={() => setIsRinkFilterOpen(true)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                    selectedRinkIds.length > 0
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                  }`}
                >
                  {locale === "ko" ? "주 이용 링크장" : "Rinks"}
                  {selectedRinkIds.length > 0 && ` (${selectedRinkIds.length})`}
                  <ChevronDown className={`w-3 h-3 transition-transform ${isRinkFilterOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

             {["admin", "superuser"].includes(userRole || "") ? (
                <button
                  onClick={() => router.push(`/${locale}/admin/matches`)}
                  className="w-full py-4 px-6 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-xl shadow-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group"
                >
                  <span className="font-bold text-base">{t("admin.goToAdmin")}</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/${locale}/admin-apply`)}
                  className="w-full py-4 px-6 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group"
                >
                  <span className="font-bold text-base">
                    {t("admin.becomeAdmin")}
                  </span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              )}
            </div>

            {filteredClubs.length === 0 ? (
              <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-zinc-500">{t("noClubs")}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      
      {/* Rink Filter Drawer */}
      <RinkFilterDrawer
        isOpen={isRinkFilterOpen}
        onClose={() => setIsRinkFilterOpen(false)}
        rinks={
          activeTab === "club"
            ? rinks.filter(r => clubs.some(c => c.rinks?.some(cr => cr.id === r.id)))
            : rinks.filter(r => allMatchesSource.some(m => m.rink?.id === r.id && isMatchVisibleByDate(m)))
        }
        selectedRinkIds={selectedRinkIds}
        onSelectRinkIds={setSelectedRinkIds}
      />

      {/* Region Filter Drawer (Club tab) */}
      <RegionFilterDrawer
        isOpen={isRegionFilterOpen}
        onClose={() => setIsRegionFilterOpen(false)}
        regions={availableRegions}
        selectedRegions={selectedRegions}
        onSelectRegions={setSelectedRegions}
      />

      {/* Match Type Filter Drawer */}
      <MatchTypeFilterDrawer
        isOpen={isMatchTypeFilterOpen}
        onClose={() => setIsMatchTypeFilterOpen(false)}
        selectedTypes={selectedMatchTypes}
        onSelectTypes={setSelectedMatchTypes}
      />
    </div>
  );
}

