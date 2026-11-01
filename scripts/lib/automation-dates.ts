/** A completed KST month is the default so delayed cron runs never skip a result. */
export function resolveRankingMonth(targetMonth?: string, now = new Date()): string {
  const explicitMonth = targetMonth?.trim();
  if (explicitMonth) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(explicitMonth)) {
      throw new Error(`Invalid TARGET_MONTH: ${explicitMonth} (expected YYYY-MM)`);
    }
    return explicitMonth;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}`;
}
