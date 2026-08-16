"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Club } from "@/app/actions/types";
import { AdminClubCard } from "@/components/admin-club-card";

export function AdminClubList({
  clubs,
  canDelete,
  searchPlaceholder,
  noSearchResults,
}: {
  clubs: Club[];
  canDelete: boolean;
  searchPlaceholder: string;
  noSearchResults: string;
}) {
  const [query, setQuery] = useState("");
  const filteredClubs = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    if (!keyword) return clubs;
    return clubs.filter((club) => club.name.toLocaleLowerCase().includes(keyword));
  }, [clubs, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {filteredClubs.length > 0 ? (
        <div className="space-y-3">
          {filteredClubs.map((club) => (
            <AdminClubCard key={club.id} club={club} canDelete={canDelete} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 py-10 text-center text-sm text-zinc-500">
          {noSearchResults}
        </div>
      )}
    </div>
  );
}
