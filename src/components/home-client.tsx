"use client";

import { fieldStyles, filterChipStyles, surfaceStyles, segmentedItemStyles } from "@/components/ui/styles";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { castClubVote, type ClubVoteSummary } from "@/app/actions/clubs";
import { Match } from "@/app/actions/match";
import { Rink } from "@/app/actions/types";
import { DateFilter } from "@/components/date-filter";
import { MatchCard } from "@/components/match-card";
const CalendarView = dynamic(
  () => import("@/components/calendar-view").then((module) => module.CalendarView),
  { loading: () => <div className="min-h-80 animate-pulse rounded-xl bg-pp-surface-muted " /> }
);
import { RinkExplorer } from "@/components/rink-explorer";
import { useTranslations, useLocale } from "next-intl";
import { RinkFilterDrawer } from "@/components/rink-filter-drawer";
import { MatchTypeFilterDrawer } from "@/components/match-type-filter-drawer";
import { RegionFilterDrawer } from "@/components/region-filter-drawer";
import { List, CalendarDays, Loader2, ChevronDown, Search } from "lucide-react";
import { Club } from "@/app/actions/types";
import { FindClubBanner } from "@/components/find-club-banner";
import { ClubCard } from "@/components/club-card";
import { CLUB_VOTE_DAILY_LIMIT, POWERPLAY_INSTAGRAM_URL, applyClubVoteRanking } from "@/lib/club-voting";
import { extractRegion, getUniqueRegions } from "@/lib/rink-utils";

interface HomeClientProps {
  matches: Match[]; // This is now ALL matches passed from server
  rinks: Rink[];
  clubs: Club[];
  allMatches?: Match[]; // Optional, for backward compatibility if needed, but we'll use 'matches' as source
  initialDate?: string;
  clubVoteSummary?: ClubVoteSummary;
  forcedTab?: "match" | "rink" | "club";
}

