/**
 * Bulk Match Creation Utilities
 *
 * Provides date generation from schedule patterns and
 * pattern grouping from existing match data.
 */

// ─── Types ───────────────────────────────────────────────

export type MatchType = "game" | "training" | "team_match";
export type WeeklyOption = "every" | "week13" | "week24" | "custom";

export interface SchedulePattern {
  id: string; // client-side unique id
  rinkId: string;
  daysOfWeek: number[]; // 0(Sun)~6(Sat) — used by legacy/tests
  hour: string; // "22"
  minute: string; // "00"
  weeklyOption: WeeklyOption;
  customWeeks?: number[]; // 1-based week numbers when weeklyOption === "custom"
  selectedDates?: string[]; // Calendar-based: ["2026-03-04", "2026-03-06", ...]
  matchType: MatchType;
  // game fields
  entryPoints?: number;
  bankAccount?: string;
  maxSkaters?: number;
  maxGoalies?: number;
  goalieFree?: boolean;
  rentalAvailable?: boolean;
  rentalFee?: number;
  // training fields
  maxGuests?: number;
  // common
  description?: string;
}

export interface GeneratedMatch {
  date: string; // "2026-03-04"
  dayOfWeek: number;
  startTime: string; // "2026-03-04T22:00" (KST, for display)
  patternId: string;
  rinkId: string;
  matchType: MatchType;
  entryPoints: number;
  bankAccount: string | null;
  maxSkaters: number;
  maxGoalies: number;
  maxGuests: number | null;
  goalieFree: boolean;
  rentalAvailable: boolean;
  rentalFee: number;
  description: string | null;
}

// ─── Helpers ─────────────────────────────────────────────

/**
 * Get the ISO week-of-month for a given date (1-based).
 * Week 1 = the week containing the 1st of the month.
 * Week boundaries are Monday-based.
 */
export function getWeekOfMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);

  // Day of week of the 1st (0=Sun..6=Sat), convert to Mon=0..Sun=6
  const firstDayOfWeekMon = (firstDay.getDay() + 6) % 7;

  // The day-of-month (1-based)
  const dayOfMonth = date.getDate();

  // Week number: ceil((dayOfMonth + firstDayOfWeekMon) / 7)
  return Math.ceil((dayOfMonth + firstDayOfWeekMon) / 7);
}

/**
 * Check if a date's week-of-month matches the weekly option.
 */
export function matchesWeeklyOption(
  date: Date,
  weeklyOption: WeeklyOption,
  customWeeks?: number[]
): boolean {
  if (weeklyOption === "every") return true;

  const week = getWeekOfMonth(date);

  switch (weeklyOption) {
    case "week13":
      return week === 1 || week === 3;
    case "week24":
      return week === 2 || week === 4;
    case "custom":
      return customWeeks ? customWeeks.includes(week) : false;
    default:
      return true;
  }
}

// ─── Core Functions ──────────────────────────────────────

/**
 * Generate all match dates for a given month based on a schedule pattern.
 *
 * @param year - Target year (e.g. 2026)
 * @param month - Target month (1-12)
 * @param pattern - The schedule pattern
 * @returns Array of GeneratedMatch objects
 */
export function generateMatchDates(
  year: number,
  month: number,
  pattern: SchedulePattern
): GeneratedMatch[] {
  // Calendar-based mode: use selectedDates directly
  if (pattern.selectedDates && pattern.selectedDates.length > 0) {
    return pattern.selectedDates
      .filter((d) => d.startsWith(`${year}-${String(month).padStart(2, "0")}`))
      .sort()
      .map((dateStr) => {
        const date = new Date(dateStr);
        return buildGeneratedMatch(dateStr, date.getDay(), pattern);
      });
  }

  // Legacy mode: use daysOfWeek + weeklyOption
  if (pattern.daysOfWeek.length === 0) return [];

  const results: GeneratedMatch[] = [];

  // Iterate through every day of the target month
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0=Sun..6=Sat

    // Check if this day matches the pattern's daysOfWeek
    if (!pattern.daysOfWeek.includes(dayOfWeek)) continue;

    // Check weekly option
    if (!matchesWeeklyOption(date, pattern.weeklyOption, pattern.customWeeks))
      continue;

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    results.push(buildGeneratedMatch(dateStr, dayOfWeek, pattern));
  }

  return results;
}

