import type { SuperuserMatchSummary } from "@/app/actions/superuser";

export type SuperuserMatchStatusFilter = "all" | "open" | "closed" | "canceled" | "finished";
export type SuperuserMatchTypeFilter = "all" | "training" | "game" | "team_match";

export function getSuperuserMatchDisplayStatus(
  startTime: string,
  status: SuperuserMatchSummary["status"]
) {
  return new Date(startTime) < new Date() ? "finished" : status;
}

export function getSuperuserMatchSearchableText(match: SuperuserMatchSummary) {
  return [
    match.rink?.name_ko,
    match.rink?.name_en,
    match.club?.name,
    match.creator.full_name,
    match.creator.email,
    match.description,
    match.bank_account,
    match.start_time,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterSuperuserMatches(
  matches: SuperuserMatchSummary[],
  {
    query,
    status,
    type,
  }: {
    query: string;
    status: SuperuserMatchStatusFilter;
    type: SuperuserMatchTypeFilter;
  }
) {
  const normalizedQuery = query.trim().toLowerCase();

  return matches.filter((match) => {
    const displayStatus = getSuperuserMatchDisplayStatus(match.start_time, match.status);
    const matchesQuery =
      normalizedQuery.length === 0 || getSuperuserMatchSearchableText(match).includes(normalizedQuery);
    const matchesStatus = status === "all" || displayStatus === status;
    const matchType = match.match_type || "training";
    const matchesType = type === "all" || matchType === type;

    return matchesQuery && matchesStatus && matchesType;
  });
}
