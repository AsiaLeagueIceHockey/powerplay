"use client";

import { surfaceStyles, segmentedItemStyles } from "@/components/ui/styles";

import { useState } from "react";
import { Match } from "@/app/actions/match";
import { Rink } from "../app/actions/types";
import { MatchCard } from "@/components/match-card";
import { RinkMap } from "@/components/rink-map";
import { List, Map as MapIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface ScheduleViewProps {
  matches: Match[];
  rinks: Rink[];
}

export function ScheduleView({ matches, rinks }: ScheduleViewProps) {
  const t = useTranslations("home");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [groupByRink, setGroupByRink] = useState(false);

  // Group matches logic
  const groupedMatches = groupByRink
    ? matches.reduce((acc, match) => {
        const rinkName = match.rink?.name_ko || t("unknownRink");
        if (!acc[rinkName]) acc[rinkName] = [];
        acc[rinkName].push(match);
        return acc;
      }, {} as Record<string, Match[]>)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* View Toggle */}
      <div className={`${surfaceStyles({ interactive: false, density: "compact" })} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3`}>
        {viewMode === 'list' && (
          <label className="flex items-center gap-2 text-sm text-pp-muted cursor-pointer ">
            <input 
              type="checkbox" 
              checked={groupByRink} 
              onChange={(e) => setGroupByRink(e.target.checked)}
              className="rounded border-pp-border text-pp-accent-text focus:ring-pp-accent"
            />
            링크장별 보기
          </label>
        )}
        {viewMode === 'map' && <div />}

        <div className="flex items-center bg-pp-surface-muted p-1 rounded-lg self-end sm:self-auto">
          <button type="button"
            onClick={() => setViewMode("list")}
            className={`${segmentedItemStyles({ selected: viewMode === "list" })} flex items-center gap-2 `}
          >
            <List className="w-4 h-4" />
            {t("viewList")}
          </button>
          <button type="button"
            onClick={() => setViewMode("map")}
            className={`${segmentedItemStyles({ selected: viewMode === "map" })} flex items-center gap-2 `}
          >
            <MapIcon className="w-4 h-4" />
            {t("viewMap")}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {viewMode === "list" ? (
          groupByRink && groupedMatches ? (
            <div className="space-y-6">
                {Object.entries(groupedMatches).map(([rinkName, rinkMatches]) => (
                    <div key={rinkName}>
                        <h3 className="text-xl font-black mb-4 px-2 text-pp-navy dark:text-pp-text">{rinkName}</h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {rinkMatches.map((match) => <MatchCard key={match.id} match={match} />)}
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {matches.length === 0 ? (
                <div className={`${surfaceStyles({ interactive: false, density: "default" })} col-span-full`}>
                    <p className="text-center font-bold text-pp-muted italic">
                    {t("noMatches")}
                    </p>
                </div>
                ) : (
                    matches.map((match) => <MatchCard key={match.id} match={match} />)
                )}
            </div>
          )
        ) : (
          <RinkMap rinks={rinks} matches={matches} />
        )}
      </div>
    </div>
  );
}
