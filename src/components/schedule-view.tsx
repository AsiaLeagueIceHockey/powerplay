"use client";

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
    <div className="flex flex-col gap-4">
      {/* View Toggle */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-3 rounded-lg border border-zinc-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        {viewMode === 'list' && (
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer dark:text-zinc-400">
            <input 
              type="checkbox" 
              checked={groupByRink} 
              onChange={(e) => setGroupByRink(e.target.checked)}
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            링크장별 보기
          </label>
        )}
        {viewMode === 'map' && <div />}

        <div className="flex items-center bg-zinc-100 p-1 rounded-lg dark:bg-zinc-800 self-end sm:self-auto">
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
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "map"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
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
                        <h3 className="text-lg font-bold mb-3 px-1">{rinkName}</h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {rinkMatches.map((match) => <MatchCard key={match.id} match={match} />)}
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {matches.length === 0 ? (
                <div className="col-span-full rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
                    <p className="text-center text-zinc-500 dark:text-zinc-400">
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