export function HomeClient({
  matches: allMatchesSource,
  rinks,
  clubs,
  initialDate,
  clubVoteSummary,
  forcedTab,
}: HomeClientProps) {
  const locale = useLocale();
  const t = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [clubsState, setClubsState] = useState(clubs);
  const [voteSummary, setVoteSummary] = useState<ClubVoteSummary>(
    clubVoteSummary ?? {
      isLoggedIn: false,
      dailyLimit: CLUB_VOTE_DAILY_LIMIT,
      remainingDailyVotes: CLUB_VOTE_DAILY_LIMIT,
      votedClubIdsToday: [],
      todayKey: "",
      monthKey: "",
    }
  );

  const [activeTabState, setActiveTabState] = useState<"match" | "rink" | "club">(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "rink") return "rink";
    if (tabParam === "match") return "match";
    return "club";
  });
  const activeTab = forcedTab ?? activeTabState;
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Client-side filtering state
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate ?? searchParams.get("date"));
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
            if (!forcedTab && activeTab !== "match") {
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

  const filteredClubs = clubsState.filter((club) => {
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
  const allClubRinks = clubsState.flatMap(c => c.rinks || []);
  const availableRegions = getUniqueRegions(allClubRinks);

  const handleVote = async (clubId: string) => {
    if (!voteSummary.isLoggedIn) {
      router.push(`/${locale}/login`);
      return;
    }

    const result = await castClubVote(clubId);

    if (!result.success) {
      switch (result.error) {
        case "ALREADY_VOTED_TODAY":
          alert(t("clubRanking.voteErrors.alreadyVotedToday"));
          break;
        case "DAILY_LIMIT_REACHED":
          alert(t("clubRanking.voteErrors.dailyLimitReached"));
          break;
        case "AUTH_REQUIRED":
          router.push(`/${locale}/login`);
          break;
        case "CLUB_NOT_FOUND":
          alert(t("clubRanking.voteErrors.clubNotFound"));
          break;
        default:
          alert(t("clubRanking.voteErrors.generic"));
      }
      return;
    }

    const nextVotedClubIdsToday = [...voteSummary.votedClubIdsToday, clubId];
    setVoteSummary((current) => ({
      ...current,
      remainingDailyVotes: result.remainingDailyVotes ?? Math.max(0, current.remainingDailyVotes - 1),
      votedClubIdsToday: nextVotedClubIdsToday,
    }));

    const updatedClubs = clubsState.map((club) =>
      club.id === clubId
        ? { ...club, monthly_vote_count: result.monthlyVoteCount ?? (club.monthly_vote_count ?? 0) + 1 }
        : club
    );

    setClubsState(applyClubVoteRanking(updatedClubs, updatedClubs.map((club) => ({
      club_id: club.id,
      vote_count: club.id === clubId
        ? result.monthlyVoteCount ?? (club.monthly_vote_count ?? 0)
        : club.monthly_vote_count ?? 0,
    }))));
  };

  return (
    <div className="flex flex-col gap-6">
      {!forcedTab ? (
        <div className="flex border-b border-pp-border ">
          <button type="button"
            onClick={() => setActiveTab("club")}
            className={`${segmentedItemStyles({ selected: activeTab === "club", kind: "tab" })} flex-1 relative`}
          >
            <span className="flex items-center justify-center gap-2">
              {t("tabs.club")}
            </span>
            {activeTab === "club" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
          <button type="button"
            onClick={() => setActiveTab("rink")}
            className={`${segmentedItemStyles({ selected: activeTab === "rink", kind: "tab" })} flex-1 relative`}
          >
            <span className="flex items-center justify-center gap-2">
              {t("tabs.rink")}
            </span>
            {activeTab === "rink" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
          <button type="button"
            onClick={() => setActiveTab("match")}
            className={`${segmentedItemStyles({ selected: activeTab === "match", kind: "tab" })} flex-1 relative`}
          >
            <span className="flex items-center justify-center gap-2">
              {t("tabs.match")}
            </span>
            {activeTab === "match" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
        </div>
      ) : null}

      {/* Tab Content */}
      <div className="relative min-h-[500px]">
        {isPending && (
            <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-white/50 dark:bg-pp-surface/50 backdrop-blur-sm transition-all duration-300">
                <Loader2 className="w-8 h-8 animate-spin text-pp-accent-text" />
            </div>
        )}
        <div className={`transition-all duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {activeTab === "match" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-end">
              <div className="flex items-center bg-pp-surface-muted p-1 rounded-lg">
                <button type="button"
                  onClick={() => setViewMode("list")}
                  className={`${segmentedItemStyles({ selected: viewMode === "list" })} flex items-center gap-2 `}
                >
                  <List className="w-4 h-4" />
                  {t("viewList")}
                </button>
                <button type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`${segmentedItemStyles({ selected: viewMode === "calendar" })} flex items-center gap-2 `}
                >
                  <CalendarDays className="w-4 h-4" />
                  {t("viewCalendar")}
                </button>
              </div>
            </div>

            {viewMode === "list" ? (
              <>
                {/* Date Filter (horizontal scrollable dates) */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-pp-surface/80 backdrop-blur-sm pt-2 pb-0" style={{ marginBottom: "8px"}}>
                  <DateFilter selectedDate={selectedDate} onSelect={handleDateSelect} />
                </div>

                {/* Filter Chips */}
                <div className="flex overflow-x-auto gap-2 px-1 pb-2 no-scrollbar">
                  <button type="button"
                    onClick={() => setIsRinkFilterOpen(true)}
                    className={`${filterChipStyles({ selected: selectedRinkIds.length > 0 })} flex items-center gap-1 whitespace-nowrap`}
                  >
                    {locale === "ko" ? "링크장" : "Rink"}
                    {selectedRinkIds.length > 0 && ` (${selectedRinkIds.length})`}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isRinkFilterOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Match Type Filter Button */}
                  <button type="button"
                    onClick={() => setIsMatchTypeFilterOpen(!isMatchTypeFilterOpen)}
                    className={`${filterChipStyles({ selected: selectedMatchTypes.length > 0 })} flex items-center gap-1 whitespace-nowrap`}
                  >
                    {t("filter.matchType")}
                    {selectedMatchTypes.length > 0 && ` (${selectedMatchTypes.length})`}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isMatchTypeFilterOpen ? "rotate-180" : ""}`} />
                  </button>

                  <button type="button"
                    onClick={() => {
                      const newFilters = new Set(activeFilters);
                      if (newFilters.has("goalie_spots")) {
                        newFilters.delete("goalie_spots");
                      } else {
                        newFilters.add("goalie_spots");
                      }
                      setActiveFilters(newFilters);
                    }}
                    className={`${filterChipStyles({ selected: activeFilters.has("goalie_spots") })} whitespace-nowrap`}
                  >
                    {t("filter.goalieSpots")}
                  </button>
                  <button type="button"
                    onClick={() => {
                      const newFilters = new Set(activeFilters);
                      if (newFilters.has("rental_available")) {
                        newFilters.delete("rental_available");
                      } else {
                        newFilters.add("rental_available");
                      }
                      setActiveFilters(newFilters);
                    }}
                    className={`${filterChipStyles({ selected: activeFilters.has("rental_available") })} whitespace-nowrap`}
                  >
                    {t("filter.rentalAvailable")}
                  </button>
                  <button type="button"
                    onClick={() => {
                      const newFilters = new Set(activeFilters);
                      if (newFilters.has("skater_spots")) {
                        newFilters.delete("skater_spots");
                      } else {
                        newFilters.add("skater_spots");
                      }
                      setActiveFilters(newFilters);
                    }}
                    className={`${filterChipStyles({ selected: activeFilters.has("skater_spots") })} whitespace-nowrap`}
                  >
                    {t("filter.skaterSpots")}
                  </button>
                </div>

                {filteredMatches.length === 0 ? (
                  <div className={`${surfaceStyles({ interactive: false, density: "none" })} text-center `}>
                    <p className="text-pp-muted">{t("noMatches")}</p>
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
              <div className="mb-4">
                <FindClubBanner />
              </div>

              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pp-muted" />
                <input
                  type="text"
                  value={clubSearchQuery}
                  onChange={(e) => setClubSearchQuery(e.target.value)}
                  placeholder={t("filter.searchClub")}
                  className={`${fieldStyles({ leadingIcon: true })} w-full`}
                />
              </div>

              {/* Filter Chips */}
              <div className="flex overflow-x-auto gap-2 px-1 pb-1 no-scrollbar">
                <button type="button"
                  onClick={() => setIsRegionFilterOpen(true)}
                  className={`${filterChipStyles({ selected: selectedRegions.length > 0 })} flex items-center gap-1 whitespace-nowrap`}
                >
                  {t("filter.region")}
                  {selectedRegions.length > 0 && ` (${selectedRegions.length})`}
                  <ChevronDown className={`w-3 h-3 transition-transform ${isRegionFilterOpen ? "rotate-180" : ""}`} />
                </button>
                <button type="button"
                  onClick={() => setIsRinkFilterOpen(true)}
                  className={`${filterChipStyles({ selected: selectedRinkIds.length > 0 })} flex items-center gap-1 whitespace-nowrap`}
                >
                  {locale === "ko" ? "주 이용 링크장" : "Rinks"}
                  {selectedRinkIds.length > 0 && ` (${selectedRinkIds.length})`}
                  <ChevronDown className={`w-3 h-3 transition-transform ${isRinkFilterOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>

            <details className={`${surfaceStyles({ density: "none" })} group mb-6 `}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-pp-muted ">
                    {t("clubRanking.badge")}
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold text-pp-text ">
                    {t("clubRanking.bannerTitle")}
                  </h2>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-3 border-t border-pp-border pt-3 text-xs leading-relaxed ">
                <p>{t("clubRanking.voteHint")}</p>
                <p className="mt-1 text-pp-muted ">{t("clubRanking.bannerSubdescription")}</p>
                <a
                  href={POWERPLAY_INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex min-h-8 items-center font-medium underline underline-offset-4 hover:text-pp-accent-text "
                >
                  {t("clubRanking.instagramAction")}
                </a>
              </div>
            </details>

            {filteredClubs.length === 0 ? (
              <div className={`${surfaceStyles({ interactive: false, density: "none" })} text-center `}>
                <p className="text-pp-muted">{t("noClubs")}</p>
              </div>
            ) : (
              <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    didVoteToday={voteSummary.votedClubIdsToday.includes(club.id)}
                    onVote={handleVote}
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