/** Build a GeneratedMatch from a date string and pattern, deriving field values by match type */
function buildGeneratedMatch(
  dateStr: string,
  dayOfWeek: number,
  pattern: SchedulePattern
): GeneratedMatch {
  const startTime = `${dateStr}T${pattern.hour.padStart(2, "0")}:${pattern.minute.padStart(2, "0")}`;

  const isTeamMatch = pattern.matchType === "team_match";
  const isTraining = pattern.matchType === "training";

  const entryPoints = isTeamMatch ? 0 : (pattern.entryPoints ?? 0);
  const rentalFee = isTeamMatch ? 0 : (pattern.rentalFee ?? 0);
  const rentalAvailable = isTeamMatch ? false : (pattern.rentalAvailable ?? false);
  const bankAccount = isTeamMatch ? null : (pattern.bankAccount ?? null);
  const goalieFree = (isTeamMatch || isTraining) ? false : (pattern.goalieFree ?? false);

  const maxGuests = isTraining ? (pattern.maxGuests ?? null) : null;
  const maxSkaters = isTeamMatch
    ? 1
    : isTraining
      ? (maxGuests ?? 999)
      : (pattern.maxSkaters ?? 20);
  const maxGoalies = (isTeamMatch || isTraining) ? 0 : (pattern.maxGoalies ?? 2);

  return {
    date: dateStr,
    dayOfWeek,
    startTime,
    patternId: pattern.id,
    rinkId: pattern.rinkId,
    matchType: pattern.matchType,
    entryPoints,
    bankAccount,
    maxSkaters,
    maxGoalies,
    maxGuests,
    goalieFree,
    rentalAvailable,
    rentalFee,
    description: pattern.description ?? null,
  };
}

// ─── Previous Month Grouping ─────────────────────────────

interface PreviousMatch {
  rink_id: string;
  start_time: string; // UTC ISO string
  match_type: MatchType;
  entry_points: number;
  rental_fee: number;
  rental_available: boolean;
  bank_account: string | null;
  max_skaters: number;
  max_goalies: number;
  max_guests: number | null;
  goalie_free: boolean;
  description: string | null;
}

/**
 * Group previous month's matches into schedule patterns.
 * Matches are grouped by: rinkId + matchType + hour + minute + similar settings.
 */
export function groupMatchesByPattern(matches: PreviousMatch[]): SchedulePattern[] {
  if (matches.length === 0) return [];

  // Build a signature → matches map
  const groups = new Map<string, { matches: PreviousMatch[]; dates: Date[] }>();

  for (const match of matches) {
    // Parse start_time to KST
    const utcDate = new Date(match.start_time);
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

    const hour = String(kstDate.getUTCHours()).padStart(2, "0");
    const minute = String(kstDate.getUTCMinutes()).padStart(2, "0");

    // Create grouping key
    const key = [
      match.rink_id,
      match.match_type,
      hour,
      minute,
      String(match.entry_points),
      String(match.rental_fee),
      String(match.rental_available),
      match.bank_account || "",
      String(match.max_skaters),
      String(match.max_goalies),
      String(match.max_guests ?? ""),
      String(match.goalie_free),
    ].join("|");

    if (!groups.has(key)) {
      groups.set(key, { matches: [], dates: [] });
    }
    const group = groups.get(key)!;
    group.matches.push(match);
    group.dates.push(kstDate);
  }

  // Convert groups to patterns
  const patterns: SchedulePattern[] = [];
  let patternIndex = 0;

  for (const [, group] of groups) {
    const sample = group.matches[0];
    const kstDate = group.dates[0];
    const hour = String(new Date(kstDate).getUTCHours()).padStart(2, "0");
    const minute = String(new Date(kstDate).getUTCMinutes()).padStart(2, "0");

    // Collect all days of the week from this group
    const daysOfWeek = [...new Set(group.dates.map((d) => d.getUTCDay()))].sort();

    // Determine weekly option
    const weeks = group.dates.map((d) => {
      // Create a date in KST to calculate week of month
      const kst = new Date(d);
      return getWeekOfMonth(new Date(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
    });
    const uniqueWeeks = [...new Set(weeks)].sort();

    let weeklyOption: WeeklyOption = "every";
    let customWeeks: number[] | undefined;

    // Heuristic: if fewer occurrences than expected for "every week", try to detect pattern
    const monthDaysCount = new Date(
      group.dates[0].getUTCFullYear(),
      group.dates[0].getUTCMonth() + 1,
      0
    ).getDate();
    const expectedEveryWeekCount = daysOfWeek.length * Math.floor(monthDaysCount / 7);

    if (group.matches.length < expectedEveryWeekCount * 0.7) {
      // Not every week — try to detect pattern
      const w13 = uniqueWeeks.every((w) => w === 1 || w === 3);
      const w24 = uniqueWeeks.every((w) => w === 2 || w === 4);

      if (w13 && uniqueWeeks.length <= 2) {
        weeklyOption = "week13";
      } else if (w24 && uniqueWeeks.length <= 2) {
        weeklyOption = "week24";
      } else {
        weeklyOption = "custom";
        customWeeks = uniqueWeeks;
      }
    }

    patternIndex++;
    patterns.push({
      id: `prev-${patternIndex}`,
      rinkId: sample.rink_id,
      daysOfWeek,
      hour,
      minute,
      weeklyOption,
      customWeeks,
      matchType: sample.match_type,
      entryPoints: sample.entry_points,
      bankAccount: sample.bank_account ?? undefined,
      maxSkaters: sample.max_skaters,
      maxGoalies: sample.max_goalies,
      maxGuests: sample.max_guests ?? undefined,
      goalieFree: sample.goalie_free,
      rentalAvailable: sample.rental_available,
      rentalFee: sample.rental_fee,
      description: sample.description ?? undefined,
    });
  }

  return patterns;
}
