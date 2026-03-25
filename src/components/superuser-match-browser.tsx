"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { SuperuserMatchSummary } from "@/app/actions/superuser";
import {
  filterSuperuserMatches,
  type SuperuserMatchStatusFilter,
  type SuperuserMatchTypeFilter,
} from "@/lib/superuser-match-filters";
import { SuperUserMatchCard } from "./superuser-match-card";

export function SuperuserMatchBrowser({
  matches,
  locale,
  currentMonth,
}: {
  matches: SuperuserMatchSummary[];
  locale: string;
  currentMonth: string;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SuperuserMatchStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<SuperuserMatchTypeFilter>("all");
  const deferredQuery = useDeferredValue(query);

  const filteredMatches = useMemo(
    () =>
      filterSuperuserMatches(matches, {
        query: deferredQuery,
        status: statusFilter,
        type: typeFilter,
      }),
    [deferredQuery, matches, statusFilter, typeFilter]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                locale === "ko"
                  ? "링크장, 동호회, 관리자, 메모, 계좌로 검색"
                  : "Search by rink, club, creator, note, or account"
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100"
          >
            <option value="all">{locale === "ko" ? "모든 상태" : "All statuses"}</option>
            <option value="open">{locale === "ko" ? "모집중" : "Open"}</option>
            <option value="closed">{locale === "ko" ? "마감" : "Closed"}</option>
            <option value="canceled">{locale === "ko" ? "취소됨" : "Canceled"}</option>
            <option value="finished">{locale === "ko" ? "경기완료" : "Finished"}</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100"
          >
            <option value="all">{locale === "ko" ? "모든 유형" : "All types"}</option>
            <option value="training">{locale === "ko" ? "훈련" : "Training"}</option>
            <option value="game">{locale === "ko" ? "일반 경기" : "Game"}</option>
            <option value="team_match">{locale === "ko" ? "팀 매치" : "Team match"}</option>
          </select>
        </div>

        <p className="mt-3 text-sm text-zinc-400">
          {locale === "ko"
            ? `${currentMonth} 기준 ${matches.length}개 경기 중 ${filteredMatches.length}개 표시`
            : `${filteredMatches.length} of ${matches.length} matches shown for ${currentMonth}`}
        </p>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="rounded-lg bg-zinc-800 py-12 text-center">
          <p className="text-zinc-500">
            {locale === "ko"
              ? "조건에 맞는 경기가 없습니다. 검색어나 필터를 바꿔보세요."
              : "No matches fit the current filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMatches.map((match) => (
            <SuperUserMatchCard key={match.id} match={match} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
